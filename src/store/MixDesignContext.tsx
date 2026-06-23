import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type {
  AsphaltQualityRecord,
  BasicInfo,
  BlendDesign,
  GradingData,
  InputAudit,
  MaterialSource,
  MarshallGroup,
  MarshallSpecimen,
  MarshallSpecimenRaw,
  OacResult,
  PerformanceTestRecord,
  ProjectLedger,
  ProjectRecord,
  ProjectReadiness,
  ReportVersion,
  ReviewIssue,
  MixDesignRecordSummary,
  SpecialtyCheck,
  SpecialtyParameterPatch,
  SpecialtyParameters,
  StandardProfile,
  StepWorkflowStatus,
} from '../types';
import { ASPHALT_DENSITIES, DENSE_AC_TYPES, GRADS, SPECS, STANDARD_PROFILES } from '../lib/constants';
import { buildSpecialtyChecks, calculateBlendGradation, calculateOacAnalysis, calculatePatentOac, calculateSuperpaveResult, calculateTheoreticalMaxDensity, calculateVolumetrics, fitBlendToMidpoint, validateGradation } from '../lib/math';
import { getInputAudit, getWorkflowStatus } from '../lib/workflow';
import {
  calculateMarshallGroup,
  calculatePerformanceChecks,
  createDefaultAsphaltQuality,
  createDefaultMaterialQuality,
  createDefaultPerformanceRecords,
  createDefaultProjectLedger,
  createDefaultReportVersion,
  createDefaultSpecialtyParameters,
  createMarshallGroups,
  getPerformanceConclusion,
  getProjectReadiness,
  getReviewIssues,
  hashDesignState,
  makeReportCode,
} from '../lib/lab';
import { getApplicableKnowledge, getConstructionGuidance, KNOWLEDGE_VERSION } from '../lib/knowledge';
import type { ConstructionKnowledgeRecord, KnowledgeRecord } from '../lib/knowledge/types';

const STORAGE_KEY = 'ac_mix_design_v2';
const PORTFOLIO_VERSION = 1;

interface MixDesignState {
  step: number;
  stepDone: boolean[];
  basicInfo: BasicInfo;
  projectLedger: ProjectLedger;
  asphaltQuality: AsphaltQualityRecord;
  materials: MaterialSource[];
  oacInit: number;
  marshallData: MarshallSpecimen[];
  marshallGroups: MarshallGroup[];
  oacResult: OacResult | null;
  performanceRecords: PerformanceTestRecord[];
  specialtyParams: SpecialtyParameters;
  reportVersion: ReportVersion;
}

interface MixDesignRecord {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  state: MixDesignState;
}

interface MixDesignPortfolio {
  version: number;
  activeProjectId: string;
  activeDesignId: string;
  projects: ProjectRecord[];
  designs: MixDesignRecord[];
}

interface MixDesignContextType extends MixDesignState {
  setStep: (step: number) => void;
  markStepDone: (step: number) => void;
  resetProject: () => void;
  exportJson: () => string;
  importJson: (json: string) => void;
  portfolio: MixDesignPortfolio;
  activeProject: ProjectRecord;
  activeDesign: MixDesignRecordSummary;
  projectDesigns: MixDesignRecordSummary[];
  createProject: () => void;
  duplicateActiveDesign: () => void;
  createDesignForActiveProject: () => void;
  switchProject: (id: string) => void;
  switchDesign: (id: string) => void;
  deleteProject: (id: string) => void;
  deleteDesign: (id: string) => void;
  projectLedger: ProjectLedger;
  updateProjectLedger: (updates: Partial<ProjectLedger>) => void;
  asphaltQuality: AsphaltQualityRecord;
  updateAsphaltQuality: (updates: Partial<AsphaltQualityRecord>) => void;

  standardProfile: StandardProfile;
  isDenseAc: boolean;
  basicInfo: BasicInfo;
  updateBasicInfo: (updates: Partial<BasicInfo>) => void;

  materials: MaterialSource[];
  updateMaterial: (id: string, updates: Partial<MaterialSource>) => void;
  updateMaterialPassRate: (id: string, index: number, value: number) => void;
  addMaterial: () => void;
  removeMaterial: (id: string) => void;
  fillDefaultMaterials: () => void;
  fitMaterialsToMidpoint: () => void;

  gradingData: GradingData;
  blendDesign: BlendDesign;
  gradingWarnings: string[];
  inputAudit: InputAudit;
  workflowStatus: StepWorkflowStatus[];
  updateGradingPassRate: (index: number, value: number) => void;
  fillDefaultGrading: () => void;

  tmrdResult: number | null;
  calcTMRD: (oacInit: number) => void;

