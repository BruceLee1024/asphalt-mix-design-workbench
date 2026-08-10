import type {
  AsphaltQualityRecord,
  BasicInfo,
  BlendDesign,
  MaterialSource,
  MarshallGroup,
  MarshallPoint,
  MarshallSpecimenRaw,
  OacResult,
  PerformanceTestRecord,
  ProjectLedger,
  ProjectReadiness,
  ReportVersion,
  ReviewIssue,
  SpecialtyParameters,
  SpecialtyCheck,
} from '../types';
import { calculateBinderBalance, calculateVolumetrics, round } from './math';
import { formatRequirement, getPerformanceRequirements } from './knowledge';

export interface LabStateInput {
  basicInfo: BasicInfo;
  projectLedger: ProjectLedger;
  asphaltQuality: AsphaltQualityRecord;
  materials: MaterialSource[];
  blendDesign: BlendDesign;
  gradingWarnings: string[];
  marshallGroups: MarshallGroup[];
  marshallData: MarshallPoint[];
  oacResult: OacResult | null;
  performanceRecords: PerformanceTestRecord[];
  reportVersion: ReportVersion;
  specialtyParams: SpecialtyParameters;
  specialtyChecks?: SpecialtyCheck[];
}

export function createDefaultProjectLedger(): ProjectLedger {
  const today = new Date().toISOString().slice(0, 10);
  return {
    projectCode: '',
    clientUnit: '',
    sampleCode: '',
    sampleLocation: '',
    samplingDate: today,
    testDate: today,
    tester: '',
    reviewer: '',
    approver: '',
    reportCode: '',
  };
}

export function createDefaultAsphaltQuality(): AsphaltQualityRecord {
  return {
    supplier: '沥青供应商',
    batchNo: 'LQ-2026-001',
    testReportNo: 'LQ-JC-001',
    penetration: 68,
    softeningPoint: 47.5,
    ductility: 100,
  };
}

export function createDefaultMaterialQuality(type: MaterialSource['type']): NonNullable<MaterialSource['quality']> {
  return {
    origin: '料场',
    specification: type === 'coarse' ? '碎石' : type === 'fine' ? '机制砂' : '矿粉',
    batchNo: '',
    testReportNo: '',
    flakiness: 0,
    crushingValue: 0,
    sandEquivalent: 0,
    hydrophilicCoefficient: 0,
    adhesionGrade: 0,
    minimumAdhesionGrade: 0,
  };
}

export function createDefaultReportVersion(): ReportVersion {
  return { status: 'draft', version: '0.1', frozenAt: '', dataHash: '' };
}

export function createDefaultSpecialtyParameters(): SpecialtyParameters {
  return {
    rap: {
      enabled: false,
      content: 0,
      asphaltContent: 0,
      moisture: 0,
      maxParticleSize: 0,
      falseParticleContent: 0,
      gradationMode: 'split',
      fractions: [
        { id: 'rap-fine', label: '细料', yield: 80, passRates: [] },
        { id: 'rap-coarse', label: '粗料', yield: 20, passRates: [] },
      ],
    },
    superpave: { nini: 8, ndes: 100, nmax: 160, pressureKpa: 600, angleDeg: 1.16, speedRpm: 30, gmmAtNdes: 0, gmmAtNmax: 0, asphaltContentAtNdes: 0 },
    sma: { vma: 0, vcadrc: 0, vcamix: 0, fiberContent: 0.3, draindownLoss: 0, cantabroLoss: 0 },
    additives: { highModulusAdditiveContent: 0, fiberType: '木质素纤维', antiStrippingAgentContent: 0 },
  };
}

