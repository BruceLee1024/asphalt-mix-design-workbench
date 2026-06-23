import type { BasicInfo, MaterialSystem, MixType } from '../../types';
import type { ConstructionKnowledgeRecord, GradationKnowledgeRecord, KnowledgeRecord, MarshallSpecKnowledgeRecord, PerformanceKnowledgeRecord } from './types';
import { CONSTRUCTION_KNOWLEDGE } from './construction';
import { GRADATION_KNOWLEDGE } from './gradation';
import { MATERIAL_KNOWLEDGE } from './materials';
import { PERFORMANCE_KNOWLEDGE } from './performance';
import { STANDARD_KNOWLEDGE } from './standards';
import { TERM_KNOWLEDGE } from './terms';

export { GRADATION_KNOWLEDGE } from './gradation';

export const KNOWLEDGE_VERSION = 'kb-2026.06.23-v1';

export const MARSHALL_SPEC_KNOWLEDGE: Record<string, MarshallSpecKnowledgeRecord> = {
  hw: {
    id: 'marshall-hw',
    label: '高速公路 / 一级公路马歇尔体积指标',
    source: 'JTG F40',
    sourceVersion: '2004',
    applicableMixTypes: ['AC-13', 'AC-16', 'AC-20', 'AC-25', 'HM-20', 'RAP-AC-20'],
    applicableMethods: ['marshall', 'patent-oac'],
    condition: '高速公路 / 一级公路 AC 类目标配合比',
    severity: 'blocking',
    message: '用于 AC 类马歇尔 OAC 共同合格区间判定。',
    roadGrade: 'hw',
    ms: { lo: 8, hi: null },
    fl: { lo: 20, hi: 40 },
    vv: { lo: 3, hi: 5 },
    vma: { lo: 15, hi: null },
    vfa: { lo: 65, hi: 75 },
  },
  '2nd': {
    id: 'marshall-2nd',
    label: '二级公路马歇尔体积指标',
    source: 'JTG F40',
    sourceVersion: '2004',
    applicableMixTypes: ['AC-13', 'AC-16', 'AC-20', 'AC-25', 'HM-20', 'RAP-AC-20'],
    applicableMethods: ['marshall', 'patent-oac'],
    condition: '二级公路 AC 类目标配合比',
    severity: 'blocking',
    message: '用于 AC 类马歇尔 OAC 共同合格区间判定。',
    roadGrade: '2nd',
    ms: { lo: 6, hi: null },
    fl: { lo: 20, hi: 45 },
    vv: { lo: 3, hi: 6 },
    vma: { lo: 14, hi: null },
    vfa: { lo: 60, hi: 75 },
  },
  '3rd': {
    id: 'marshall-3rd',
    label: '三级及以下公路马歇尔体积指标',
    source: 'JTG F40',
    sourceVersion: '2004',
    applicableMixTypes: ['AC-13', 'AC-16', 'AC-20', 'AC-25', 'HM-20', 'RAP-AC-20'],
    applicableMethods: ['marshall', 'patent-oac'],
    condition: '三级及以下公路 AC 类目标配合比',
    severity: 'blocking',
    message: '用于 AC 类马歇尔 OAC 共同合格区间判定。',
    roadGrade: '3rd',
    ms: { lo: 5, hi: null },
    fl: { lo: 20, hi: 45 },
    vv: { lo: 3, hi: 6 },
    vma: { lo: 14, hi: null },
    vfa: { lo: 60, hi: 75 },
  },
};

export const ALL_KNOWLEDGE_RECORDS: KnowledgeRecord[] = [
  ...STANDARD_KNOWLEDGE,
  ...TERM_KNOWLEDGE,
  ...MATERIAL_KNOWLEDGE,
  ...Object.values(GRADATION_KNOWLEDGE),
  ...Object.values(MARSHALL_SPEC_KNOWLEDGE),
  ...PERFORMANCE_KNOWLEDGE,
  ...CONSTRUCTION_KNOWLEDGE,
];

export function getGradationSpec(mixType: MixType): GradationKnowledgeRecord {
  return GRADATION_KNOWLEDGE[mixType] ?? GRADATION_KNOWLEDGE['AC-13'];
}

export function getMarshallSpecRecord(roadGrade: string): MarshallSpecKnowledgeRecord {
  return MARSHALL_SPEC_KNOWLEDGE[roadGrade] ?? MARSHALL_SPEC_KNOWLEDGE.hw;
}

export function getPerformanceRequirements(basicInfo: Pick<BasicInfo, 'mixType' | 'designMethod' | 'materialSystem' | 'projectDomain'>): PerformanceKnowledgeRecord[] {
  const systems = resolveMaterialSystems(basicInfo);
  return PERFORMANCE_KNOWLEDGE.filter(rule => applies(rule, basicInfo.mixType, basicInfo.designMethod) && materialApplies(rule.materialSystems, systems))
    .filter(rule => basicInfo.projectDomain === 'airport' || rule.key !== 'cdf')
    .filter((rule, index, all) => all.findIndex(candidate => candidate.key === rule.key) === index);
}

export function getConstructionGuidance(basicInfo: Pick<BasicInfo, 'mixType' | 'designMethod' | 'materialSystem'>): ConstructionKnowledgeRecord[] {
  const systems = resolveMaterialSystems(basicInfo);
  return CONSTRUCTION_KNOWLEDGE.filter(rule => applies(rule, basicInfo.mixType, basicInfo.designMethod) && materialApplies(rule.materialSystems, systems));
}

export function getApplicableKnowledge(basicInfo: Pick<BasicInfo, 'mixType' | 'designMethod' | 'materialSystem' | 'projectDomain'>): KnowledgeRecord[] {
  const systems = resolveMaterialSystems(basicInfo);
  return ALL_KNOWLEDGE_RECORDS.filter(record => applies(record, basicInfo.mixType, basicInfo.designMethod))
    .filter(record => !('materialSystems' in record) || materialApplies((record as PerformanceKnowledgeRecord).materialSystems, systems))
    .filter(record => basicInfo.projectDomain === 'airport' || record.id !== 'perf-airport-cdf');
}

export function formatRequirement(record: Pick<KnowledgeRecord, 'range' | 'value' | 'unit'>): string {
  const unit = record.unit ? ` ${record.unit}` : '';
  if (record.range) {
    if (record.range.hi === null) return `>= ${record.range.lo}${unit}`;
    if (record.range.lo === 0) return `<= ${record.range.hi}${unit}`;
    return `${record.range.lo}~${record.range.hi}${unit}`;
  }
  return record.value === undefined ? '-' : `${record.value}${unit}`;
}

function applies(record: KnowledgeRecord, mixType: MixType, method: BasicInfo['designMethod']) {
  const mixOk = record.applicableMixTypes === 'all' || record.applicableMixTypes.includes(mixType);
  const methodOk = record.applicableMethods === 'all' || record.applicableMethods.includes(method);
  return mixOk && methodOk;
}

function materialApplies(ruleSystems: MaterialSystem[] | 'all', systems: MaterialSystem[]) {
  return ruleSystems === 'all' || ruleSystems.some(system => systems.includes(system));
}

function resolveMaterialSystems(basicInfo: Pick<BasicInfo, 'mixType' | 'materialSystem'>): MaterialSystem[] {
  const systems = new Set<MaterialSystem>([basicInfo.materialSystem]);
  if (basicInfo.mixType === 'SMA-13') systems.add('sma');
  if (basicInfo.mixType === 'HM-20') systems.add('high-modulus');
  if (basicInfo.mixType === 'RAP-AC-20') systems.add('rap');
  return [...systems];
}