  oacInit: number;
  setOacInit: (val: number) => void;
  marshallData: MarshallSpecimen[];
  marshallGroups: MarshallGroup[];
  setMarshallData: (data: MarshallSpecimen[]) => void;
  updateMarshallPoint: (index: number, updates: Partial<MarshallSpecimen>) => void;
  updateMarshallRawSpecimen: (groupIndex: number, specimenIndex: number, updates: Partial<MarshallSpecimenRaw>) => void;
  updateMarshallGroupMode: (groupIndex: number, mode: MarshallGroup['mode']) => void;
  updateMarshallSpecimenCount: (groupIndex: number, specimenCount: 3 | 4) => void;
  fillSampleMarshall: () => void;
  calcOAC: () => boolean;

  oacResult: OacResult | null;
  performanceRecords: PerformanceTestRecord[];
  updatePerformanceRecord: (id: string, updates: Partial<PerformanceTestRecord>) => void;
  specialtyParams: SpecialtyParameters;
  updateSpecialtyParams: (updates: SpecialtyParameterPatch) => void;
  specialtyChecks: SpecialtyCheck[];
  constructionGuidance: ConstructionKnowledgeRecord[];
  applicableKnowledge: KnowledgeRecord[];
  knowledgeVersion: string;
  performanceConclusion: '待补充' | '需复核' | '已通过';
  reviewIssues: ReviewIssue[];
  projectReadiness: ProjectReadiness;
  reportVersion: ReportVersion;
  freezeReport: () => boolean;
  designDataHash: string;
}

const MixDesignContext = createContext<MixDesignContextType | undefined>(undefined);

const defaultBasicInfo: BasicInfo = {
  mixType: 'AC-13',
  roadGrade: 'hw',
  layerPos: 'top',
  standardProfileId: 'jtg-f40-2004-jtg3410-2025',
  projectDomain: 'road',
  designMethod: 'marshall',
  trafficLevel: 'heavy',
  esals: 12000000,
  materialSystem: 'modified',
  climate: '1区（夏炎热冬严寒）',
  projName: 'XX高速公路路面工程',
  projUnit: 'XX工程检测有限公司',
  asphaltGrade: '70A',
  denB: 1.030,
  gammaSb: 2.710,
  gammaSa: 2.745,
  wa: 0.48,
};

function createDefaultMaterials(mixType: keyof typeof GRADS): MaterialSource[] {
  const g = GRADS[mixType];
  const templates = [
    { id: 'coarse-1', name: '10-15mm 碎石', type: 'coarse' as const, proportion: 32, passRates: g.sieves.map(s => s >= 16 ? 100 : s >= 13.2 ? 72 : s >= 9.5 ? 16 : s >= 4.75 ? 3 : 0) },
    { id: 'coarse-2', name: '5-10mm 碎石', type: 'coarse' as const, proportion: 28, passRates: g.sieves.map(s => s >= 9.5 ? 100 : s >= 4.75 ? 38 : s >= 2.36 ? 6 : 0) },
    { id: 'fine-1', name: '机制砂', type: 'fine' as const, proportion: 34, passRates: g.sieves.map(s => s >= 4.75 ? 100 : s >= 2.36 ? 78 : s >= 1.18 ? 55 : s >= 0.6 ? 36 : s >= 0.3 ? 22 : s >= 0.15 ? 12 : 5) },
    { id: 'filler-1', name: '矿粉', type: 'filler' as const, proportion: 6, passRates: g.sieves.map(s => s >= 0.15 ? 100 : s >= 0.075 ? 92 : 85) },
  ];
  return templates.map(t => ({
    ...t,
    gammaSb: t.type === 'filler' ? 2.720 : 2.710,
    gammaSa: t.type === 'filler' ? 2.760 : 2.745,
    absorption: t.type === 'filler' ? 0 : 0.48,
    quality: createDefaultMaterialQuality(t.type),
  }));
}

function createDefaultState(): MixDesignState {
  return {
    step: 0,
    stepDone: [false, false, false, false, false, false, false, false],
    basicInfo: defaultBasicInfo,
    projectLedger: createDefaultProjectLedger(),
    asphaltQuality: createDefaultAsphaltQuality(),
    materials: createDefaultMaterials('AC-13'),
    oacInit: 4.5,
    marshallData: createMarshallRows(4.5),
    marshallGroups: createMarshallGroups(4.5),
    oacResult: null,
    performanceRecords: createDefaultPerformanceRecords(defaultBasicInfo),
    specialtyParams: createDefaultSpecialtyParameters(),
    reportVersion: createDefaultReportVersion(),
  };
}

function createMarshallRows(baseOac: number): MarshallSpecimen[] {
  return [-1, -0.5, 0, 0.5, 1].map(off => ({
    oac: parseFloat((baseOac + off).toFixed(1)),
    den: 0,
    gt: 0,
    ms: 0,
    fl: 0,
    vv: 0,
    vma: 0,
    vfa: 0,
  }));
}