export function createDefaultPerformanceRecords(basicInfo?: Pick<BasicInfo, 'mixType' | 'designMethod' | 'materialSystem' | 'projectDomain' | 'climate'>): PerformanceTestRecord[] {
  if (!basicInfo) {
    return [
      { id: 'water-stability', key: 'waterStability', label: '浸水马歇尔残留稳定度', value: 0, unit: '%', requirement: '>= 85 %', sourceId: 'perf-water-stability', sourceLabel: 'JTG F40', enabled: true, ok: null },
      { id: 'freeze-thaw', key: 'freezeThaw', label: '冻融劈裂残留强度比', value: 0, unit: '%', requirement: '>= 80 %', sourceId: 'perf-freeze-thaw', sourceLabel: 'JTG F40', enabled: true, ok: null },
      { id: 'rutting', key: 'rutting', label: '车辙动稳定度', value: 0, unit: '次/mm', requirement: '>= 3500 次/mm', sourceId: 'perf-rutting-modified', sourceLabel: 'JTG F40 / 项目性能要求', enabled: true, ok: null },
      { id: 'low-temperature', key: 'lowTemperature', label: '低温弯曲破坏应变', value: 0, unit: 'με', requirement: '>= 2300 με', sourceId: 'perf-low-temp', sourceLabel: 'JTG F40 / 高模量专项要求', enabled: true, ok: null },
    ];
  }
  return getPerformanceRequirements(basicInfo).map(rule => ({
    id: rule.id,
    key: rule.key as PerformanceTestRecord['key'],
    label: rule.label,
    value: 0,
    unit: rule.unit ?? '',
    requirement: formatRequirement(rule),
    sourceId: rule.id,
    sourceLabel: `${rule.source} ${rule.sourceVersion}`,
    sourceType: rule.severity === 'blocking' ? 'standard' : 'pending-review',
    condition: rule.condition,
    enabled: true,
    ok: null,
  }));
}

export function createMarshallGroups(baseOac: number, specimenCount: 3 | 4 = 3): MarshallGroup[] {
  return [-1, -0.5, 0, 0.5, 1].map(off => createMarshallGroup(round(baseOac + off, 1), specimenCount));
}

export function createMarshallGroup(oac: number, specimenCount: 3 | 4): MarshallGroup {
  return {
    id: `mg-${oac}`,
    oac,
    specimenCount,
    rawSpecimens: Array.from({ length: specimenCount }, (_, index) => ({
      id: `sp-${oac}-${index + 1}`,
      height: 63.5,
      massAir: 0,
      massWater: 0,
      massSsd: 0,
      gt: 0,
      ms: 0,
      fl: 0,
    })),
    point: { oac, den: 0, gt: 0, ms: 0, fl: 0, vv: 0, vma: 0, vfa: 0 },
    warnings: [],
    mode: 'raw',
  };
}

export function calculateMarshallGroup(group: MarshallGroup, basicInfo: Pick<BasicInfo, 'gammaSb'>): MarshallGroup {
  if (group.mode === 'average') {
    return { ...group, point: calculateVolumetrics({ ...group.point, oac: group.oac }, basicInfo), warnings: auditMarshallPoint(group.point) };
  }

  const complete = group.rawSpecimens.filter(isRawSpecimenComplete);
  const warnings: string[] = [];
  if (complete.length !== group.specimenCount) warnings.push(`${group.oac.toFixed(1)}% 油石比有 ${group.specimenCount - complete.length} 个试件未完整录入。`);

  const densities = complete.map(specimenBulkDensity);
  const gtValues = complete.map(s => s.gt);
  const msValues = complete.map(s => s.ms);
  const flValues = complete.map(s => s.fl);
  const heightValues = complete.map(s => s.height);

  if (coefficientOfVariation(densities) > 1.5) warnings.push(`${group.oac.toFixed(1)}% 毛体积密度离散性偏大。`);
  if (coefficientOfVariation(msValues) > 12) warnings.push(`${group.oac.toFixed(1)}% 稳定度离散性偏大。`);
  if (heightValues.some(h => h < 62.5 || h > 64.5)) warnings.push(`${group.oac.toFixed(1)}% 存在试件高度偏离 63.5mm 的记录。`);

  const point = calculateVolumetrics({
    oac: group.oac,
    den: round(average(densities), 3),
    gt: round(average(gtValues), 3),
    ms: round(average(msValues), 1),
    fl: round(average(flValues), 1),
    vv: 0,
    vma: 0,
    vfa: 0,
  }, basicInfo);

  return { ...group, point, warnings: [...warnings, ...auditMarshallPoint(point)] };
}

