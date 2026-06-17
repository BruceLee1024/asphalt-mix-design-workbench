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
} from '../types';
import { calculateVolumetrics, round } from './math';

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
}

export function createDefaultProjectLedger(): ProjectLedger {
  const today = new Date().toISOString().slice(0, 10);
  return {
    projectCode: 'PRJ-AC-2026-001',
    clientUnit: 'XX建设管理有限公司',
    sampleCode: 'YP-AC-001',
    sampleLocation: '拌合站料仓取样',
    samplingDate: today,
    testDate: today,
    tester: '试验员',
    reviewer: '复核人',
    approver: '批准人',
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
  };
}

export function createDefaultReportVersion(): ReportVersion {
  return { status: 'draft', version: '0.1', frozenAt: '', dataHash: '' };
}

export function createDefaultPerformanceRecords(): PerformanceTestRecord[] {
  return [
    { id: 'water-stability', key: 'waterStability', label: '浸水马歇尔残留稳定度', value: 0, unit: '%', requirement: '≥ 80 %', enabled: true, ok: null },
    { id: 'rutting', key: 'rutting', label: '车辙动稳定度', value: 0, unit: '次/mm', requirement: '≥ 1000 次/mm', enabled: true, ok: null },
    { id: 'low-temperature', key: 'lowTemperature', label: '低温弯曲破坏应变', value: 0, unit: 'με', requirement: '≥ 2000 με', enabled: true, ok: null },
    { id: 'permeability', key: 'permeability', label: '渗水系数', value: 0, unit: 'mL/min', requirement: '≤ 120 mL/min', enabled: true, ok: null },
  ];
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

export function calculatePerformanceChecks(records: PerformanceTestRecord[]): PerformanceTestRecord[] {
  return records.map(record => {
    if (!record.enabled || record.value <= 0) return { ...record, ok: null };
    if (record.key === 'permeability') return { ...record, ok: record.value <= 120 };
    if (record.key === 'rutting') return { ...record, ok: record.value >= 1000 };
    if (record.key === 'lowTemperature') return { ...record, ok: record.value >= 2000 };
    return { ...record, ok: record.value >= 80 };
  });
}

export function getPerformanceConclusion(records: PerformanceTestRecord[]) {
  const enabled = records.filter(r => r.enabled);
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

  if (!state.projectLedger.projectCode.trim()) add('项目台账', 'warning', '工程编号缺失', '项目台账未填写工程编号。', '补录工程编号后重新冻结报告。');
  if (!state.projectLedger.sampleCode.trim()) add('项目台账', 'warning', '样品编号缺失', '样品编号为空，报告溯源能力不足。', '补录样品编号。');
  if (Math.abs(state.blendDesign.totalProportion - 100) > 0.2) add('原材料', 'warning', '材料比例合计异常', `当前合计 ${state.blendDesign.totalProportion.toFixed(1)}%。`, '调整材料比例至 100%。');
  state.gradingWarnings.forEach(w => add('级配合成', 'warning', '级配审查警告', w, '调整材料比例或筛分数据后复核。'));
  state.marshallGroups.flatMap(g => g.warnings).forEach(w => add('马歇尔', w.includes('未完整') ? 'blocking' : 'warning', '马歇尔原始记录问题', w, '补录原始记录或剔除异常试件并说明。'));
  if (!state.oacResult) add('OAC', 'blocking', 'OAC 尚未形成', '未完成最佳油石比推导。', '完成马歇尔数据录入并计算 OAC。');
  else state.oacResult.warnings.forEach(w => add('OAC', w.includes('未找到') ? 'blocking' : 'warning', 'OAC 推导警告', w, '复核曲线与共同合格区间。'));

  const performanceConclusion = getPerformanceConclusion(state.performanceRecords);
  if (performanceConclusion === '待补充') add('性能验证', 'warning', '性能验证待补充', '水稳定性、车辙、低温或渗水指标尚未完整录入。', '补录性能验证结果后再形成最终交付结论。');
  if (performanceConclusion === '需复核') add('性能验证', 'blocking', '性能验证不满足要求', '存在性能验证指标不合格。', '调整设计或复验后重新判定。');

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