export function MixDesignProvider({ children }: { children: ReactNode }) {
  const initialWorkspace = useMemo(() => loadWorkspace(), []);
  const [portfolio, setPortfolio] = useState<MixDesignPortfolio>(initialWorkspace.portfolio);
  const [state, setState] = useState<MixDesignState>(initialWorkspace.state);
  const [tmrdResult, setTmrdResult] = useState<number | null>(null);

  useEffect(() => {
    setPortfolio(prev => syncActiveDesign(prev, state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  }, [portfolio]);

  const standardProfile = STANDARD_PROFILES[state.basicInfo.standardProfileId];
  const isDenseAc = DENSE_AC_TYPES.includes(state.basicInfo.mixType as any);

  const blendDesign = useMemo(() => calculateBlendGradation(state.materials), [state.materials]);
  const gradingWarnings = useMemo(() => {
    const g = GRADS[state.basicInfo.mixType];
    return [...blendDesign.warnings, ...validateGradation(blendDesign.passRates, g)];
  }, [blendDesign, state.basicInfo.mixType]);
  const auditInput = useMemo(() => ({
    basicInfo: state.basicInfo,
    projectLedger: state.projectLedger,
    blendDesign,
    gradingWarnings,
    marshallData: state.marshallData,
    oacResult: state.oacResult,
  }), [blendDesign, gradingWarnings, state.basicInfo, state.marshallData, state.oacResult, state.projectLedger]);
  const inputAudit = useMemo(() => getInputAudit(auditInput), [auditInput]);
  const workflowStatus = useMemo(() => getWorkflowStatus(auditInput), [auditInput]);
  const performanceRecords = useMemo(() => calculatePerformanceChecks(state.performanceRecords, state.basicInfo), [state.performanceRecords, state.basicInfo]);
  const performanceConclusion = useMemo(() => getPerformanceConclusion(performanceRecords), [performanceRecords]);
  const specialtyChecks = useMemo(() => buildSpecialtyChecks(state.basicInfo, state.specialtyParams), [state.basicInfo, state.specialtyParams]);
  const constructionGuidance = useMemo(() => getConstructionGuidance(state.basicInfo), [state.basicInfo]);
  const applicableKnowledge = useMemo(() => getApplicableKnowledge(state.basicInfo), [state.basicInfo]);
  const labInput = useMemo(() => ({
    basicInfo: state.basicInfo,
    projectLedger: state.projectLedger,
    asphaltQuality: state.asphaltQuality,
    materials: state.materials,
    blendDesign,
    gradingWarnings,
    marshallGroups: state.marshallGroups,
    marshallData: state.marshallData,
    oacResult: state.oacResult,
    performanceRecords,
    reportVersion: state.reportVersion,
    specialtyParams: state.specialtyParams,
    specialtyChecks,
  }), [blendDesign, gradingWarnings, performanceRecords, specialtyChecks, state.asphaltQuality, state.basicInfo, state.marshallData, state.marshallGroups, state.materials, state.oacResult, state.projectLedger, state.reportVersion, state.specialtyParams]);
  const reviewIssues = useMemo(() => getReviewIssues(labInput), [labInput]);
  const projectReadiness = useMemo(() => getProjectReadiness(labInput), [labInput]);
  const designDataHash = useMemo(() => hashDesignState({
    basicInfo: state.basicInfo,
    projectLedger: state.projectLedger,
    asphaltQuality: state.asphaltQuality,
    materials: state.materials,
    blendDesign,
    marshallData: state.marshallData,
    marshallGroups: state.marshallGroups,
    oacResult: state.oacResult,
    performanceRecords,
    specialtyParams: state.specialtyParams,
    specialtyChecks,
    constructionGuidance,
    knowledgeVersion: KNOWLEDGE_VERSION,
  }), [blendDesign, performanceRecords, state.asphaltQuality, state.basicInfo, state.marshallData, state.marshallGroups, state.materials, state.oacResult, state.projectLedger]);
  const activeProject = portfolio.projects.find(project => project.id === portfolio.activeProjectId) ?? portfolio.projects[0];
  const activeDesignRecord = portfolio.designs.find(design => design.id === portfolio.activeDesignId) ?? portfolio.designs[0];
  const activeDesign = toDesignSummary(activeDesignRecord);
  const projectDesigns = portfolio.designs.filter(design => design.projectId === activeProject.id).map(toDesignSummary);

  const setStep = (step: number) => setState(prev => ({ ...prev, step }));
  const markStepDone = (s: number) => setState(prev => {
    const stepDone = [...prev.stepDone];
    stepDone[s] = true;
    return { ...prev, stepDone };
  });

  const resetProject = () => {
    const next = createPortfolioFromState(createDefaultState());
    setTmrdResult(null);
    setPortfolio(next);
    setState(next.designs[0].state);
  };

  const exportJson = () => JSON.stringify(syncActiveDesign(portfolio, state), null, 2);
  const importJson = (json: string) => {
    const parsed = JSON.parse(json) as Partial<MixDesignState> | MixDesignPortfolio;
    const workspace = loadWorkspaceFromParsed(parsed);
    setPortfolio(workspace.portfolio);
    setState(workspace.state);
  };

  const createProject = () => {
    const nextState = createDefaultState();
    const now = new Date().toISOString();
    const index = portfolio.projects.length + 1;
    nextState.basicInfo = { ...nextState.basicInfo, projName: `新建工程 ${index}` };
    nextState.projectLedger = { ...nextState.projectLedger, projectCode: `PRJ-AC-${new Date().getFullYear()}-${String(index).padStart(3, '0')}`, sampleCode: 'YP-AC-001' };
    const project = projectFromState(nextState, now);
    const design = designFromState(project.id, nextState, now);
    setPortfolio(prev => ({ ...prev, activeProjectId: project.id, activeDesignId: design.id, projects: [...prev.projects, project], designs: [...prev.designs, design] }));
    setState(nextState);
    setTmrdResult(null);
  };

  const createDesignForActiveProject = () => {
    const now = new Date().toISOString();
    const nextState = normalizeState({
      ...createDefaultState(),
      basicInfo: { ...createDefaultState().basicInfo, projName: activeProject.name, projUnit: state.basicInfo.projUnit },
      projectLedger: { ...createDefaultProjectLedger(), projectCode: activeProject.projectCode, clientUnit: activeProject.clientUnit, sampleCode: `YP-AC-${String(projectDesigns.length + 1).padStart(3, '0')}` },
    });
    const design = designFromState(activeProject.id, nextState, now, `配合比设计 ${projectDesigns.length + 1}`);
    setPortfolio(prev => ({ ...prev, activeDesignId: design.id, designs: [...prev.designs, design] }));
    setState(nextState);
    setTmrdResult(null);
  };

  const duplicateActiveDesign = () => {
    const now = new Date().toISOString();
    const nextState = normalizeState({ ...state, reportVersion: createDefaultReportVersion(), projectLedger: { ...state.projectLedger, reportCode: '', sampleCode: `${state.projectLedger.sampleCode || 'YP'}-COPY` } });
    const design = designFromState(activeProject.id, nextState, now, `${activeDesign.name} 副本`);
    setPortfolio(prev => ({ ...prev, activeDesignId: design.id, designs: [...prev.designs, design] }));
    setState(nextState);
    setTmrdResult(null);
  };

  const switchProject = (id: string) => {
    const design = portfolio.designs.find(item => item.projectId === id) ?? portfolio.designs[0];
    if (!design) return;
    setPortfolio(prev => ({ ...syncActiveDesign(prev, state), activeProjectId: id, activeDesignId: design.id }));
    setState(normalizeState(design.state));
    setTmrdResult(null);
  };

  const switchDesign = (id: string) => {
    const design = portfolio.designs.find(item => item.id === id);
    if (!design) return;
    setPortfolio(prev => ({ ...syncActiveDesign(prev, state), activeProjectId: design.projectId, activeDesignId: design.id }));
    setState(normalizeState(design.state));
    setTmrdResult(null);
  };

  const deleteProject = (id: string) => {
    if (portfolio.projects.length <= 1) return;
    const nextProjects = portfolio.projects.filter(project => project.id !== id);
    const nextDesigns = portfolio.designs.filter(design => design.projectId !== id);
    const fallbackProject = nextProjects[0];
    const fallbackDesign = nextDesigns.find(design => design.projectId === fallbackProject.id) ?? nextDesigns[0];
    setPortfolio(prev => ({ ...prev, projects: nextProjects, designs: nextDesigns, activeProjectId: fallbackProject.id, activeDesignId: fallbackDesign.id }));
    setState(normalizeState(fallbackDesign.state));
    setTmrdResult(null);
  };

  const deleteDesign = (id: string) => {
    const designsInProject = portfolio.designs.filter(design => design.projectId === activeProject.id);
    if (designsInProject.length <= 1) return;
    const nextDesigns = portfolio.designs.filter(design => design.id !== id);
    const fallbackDesign = nextDesigns.find(design => design.projectId === activeProject.id) ?? nextDesigns[0];
    setPortfolio(prev => ({ ...prev, designs: nextDesigns, activeProjectId: fallbackDesign.projectId, activeDesignId: fallbackDesign.id }));
    setState(normalizeState(fallbackDesign.state));
    setTmrdResult(null);
  };

  const updateProjectLedger = (updates: Partial<ProjectLedger>) => {
    setState(prev => draftState({ ...prev, projectLedger: { ...prev.projectLedger, ...updates } }));
  };

  const updateAsphaltQuality = (updates: Partial<AsphaltQualityRecord>) => {
    setState(prev => draftState({ ...prev, asphaltQuality: { ...prev.asphaltQuality, ...updates } }));
  };

  const updateBasicInfo = (updates: Partial<BasicInfo>) => {
    setState(prev => {
      const basicInfo = { ...prev.basicInfo, ...updates };
      if (updates.asphaltGrade && ASPHALT_DENSITIES[updates.asphaltGrade]) {
        basicInfo.denB = ASPHALT_DENSITIES[updates.asphaltGrade];
      }
      if (updates.mixType) {
        basicInfo.materialSystem = inferMaterialSystem(updates.mixType, basicInfo.materialSystem);
        basicInfo.designMethod = inferDesignMethod(updates.mixType, basicInfo.designMethod);
      }
      let materials = prev.materials;
      let marshallData = prev.marshallData;
      let marshallGroups = prev.marshallGroups;
      if (updates.mixType && updates.mixType !== prev.basicInfo.mixType) {
        materials = createDefaultMaterials(updates.mixType as keyof typeof GRADS);
        marshallData = createMarshallRows(prev.oacInit);
        marshallGroups = createMarshallGroups(prev.oacInit);
      }
      const resetPerformance = Boolean(updates.mixType || updates.designMethod || updates.materialSystem || updates.projectDomain);
      return draftState({ ...prev, basicInfo, materials, marshallData, marshallGroups, performanceRecords: resetPerformance ? createDefaultPerformanceRecords(basicInfo) : prev.performanceRecords, oacResult: null });
    });
  };

  const updateMaterial = (id: string, updates: Partial<MaterialSource>) => {
    setState(prev => draftState({ ...prev, materials: prev.materials.map(m => m.id === id ? { ...m, ...updates } : m), oacResult: null }));
  };

  const updateMaterialPassRate = (id: string, index: number, value: number) => {
    setState(prev => draftState({
      ...prev,
      materials: prev.materials.map(m => {
        if (m.id !== id) return m;
        const passRates = [...m.passRates];
        passRates[index] = value;
        return { ...m, passRates };
      }),
      oacResult: null,
    }));
  };

  const addMaterial = () => setState(prev => {
    const g = GRADS[prev.basicInfo.mixType];
    return draftState({
      ...prev,
      materials: [...prev.materials, {
        id: `mat-${Date.now()}`,
        name: '新增集料',
        type: 'fine',
        proportion: 0,
        gammaSb: 2.700,
        gammaSa: 2.740,
        absorption: 0.5,
        passRates: g.sieves.map(() => 0),
        quality: createDefaultMaterialQuality('fine'),
      }],
    });
  });

  const removeMaterial = (id: string) => {
    setState(prev => draftState({ ...prev, materials: prev.materials.filter(m => m.id !== id), oacResult: null }));
  };

  const fillDefaultMaterials = () => {
    setState(prev => draftState({ ...prev, materials: createDefaultMaterials(prev.basicInfo.mixType), oacResult: null }));
  };

  const fitMaterialsToMidpoint = () => {
    setState(prev => draftState({ ...prev, materials: fitBlendToMidpoint(prev.materials, GRADS[prev.basicInfo.mixType]), oacResult: null }));
  };

  const updateGradingPassRate = (index: number, value: number) => {
    setState(prev => {
      const materials = [...prev.materials];
      const synthetic = materials[0] ?? createDefaultMaterials(prev.basicInfo.mixType)[0];
      const passRates = [...synthetic.passRates];
      passRates[index] = value;
      materials[0] = { ...synthetic, name: synthetic.name || '设计级配', proportion: 100, passRates };
      return draftState({ ...prev, materials, oacResult: null });
    });
  };

  const fillDefaultGrading = () => {
    setState(prev => draftState({ ...prev, materials: fitBlendToMidpoint(prev.materials, GRADS[prev.basicInfo.mixType]), oacResult: null }));
  };

  const calcTMRD = (localOacInit: number) => {
    setTmrdResult(calculateTheoreticalMaxDensity(localOacInit, state.basicInfo.gammaSa, state.basicInfo.denB));
  };

  const setOacInit = (val: number) => {
    setState(prev => draftState({ ...prev, oacInit: val, marshallData: createMarshallRows(val), marshallGroups: createMarshallGroups(val), oacResult: null }));
  };

  const setMarshallData = (data: MarshallSpecimen[]) => {
    setState(prev => draftState({ ...prev, marshallData: data.map(d => calculateVolumetrics(d, prev.basicInfo)), oacResult: null }));
  };

  const updateMarshallPoint = (index: number, updates: Partial<MarshallSpecimen>) => {
    setState(prev => {
      const marshallData = [...prev.marshallData];
      marshallData[index] = calculateVolumetrics({ ...marshallData[index], ...updates }, prev.basicInfo);
      const marshallGroups = prev.marshallGroups.map((group, i) => i === index ? { ...group, mode: 'average' as const, point: marshallData[index], warnings: [] } : group);
      return draftState({ ...prev, marshallData, marshallGroups, oacResult: null });
    });
  };

  const updateMarshallRawSpecimen = (groupIndex: number, specimenIndex: number, updates: Partial<MarshallSpecimenRaw>) => {
    setState(prev => {
      const marshallGroups = prev.marshallGroups.map((group, i) => {
        if (i !== groupIndex) return group;
        const rawSpecimens = group.rawSpecimens.map((specimen, si) => si === specimenIndex ? { ...specimen, ...updates } : specimen);
        return calculateMarshallGroup({ ...group, mode: 'raw', rawSpecimens }, prev.basicInfo);
      });
      return draftState({ ...prev, marshallGroups, marshallData: marshallGroups.map(group => group.point), oacResult: null });
    });
  };

  const updateMarshallGroupMode = (groupIndex: number, mode: MarshallGroup['mode']) => {
    setState(prev => {
      const marshallGroups = prev.marshallGroups.map((group, i) => i === groupIndex ? calculateMarshallGroup({ ...group, mode }, prev.basicInfo) : group);
      return draftState({ ...prev, marshallGroups, marshallData: marshallGroups.map(group => group.point), oacResult: null });
    });
  };

  const updateMarshallSpecimenCount = (groupIndex: number, specimenCount: 3 | 4) => {
    setState(prev => {
      const marshallGroups = prev.marshallGroups.map((group, i) => {
        if (i !== groupIndex) return group;
        const rawSpecimens = [...group.rawSpecimens];
        while (rawSpecimens.length < specimenCount) {
          rawSpecimens.push({ id: `sp-${group.oac}-${rawSpecimens.length + 1}`, height: 63.5, massAir: 0, massWater: 0, massSsd: 0, gt: 0, ms: 0, fl: 0 });
        }
        return calculateMarshallGroup({ ...group, specimenCount, rawSpecimens: rawSpecimens.slice(0, specimenCount) }, prev.basicInfo);
      });
      return draftState({ ...prev, marshallGroups, marshallData: marshallGroups.map(group => group.point), oacResult: null });
    });
  };

  const fillSampleMarshall = () => {
    const sample = [
      { den: 2.368, gt: 2.514, ms: 7.8, fl: 26 },
      { den: 2.391, gt: 2.495, ms: 8.6, fl: 28 },
      { den: 2.408, gt: 2.476, ms: 9.2, fl: 31 },
      { den: 2.415, gt: 2.457, ms: 8.9, fl: 35 },
      { den: 2.410, gt: 2.438, ms: 8.2, fl: 38 },
    ];
    setState(prev => {
      const baseGroups = createMarshallGroups(prev.oacInit);
      const marshallGroups = baseGroups.map((group, i) => {
        const rawSpecimens = group.rawSpecimens.map((specimen, si) => {
          const den = sample[i].den + (si - 1) * 0.003;
          const volume = 500;
          const massWater = 690 + si;
          return {
            ...specimen,
            massAir: round3(den * volume),
            massWater,
            massSsd: massWater + volume,
            gt: sample[i].gt,
            ms: round3(sample[i].ms + (si - 1) * 0.2),
            fl: sample[i].fl + si - 1,
          };
        });
        return calculateMarshallGroup({ ...group, rawSpecimens }, prev.basicInfo);
      });
      return draftState({
        ...prev,
        marshallGroups,
        marshallData: marshallGroups.map(group => group.point),
      oacResult: null,
      });
    });
  };

  const calcOAC = () => {
    let result: OacResult | null = null;
    if (state.basicInfo.designMethod === 'patent-oac') {
      const spec = SPECS[state.basicInfo.roadGrade];
      result = calculatePatentOac(spec.vv.lo, spec.vfa.lo, spec.vv.hi ?? spec.vv.lo, spec.vfa.hi ?? spec.vfa.lo);
    } else if (state.basicInfo.designMethod === 'superpave') {
      result = calculateSuperpaveResult(state.specialtyParams.superpave);
    } else {
      result = calculateOacAnalysis(state.marshallData, SPECS[state.basicInfo.roadGrade]);
    }
    if (!result || result.oac2 === null) {
      setState(prev => draftState({ ...prev, oacResult: result }));
      return state.basicInfo.designMethod !== 'marshall' && Boolean(result);
    }
    setState(prev => draftState({ ...prev, oacResult: result }));
    return true;
  };

  const updatePerformanceRecord = (id: string, updates: Partial<PerformanceTestRecord>) => {
    setState(prev => draftState({ ...prev, performanceRecords: prev.performanceRecords.map(record => record.id === id ? { ...record, ...updates } : record) }));
  };

  const updateSpecialtyParams = (updates: SpecialtyParameterPatch) => {
    setState(prev => draftState({
      ...prev,
      specialtyParams: {
        ...prev.specialtyParams,
        ...updates,
        rap: { ...prev.specialtyParams.rap, ...updates.rap },
        superpave: { ...prev.specialtyParams.superpave, ...updates.superpave },
        sma: { ...prev.specialtyParams.sma, ...updates.sma },
        additives: { ...prev.specialtyParams.additives, ...updates.additives },
      },
      oacResult: updates.superpave ? null : prev.oacResult,
    }));
  };

  const freezeReport = () => {
    if (!projectReadiness.canFreeze) return false;
    setState(prev => ({
      ...prev,
      projectLedger: { ...prev.projectLedger, reportCode: makeReportCode(prev.projectLedger) },
      reportVersion: {
        status: 'frozen',
        version: nextReportVersion(prev.reportVersion.version),
        frozenAt: new Date().toISOString(),
        dataHash: designDataHash,
      },
    }));
    return true;
  };

  const value: MixDesignContextType = {
    ...state,
    setStep,
    markStepDone,
    resetProject,
    exportJson,
    importJson,
    portfolio,
    activeProject,
    activeDesign,
    projectDesigns,
    createProject,
    duplicateActiveDesign,
    createDesignForActiveProject,
    switchProject,
    switchDesign,
    deleteProject,
    deleteDesign,
    projectLedger: state.projectLedger,
    updateProjectLedger,
    asphaltQuality: state.asphaltQuality,
    updateAsphaltQuality,
    standardProfile,
    isDenseAc,
    updateBasicInfo,
    updateMaterial,
    updateMaterialPassRate,
    addMaterial,
    removeMaterial,
    fillDefaultMaterials,
    fitMaterialsToMidpoint,
    gradingData: { passRates: blendDesign.passRates },
    blendDesign,
    gradingWarnings,
    inputAudit,
    workflowStatus,
    updateGradingPassRate,
    fillDefaultGrading,
    tmrdResult,
    calcTMRD,
    setOacInit,
    marshallData: state.marshallData,
    marshallGroups: state.marshallGroups,
    setMarshallData,
    updateMarshallPoint,
    updateMarshallRawSpecimen,
    updateMarshallGroupMode,
    updateMarshallSpecimenCount,
    fillSampleMarshall,
    calcOAC,
    performanceRecords,
    updatePerformanceRecord,
    specialtyParams: state.specialtyParams,
    updateSpecialtyParams,
    specialtyChecks,
    constructionGuidance,
    applicableKnowledge,
    knowledgeVersion: KNOWLEDGE_VERSION,
    performanceConclusion,
    reviewIssues,
    projectReadiness,
    reportVersion: state.reportVersion,
    freezeReport,
    designDataHash,
  };

  return <MixDesignContext.Provider value={value}>{children}</MixDesignContext.Provider>;
}

function loadWorkspace(): { portfolio: MixDesignPortfolio; state: MixDesignState } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const portfolio = createPortfolioFromState(createDefaultState());
      return { portfolio, state: portfolio.designs[0].state };
    }
    return loadWorkspaceFromParsed(JSON.parse(raw) as Partial<MixDesignState> | MixDesignPortfolio);
  } catch {
    const portfolio = createPortfolioFromState(createDefaultState());
    return { portfolio, state: portfolio.designs[0].state };
  }
}