export function calculatePerformanceChecks(records: PerformanceTestRecord[], basicInfo?: Pick<BasicInfo, 'mixType' | 'designMethod' | 'materialSystem' | 'projectDomain' | 'climate'>): PerformanceTestRecord[] {
  const rules = basicInfo ? getPerformanceRequirements(basicInfo) : [];
  return records.map(record => {
    if (!record.enabled || record.value <= 0) return { ...record, ok: null };
    const rule = rules.find(item => item.id === record.sourceId || item.key === record.key);
    if (record.sourceType === 'project' && (!record.projectRequirement || record.projectRequirement <= 0)) {
      return {
        ...record,
        ok: null,
        requirement: '待填写项目阈值',
        sourceLabel: '项目自定义要求',
        condition: '项目级覆盖值',
      };
    }
    if (record.sourceType === 'project' && record.projectRequirement > 0) {
      const comparator = rule?.comparator ?? 'gte';
      const ok = comparator === 'lte'
        ? record.value <= record.projectRequirement
        : record.value >= record.projectRequirement;
      return {
        ...record,
        ok,
        requirement: `${comparator === 'lte' ? '≤' : '≥'} ${record.projectRequirement} ${record.unit}`,
        sourceLabel: '项目自定义要求',
        sourceType: 'project',
        condition: '项目级覆盖值',
      };
    }
    if (rule?.comparator === 'lte') return { ...record, ok: rule.severity === 'blocking' ? record.value <= (rule.range?.hi ?? Number.POSITIVE_INFINITY) : null, requirement: formatRequirement(rule), sourceLabel: `${rule.source} ${rule.sourceVersion}`, sourceType: rule.severity === 'blocking' ? 'standard' : 'pending-review', condition: rule.condition };
    if (rule?.comparator === 'gte') return { ...record, ok: rule.severity === 'blocking' ? record.value >= (rule.range?.lo ?? Number.NEGATIVE_INFINITY) : null, requirement: formatRequirement(rule), sourceLabel: `${rule.source} ${rule.sourceVersion}`, sourceType: rule.severity === 'blocking' ? 'standard' : 'pending-review', condition: rule.condition };
    if (record.key === 'permeability') return { ...record, ok: record.value <= 120 };
    return { ...record, ok: record.value >= 80 };
  });
}

export function getPerformanceConclusion(records: PerformanceTestRecord[]) {
  const enabled = records.filter(r => r.enabled && r.sourceType !== 'pending-review');
  if (enabled.some(r => r.ok === false)) return '需复核' as const;
  if (enabled.length === 0 || enabled.some(r => r.ok === null)) return '待补充' as const;
  return '已通过' as const;
}

export function getReviewIssues(state: LabStateInput): ReviewIssue[] {
  const now = new Date().toISOString();
  const issues: ReviewIssue[] = [];
  const add = (source: string, level: ReviewIssue['level'], title: string, detail: string, action: string) => {
    issues.push({ id: `${source}-${issues.length + 1}`, source, level, title, detail, action, owner: state.projectLedger.reviewer || '复核人', createdAt: now, closed: false });
  };

  if (!state.basicInfo.projName.trim()) add('项目台账', 'blocking', '工程名称缺失', '新建项目尚未填写工程名称。', '先在项目台账补全工程名称。');
  if (!state.basicInfo.projUnit.trim()) add('项目台账', 'blocking', '编制单位缺失', '新建项目尚未填写编制单位。', '先在项目台账补全编制单位。');
  if (!state.projectLedger.projectCode.trim()) add('项目台账', 'blocking', '工程编号缺失', '项目台账未填写工程编号。', '补录工程编号后继续设计。');
  if (!state.projectLedger.clientUnit.trim()) add('项目台账', 'blocking', '委托单位缺失', '项目台账未填写委托单位。', '补录委托单位。');
  if (!state.projectLedger.sampleCode.trim()) add('项目台账', 'blocking', '样品编号缺失', '样品编号为空，报告溯源能力不足。', '补录样品编号。');
  if (Math.abs(state.blendDesign.totalProportion - 100) > 0.2) add('原材料', 'warning', '材料比例合计异常', `当前合计 ${state.blendDesign.totalProportion.toFixed(1)}%。`, '调整材料比例至 100%。');
  state.materials.filter(material => material.type === 'coarse').forEach(material => {
    const quality = material.quality;
    if (quality?.minimumAdhesionGrade && (!quality.adhesionGrade || quality.adhesionGrade < quality.minimumAdhesionGrade)) {
      add('原材料', 'blocking', `${material.name} 黏附性不足`, `实测等级 ${quality.adhesionGrade || '未录入'}，项目最低要求 ${quality.minimumAdhesionGrade}。`, '补录黏附性试验或调整集料、抗剥落措施后复核。');
    }
  });
  if (state.specialtyParams.rap.enabled) {
    const yieldTotal = state.specialtyParams.rap.fractions.reduce((sum, fraction) => sum + fraction.yield, 0);
    if (Math.abs(yieldTotal - 100) > 0.2) add('RAP', 'blocking', 'RAP 分档产出率异常', `当前 RAP 分档产出率合计 ${yieldTotal.toFixed(1)}%，应为 100%。`, '调整 RAP 粗细料产出率后重新拟合。');
    if (state.oacResult) {
      const balance = calculateBinderBalance(state.oacResult.oac, state.specialtyParams.rap);
      if (!balance.ok) add('RAP', 'blocking', '应添加新沥青为负值', `目标 OAC ${balance.targetOac}% 小于 RAP 旧沥青贡献 ${balance.recycledAsphalt}%。`, '复核 RAP 掺量、RAP 沥青含量或目标 OAC。');
    }
  }
  state.gradingWarnings.forEach(w => add('级配合成', 'warning', '级配审查警告', w, '调整材料比例或筛分数据后复核。'));
  state.marshallGroups.flatMap(g => g.warnings).forEach(w => add('马歇尔', w.includes('未完整') ? 'blocking' : 'warning', '马歇尔原始记录问题', w, '补录原始记录或剔除异常试件并说明。'));
  if (!state.oacResult) add('OAC', 'blocking', 'OAC 尚未形成', '未完成最佳油石比推导。', '完成马歇尔数据录入并计算 OAC。');
  else state.oacResult.warnings.forEach(w => add('OAC', w.includes('未找到') ? 'blocking' : 'warning', 'OAC 推导警告', w, '复核曲线与共同合格区间。'));

  const performanceConclusion = getPerformanceConclusion(state.performanceRecords);
  if (performanceConclusion === '待补充') add('性能验证', 'warning', '性能验证待补充', '水稳定性、车辙、低温或渗水指标尚未完整录入。', '补录性能验证结果后再形成最终交付结论。');
  if (performanceConclusion === '需复核') add('性能验证', 'blocking', '性能验证不满足要求', '存在性能验证指标不合格。', '调整设计或复验后重新判定。');
  state.specialtyChecks?.forEach(check => {
    if (check.ok === false) add('专项校核', check.severity === 'blocking' ? 'blocking' : 'warning', `${check.label} 不满足`, check.message, '调整专项参数或重新设计后复核。');
    if (check.ok === null && check.severity === 'blocking') add('专项校核', 'warning', `${check.label} 待补充`, check.message, '补录专项校核参数。');
  });

  return issues;
}

