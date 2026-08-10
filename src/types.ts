export type RoadGrade = 'hw' | '2nd' | '3rd';
export type MixType = 'AC-13' | 'AC-16' | 'AC-20' | 'AC-25' | 'SMA-13' | 'OGFC-13' | 'HM-20' | 'RAP-AC-20' | 'CMA-13';
export type LayerPos = 'top' | 'mid' | 'bot';
export type StandardProfileId = 'jtg-f40-2004-jtg3410-2025' | 'jtg-f40-2004-jtge20-2011';
export type MaterialType = 'coarse' | 'fine' | 'filler' | 'rap' | 'fiber' | 'additive';
export type ReportStatus = 'draft' | 'frozen';
export type PerformanceStatus = 'pending' | 'passed' | 'failed';
export type ProjectDomain = 'road' | 'airport';
export type DesignMethod = 'marshall' | 'patent-oac' | 'superpave';
export type TrafficLevel = 'light' | 'medium' | 'heavy' | 'very-heavy';
export type MaterialSystem = 'base' | 'modified' | 'sma' | 'high-modulus' | 'rap' | 'cold-mix';

export interface BasicInfo {
  mixType: MixType;
  roadGrade: RoadGrade;
  layerPos: LayerPos;
  standardProfileId: StandardProfileId;
  projectDomain: ProjectDomain;
  designMethod: DesignMethod;
  trafficLevel: TrafficLevel;
  esals: number;
  materialSystem: MaterialSystem;
  climate: string;
  projName: string;
  projUnit: string;
  asphaltGrade: string;
  denB: number;
  gammaSb: number;
  gammaSa: number;
  wa: number;
}

export interface RapParameters {
  enabled: boolean;
  content: number;
  asphaltContent: number;
  moisture: number;
  maxParticleSize: number;
  falseParticleContent: number;
  gradationMode: 'single' | 'split';
  fractions: RapFraction[];
}

export interface RapFraction {
  id: string;
  label: string;
  yield: number;
  passRates: number[];
}

export interface SuperpaveParameters {
  nini: number;
  ndes: number;
  nmax: number;
  pressureKpa: number;
  angleDeg: number;
  speedRpm: number;
  gmmAtNdes: number;
  gmmAtNmax: number;
  asphaltContentAtNdes: number;
}

export interface SmaParameters {
  vma: number;
  vcadrc: number;
  vcamix: number;
  fiberContent: number;
  draindownLoss: number;
  cantabroLoss: number;
}

export interface AdditiveParameters {
  highModulusAdditiveContent: number;
  fiberType: string;
  antiStrippingAgentContent: number;
}

export interface SpecialtyParameters {
  rap: RapParameters;
  superpave: SuperpaveParameters;
  sma: SmaParameters;
  additives: AdditiveParameters;
}

export interface SpecialtyParameterPatch {
  rap?: Partial<RapParameters>;
  superpave?: Partial<SuperpaveParameters>;
  sma?: Partial<SmaParameters>;
  additives?: Partial<AdditiveParameters>;
}

export interface GradingData {
  passRates: number[];
}

export interface MaterialSource {
  id: string;
  name: string;
  type: MaterialType;
  proportion: number;
  gammaSb: number;
  gammaSa: number;
  absorption: number;
  passRates: number[];
  quality?: MaterialQualityRecord;
}

export interface BlendDesign {
  passRates: number[];
  totalProportion: number;
  warnings: string[];
}

export interface MarshallPoint {
  oac: number;
  den: number;
  gt: number;
  ms: number;
  fl: number;
  vv: number;
  vma: number;
  vfa: number;
}

export type MarshallSpecimen = MarshallPoint;

export interface ProjectLedger {
  projectCode: string;
  clientUnit: string;
  sampleCode: string;
  sampleLocation: string;
  samplingDate: string;
  testDate: string;
  tester: string;
  reviewer: string;
  approver: string;
  reportCode: string;
}

export interface ProjectRecord {
  id: string;
  projectCode: string;
  name: string;
  clientUnit: string;
  createdAt: string;
  updatedAt: string;
}