function loadWorkspaceFromParsed(parsed: Partial<MixDesignState> | MixDesignPortfolio): { portfolio: MixDesignPortfolio; state: MixDesignState } {
  if (isPortfolio(parsed)) {
    const fallback = createPortfolioFromState(createDefaultState());
    const designs = parsed.designs.length ? parsed.designs.map(design => ({ ...design, state: normalizeImportedState(design.state) })) : fallback.designs;
    const projects = parsed.projects.length ? parsed.projects : fallback.projects;
    const activeDesign = designs.find(design => design.id === parsed.activeDesignId) ?? designs[0];
    const activeProject = projects.find(project => project.id === (parsed.activeProjectId || activeDesign.projectId)) ?? projects[0];
    const portfolio: MixDesignPortfolio = {
      version: PORTFOLIO_VERSION,
      activeProjectId: activeProject.id,
      activeDesignId: activeDesign.id,
      projects,
      designs,
    };
    return { portfolio, state: normalizeState(activeDesign.state) };
  }

  const state = normalizeImportedState(parsed);
  const portfolio = createPortfolioFromState(state);
  return { portfolio, state };
}

function normalizeImportedState(parsed: Partial<MixDesignState>): MixDesignState {
  const fallback = createDefaultState();
  return normalizeState({
    ...fallback,
    ...parsed,
    basicInfo: { ...fallback.basicInfo, ...parsed.basicInfo },
    projectLedger: { ...fallback.projectLedger, ...parsed.projectLedger },
    asphaltQuality: { ...fallback.asphaltQuality, ...parsed.asphaltQuality },
    materials: parsed.materials?.length ? parsed.materials : fallback.materials,
    marshallData: parsed.marshallData?.length ? parsed.marshallData : fallback.marshallData,
    marshallGroups: parsed.marshallGroups?.length ? parsed.marshallGroups : fallback.marshallGroups,
    performanceRecords: parsed.performanceRecords?.length ? parsed.performanceRecords : fallback.performanceRecords,
    specialtyParams: { ...fallback.specialtyParams, ...parsed.specialtyParams },
    reportVersion: { ...fallback.reportVersion, ...parsed.reportVersion },
    stepDone: parsed.stepDone?.length === 8 ? parsed.stepDone : fallback.stepDone,
  });
}