export function getProjectReadiness(state: LabStateInput): ProjectReadiness {
  const issues = getReviewIssues(state);
  const blockers = issues.filter(i => i.level === 'blocking').map(i => i.title);
  const warnings = issues.filter(i => i.level === 'warning').map(i => i.title);
  const performanceConclusion = getPerformanceConclusion(state.performanceRecords);
  const canFreeze = blockers.length === 0 && Boolean(state.oacResult);
  const statusText = canFreeze
    ? performanceConclusion === '已通过' ? '可正式交付' : '目标配合比完成，性能验证待补充'
    : '存在阻塞项，暂不可冻结';
  return { canFreeze, blockers, warnings, statusText };
}

export function makeReportCode(ledger: ProjectLedger) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return ledger.reportCode.trim() || `AC-${datePart}-${ledger.sampleCode || '001'}`;
}

export function hashDesignState(value: unknown) {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function isReportStale(reportVersion: ReportVersion, dataHash: string) {
  return reportVersion.status === 'frozen' && reportVersion.dataHash !== dataHash;
}

function isRawSpecimenComplete(specimen: MarshallSpecimenRaw) {
  return Boolean(specimen.height && specimen.massAir && specimen.massWater && specimen.massSsd && specimen.gt && specimen.ms && specimen.fl);
}

function specimenBulkDensity(specimen: MarshallSpecimenRaw) {
  const volumeMass = specimen.massSsd - specimen.massWater;
  if (volumeMass <= 0) return 0;
  return specimen.massAir / volumeMass;
}

function auditMarshallPoint(point: MarshallPoint) {
  const warnings: string[] = [];
  if (!point.den || !point.gt || !point.ms || !point.fl) warnings.push(`${point.oac.toFixed(1)}% 平均值数据未完整。`);
  if (point.den && point.gt && point.den >= point.gt) warnings.push(`${point.oac.toFixed(1)}% 毛体积密度不应大于等于理论最大密度。`);
  return warnings;
}

function average(values: number[]) {
  const valid = values.filter(v => Number.isFinite(v) && v > 0);
  if (!valid.length) return 0;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

function coefficientOfVariation(values: number[]) {
  const valid = values.filter(v => Number.isFinite(v) && v > 0);
  if (valid.length < 2) return 0;
  const mean = average(valid);
  const variance = valid.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (valid.length - 1);
  return Math.sqrt(variance) / mean * 100;
}