export interface MixDesignRecordSummary {
  id: string;
  projectId: string;
  name: string;
  mixType: MixType;
  sampleCode: string;
  testDate: string;
  reportCode: string;
  reportStatus: ReportStatus;
  updatedAt: string;
}

export interface MaterialQualityRecord {
  origin: string;
  specification: string;
  batchNo: string;
  testReportNo: string;
  flakiness: number;
  crushingValue: number;
  sandEquivalent: number;
  hydrophilicCoefficient: number;
  adhesionGrade: number;
  minimumAdhesionGrade: number;
}

export interface AsphaltQualityRecord {
  supplier: string;
  batchNo: string;
  testReportNo: string;
  penetration: number;
  softeningPoint: number;
  ductility: number;
}

export interface MarshallSpecimenRaw {
  id: string;
  height: number;
  massAir: number;
  massWater: number;
  massSsd: number;
  gt: number;
  ms: number;
  fl: number;
}

export interface MarshallGroup {
  id: string;
  oac: number;
  specimenCount: 3 | 4;
  rawSpecimens: MarshallSpecimenRaw[];
  point: MarshallPoint;
  warnings: string[];
  mode: 'raw' | 'average';
}

export interface PerformanceTestRecord {
  id: string;
  key: 'waterStability' | 'freezeThaw' | 'rutting' | 'lowTemperature' | 'permeability' | 'schellenberg' | 'cantabro' | 'cdf';
  label: string;
  value: number;
  unit: string;
  requirement: string;
  sourceId?: string;
  sourceLabel?: string;
  sourceType?: 'standard' | 'project' | 'pending-review';
  projectRequirement?: number;
  condition?: string;
  enabled: boolean;
  ok: boolean | null;
}

export interface ReviewIssue {
  id: string;
  source: string;
  level: 'warning' | 'blocking';
  title: string;
  detail: string;
  action: string;
  owner: string;
  createdAt: string;
  closed: boolean;
}

export interface ReportVersion {
  status: ReportStatus;
  version: string;
  frozenAt: string;
  dataHash: string;
}

export interface ProjectReadiness {
  canFreeze: boolean;
  blockers: string[];
  warnings: string[];
  statusText: string;
}

export interface RangeSpec {
  lo: number;
  hi: number | null;
}

export interface MarshallSpec {
  ms: RangeSpec;
  fl: RangeSpec;
  vv: RangeSpec;
  vma: RangeSpec;
  vfa: RangeSpec;
}

export interface StandardProfile {
  id: StandardProfileId;
  label: string;
  designSpec: string;
  testSpec: string;
  effectiveFrom: string;
}

export interface PerformanceCheck {
  key: keyof Pick<MarshallPoint, 'ms' | 'fl' | 'vv' | 'vma' | 'vfa'>;
  label: string;
  value: number;
  requirement: string;
  ok: boolean;
}

export type StepStatus = 'idle' | 'editing' | 'warning' | 'passed' | 'blocked';

export interface StepWorkflowStatus {
  step: number;
  status: StepStatus;
  label: string;
  canEnter: boolean;
  warningCount: number;
  reasons: string[];
}

export interface InputAudit {
  materialWarnings: string[];
  gradationWarnings: string[];
  marshallWarnings: string[];
  oacWarnings: string[];
  reportWarnings: string[];
  conclusion: '未完成' | '需复核' | '可出具';
  performanceConclusion?: '待补充' | '需复核' | '已通过';
}

export interface OacResult {
  method?: DesignMethod;
  sourceId?: string;
  oac: number;
  oac1: number;
  oac2: number | null;
  oacMin: number | null;
  oacMax: number | null;
  a1: number;
  a2: number;
  a3: number;
  a4: number | null;
  den: number;
  ms: number;
  fl: number;
  vv: number;
  vma: number;
  vfa: number;
  checks: PerformanceCheck[];
  warnings: string[];
}

export interface SpecialtyCheck {
  id: string;
  label: string;
  value: number | string;
  requirement: string;
  ok: boolean | null;
  sourceId: string;
  message: string;
  severity: 'info' | 'warning' | 'blocking';
}

export interface AiMessage {
  role: 'user' | 'assistant' | 'loading';
  content: string;
}