function normalizeState(state: MixDesignState): MixDesignState {
  return {
    ...state,
    projectLedger: { ...createDefaultProjectLedger(), ...state.projectLedger },
    asphaltQuality: { ...createDefaultAsphaltQuality(), ...state.asphaltQuality },
    materials: state.materials.map(m => ({ ...m, quality: { ...createDefaultMaterialQuality(m.type), ...m.quality } })),
    marshallGroups: state.marshallGroups.length ? state.marshallGroups : createMarshallGroups(state.oacInit),
    performanceRecords: state.performanceRecords.length ? state.performanceRecords : createDefaultPerformanceRecords(state.basicInfo),
    specialtyParams: mergeSpecialtyParams(state.specialtyParams),
    reportVersion: { ...createDefaultReportVersion(), ...state.reportVersion },
  };
}

function draftState<T extends MixDesignState>(state: T): T {
  return state.reportVersion.status === 'frozen'
    ? { ...state, reportVersion: createDefaultReportVersion() }
    : state;
}

function nextReportVersion(version: string) {
  const value = Number(version);
  if (!Number.isFinite(value)) return '1.0';
  return (Math.max(1, Math.floor(value) + 1)).toFixed(1);
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000;
}

function inferMaterialSystem(mixType: BasicInfo['mixType'], fallback: BasicInfo['materialSystem']): BasicInfo['materialSystem'] {
  if (mixType === 'SMA-13') return 'sma';
  if (mixType === 'HM-20') return 'high-modulus';
  if (mixType === 'RAP-AC-20') return 'rap';
  if (mixType === 'CMA-13') return 'cold-mix';
  if (mixType === 'OGFC-13') return 'modified';
  return fallback === 'sma' || fallback === 'high-modulus' || fallback === 'rap' || fallback === 'cold-mix' ? 'modified' : fallback;
}

