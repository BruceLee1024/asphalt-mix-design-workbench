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
  ProjectReadiness,
  ReportVersion,
  ReviewIssue,
  StandardProfile,
  StepWorkflowStatus,
} from '../types';
import { ASPHALT_DENSITIES, DENSE_AC_TYPES, GRADS, SPECS, STANDARD_PROFILES } from '../lib/constants';
import { calculateBlendGradation, calculateOacAnalysis, calculateTheoreticalMaxDensity, calculateVolumetrics, fitBlendToMidpoint, validateGradation } from '../lib/math';
import { getInputAudit, getWorkflowStatus } from '../lib/workflow';
import {
  calculateMarshallGroup,
  calculatePerformanceChecks,
  createDefaultAsphaltQuality,
  createDefaultMaterialQuality,
  createDefaultPerformanceRecords,
  createDefaultProjectLedger,
  createDefaultReportVersion,
  createMarshallGroups,
  getPerformanceConclusion,
  getProjectReadiness,
  getReviewIssues,
  hashDesignState,
  makeReportCode,
} from '../lib/lab';

const STORAGE_KEY = 'ac_mix_design_v2';

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
  reportVersion: ReportVersion;
}

interface MixDesignContextType extends MixDesignState {
  setStep: (step: number) => void;
  markStepDone: (step: number) => void;
  resetProject: () => void;
  exportJson: () => string;
  importJson: (json: string) => void;
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
    performanceRecords: createDefaultPerformanceRecords(),
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
  const [state, setState] = useState<MixDesignState>(() => loadState());
  const [tmrdResult, setTmrdResult] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
  const performanceRecords = useMemo(() => calculatePerformanceChecks(state.performanceRecords), [state.performanceRecords]);
  const performanceConclusion = useMemo(() => getPerformanceConclusion(performanceRecords), [performanceRecords]);
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
  }), [blendDesign, gradingWarnings, performanceRecords, state.asphaltQuality, state.basicInfo, state.marshallData, state.marshallGroups, state.materials, state.oacResult, state.projectLedger, state.reportVersion]);
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
  }), [blendDesign, performanceRecords, state.asphaltQuality, state.basicInfo, state.marshallData, state.marshallGroups, state.materials, state.oacResult, state.projectLedger]);

  const setStep = (step: number) => setState(prev => ({ ...prev, step }));
  const markStepDone = (s: number) => setState(prev => {
    const stepDone = [...prev.stepDone];
    stepDone[s] = true;
    return { ...prev, stepDone };
  });

  const resetProject = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTmrdResult(null);
    setState(createDefaultState());
  };

  const exportJson = () => JSON.stringify(state, null, 2);
  const importJson = (json: string) => {
    const parsed = JSON.parse(json) as Partial<MixDesignState>;
    setState(normalizeState({ ...createDefaultState(), ...parsed, step: 0, stepDone: [false, false, false, false, false, false, false, false] }));
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
      let materials = prev.materials;
      let marshallData = prev.marshallData;
      let marshallGroups = prev.marshallGroups;
      if (updates.mixType && updates.mixType !== prev.basicInfo.mixType) {
        materials = createDefaultMaterials(updates.mixType as keyof typeof GRADS);
        marshallData = createMarshallRows(prev.oacInit);
        marshallGroups = createMarshallGroups(prev.oacInit);
      }
      return draftState({ ...prev, basicInfo, materials, marshallData, marshallGroups, oacResult: null });
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
    const result = calculateOacAnalysis(state.marshallData, SPECS[state.basicInfo.roadGrade]);
    if (!result || result.oac2 === null) {
      setState(prev => draftState({ ...prev, oacResult: result }));
      return false;
    }
    setState(prev => draftState({ ...prev, oacResult: result }));
    return true;
  };

  const updatePerformanceRecord = (id: string, updates: Partial<PerformanceTestRecord>) => {
    setState(prev => draftState({ ...prev, performanceRecords: prev.performanceRecords.map(record => record.id === id ? { ...record, ...updates } : record) }));
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
    performanceConclusion,
    reviewIssues,
    projectReadiness,
    reportVersion: state.reportVersion,
    freezeReport,
    designDataHash,
  };

  return <MixDesignContext.Provider value={value}>{children}</MixDesignContext.Provider>;
}

function loadState(): MixDesignState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as Partial<MixDesignState>;
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
      reportVersion: { ...fallback.reportVersion, ...parsed.reportVersion },
      stepDone: parsed.stepDone?.length === 8 ? parsed.stepDone : fallback.stepDone,
    });
  } catch {
    return createDefaultState();
  }
}

function normalizeState(state: MixDesignState): MixDesignState {
  return {
    ...state,
    projectLedger: { ...createDefaultProjectLedger(), ...state.projectLedger },
    asphaltQuality: { ...createDefaultAsphaltQuality(), ...state.asphaltQuality },
    materials: state.materials.map(m => ({ ...m, quality: { ...createDefaultMaterialQuality(m.type), ...m.quality } })),
    marshallGroups: state.marshallGroups.length ? state.marshallGroups : createMarshallGroups(state.oacInit),
    performanceRecords: state.performanceRecords.length ? state.performanceRecords : createDefaultPerformanceRecords(),
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

export function useMixDesign() {
  const context = useContext(MixDesignContext);
  if (!context) {
    throw new Error('useMixDesign must be used within MixDesignProvider');
  }
  return context;
}