function inferDesignMethod(mixType: BasicInfo['mixType'], fallback: BasicInfo['designMethod']): BasicInfo['designMethod'] {
  if (mixType === 'SMA-13' || mixType === 'OGFC-13' || mixType === 'RAP-AC-20' || mixType === 'CMA-13') return 'marshall';
  return fallback;
}

function mergeSpecialtyParams(params: Partial<SpecialtyParameters> | undefined): SpecialtyParameters {
  const fallback = createDefaultSpecialtyParameters();
  return {
    rap: { ...fallback.rap, ...params?.rap },
    superpave: { ...fallback.superpave, ...params?.superpave },
    sma: { ...fallback.sma, ...params?.sma },
    additives: { ...fallback.additives, ...params?.additives },
  };
}

function createPortfolioFromState(state: MixDesignState): MixDesignPortfolio {
  const now = new Date().toISOString();
  const normalized = normalizeState(state);
  const project = projectFromState(normalized, now);
  const design = designFromState(project.id, normalized, now);
  return {
    version: PORTFOLIO_VERSION,
    activeProjectId: project.id,
    activeDesignId: design.id,
    projects: [project],
    designs: [design],
  };
}

function projectFromState(state: MixDesignState, now: string): ProjectRecord {
  return {
    id: makeId('project'),
    projectCode: state.projectLedger.projectCode || `PRJ-${now.slice(0, 10).replace(/-/g, '')}`,
    name: state.basicInfo.projName || '未命名工程',
    clientUnit: state.projectLedger.clientUnit || '',
    createdAt: now,
    updatedAt: now,
  };
}

function designFromState(projectId: string, state: MixDesignState, now: string, name?: string): MixDesignRecord {
  return {
    id: makeId('design'),
    projectId,
    name: name || `${state.basicInfo.mixType} · ${state.projectLedger.sampleCode || '未命名样品'}`,
    createdAt: now,
    updatedAt: now,
    state: normalizeState({ ...state, step: 0 }),
  };
}

function syncActiveDesign(portfolio: MixDesignPortfolio, state: MixDesignState): MixDesignPortfolio {
  const now = new Date().toISOString();
  const activeDesign = portfolio.designs.find(design => design.id === portfolio.activeDesignId);
  if (!activeDesign) return portfolio;
  return {
    ...portfolio,
    projects: portfolio.projects.map(project => project.id === portfolio.activeProjectId
      ? { ...project, projectCode: state.projectLedger.projectCode || project.projectCode, name: state.basicInfo.projName || project.name, clientUnit: state.projectLedger.clientUnit || project.clientUnit, updatedAt: now }
      : project),
    designs: portfolio.designs.map(design => design.id === portfolio.activeDesignId
      ? { ...design, name: `${state.basicInfo.mixType} · ${state.projectLedger.sampleCode || '未命名样品'}`, updatedAt: now, state }
      : design),
  };
}

function toDesignSummary(design: MixDesignRecord): MixDesignRecordSummary {
  return {
    id: design.id,
    projectId: design.projectId,
    name: design.name,
    mixType: design.state.basicInfo.mixType,
    sampleCode: design.state.projectLedger.sampleCode,
    testDate: design.state.projectLedger.testDate,
    reportCode: design.state.projectLedger.reportCode,
    reportStatus: design.state.reportVersion.status,
    updatedAt: design.updatedAt,
  };
}

function isPortfolio(value: Partial<MixDesignState> | MixDesignPortfolio): value is MixDesignPortfolio {
  return Array.isArray((value as MixDesignPortfolio).projects) && Array.isArray((value as MixDesignPortfolio).designs);
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useMixDesign() {
  const context = useContext(MixDesignContext);
  if (!context) {
    throw new Error('useMixDesign must be used within MixDesignProvider');
  }
  return context;
}
