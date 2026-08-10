import type { BasicInfo, BlendDesign, InputAudit, MarshallPoint, OacResult, ProjectLedger, StepWorkflowStatus } from '../types';
import { DENSE_AC_TYPES } from './constants';

const STEP_LABELS = ['项目台账', '基本信息', '原材料', '级配合成', '马歇尔试验', 'OAC 分析', '性能验证', '设计报告'];

export interface WorkflowStateInput {
  basicInfo: BasicInfo;
  projectLedger?: ProjectLedger;
  blendDesign: BlendDesign;
  gradingWarnings: string[];
  marshallData: MarshallPoint[];
  oacResult: OacResult | null;
}

export function getInputAudit(state: WorkflowStateInput): InputAudit {
  const materialWarnings: string[] = [];
  const gradationWarnings = [...state.gradingWarnings];
  const marshallWarnings: string[] = [];
  const oacWarnings: string[] = [];
  const reportWarnings: string[] = [];

  if (!state.basicInfo.projName.trim()) materialWarnings.push('项目名称未填写。');
  if (!state.basicInfo.projUnit.trim()) materialWarnings.push('编制单位未填写。');
  if (!DENSE_AC_TYPES.includes(state.basicInfo.mixType as any)) {
    oacWarnings.push('当前混合料为专项设计类型，不参与 AC 通用 OAC 自动判定。');
  }
  if (Math.abs(state.blendDesign.totalProportion - 100) > 0.2) {
    materialWarnings.push(`材料比例合计 ${state.blendDesign.totalProportion.toFixed(1)}%，需调整至 100%。`);
  }
  if (state.blendDesign.warnings.length) materialWarnings.push(...state.blendDesign.warnings);

  const missingRows = state.marshallData.filter(row => !row.oac || !row.den || !row.gt || !row.ms || !row.fl).length;
  if (missingRows) marshallWarnings.push(`${missingRows} 组马歇尔数据未完整录入。`);
  const invalidVolumetrics = state.marshallData.filter(row => !row.vv || !row.vma || !row.vfa).length;
  if (invalidVolumetrics) marshallWarnings.push(`${invalidVolumetrics} 组体积指标尚未形成有效计算值。`);

  if (!state.oacResult) {
    oacWarnings.push('尚未完成 OAC 分析。');
    reportWarnings.push('报告缺少 OAC 结果。');
  } else {
    if (state.oacResult.oac2 === null) oacWarnings.push('OAC2 无共同合格区间，需重新设计或复核试验数据。');
    const failedChecks = state.oacResult.checks.filter(check => !check.ok);
    if (failedChecks.length) oacWarnings.push(`${failedChecks.length} 项最终指标不满足规范要求。`);
    if (state.oacResult.warnings.length) oacWarnings.push(...state.oacResult.warnings);
  }
  if (gradationWarnings.length) reportWarnings.push('报告包含级配或材料审查警告。');
  if (marshallWarnings.length) reportWarnings.push('报告包含未完整试验数据。');
  if (oacWarnings.length) reportWarnings.push('报告结论需复核。');

  const conclusion = reportWarnings.length ? (state.oacResult ? '需复核' : '未完成') : '可出具';
  return { materialWarnings, gradationWarnings, marshallWarnings, oacWarnings, reportWarnings, conclusion };
}

export function getWorkflowStatus(state: WorkflowStateInput): StepWorkflowStatus[] {
  const audit = getInputAudit(state);
  const projectWarnings = getProjectWarnings(state.basicInfo, state.projectLedger);
  const hasBasicWarning = !state.basicInfo.projName.trim() || !state.basicInfo.projUnit.trim();
  const marshallComplete = audit.marshallWarnings.length === 0;
  const oacPassed = Boolean(state.oacResult && state.oacResult.oac2 !== null && state.oacResult.checks.every(check => check.ok));

  return STEP_LABELS.map((label, step) => {
    if (step === 0) {
      return makeStatus(step, label, projectWarnings.length ? 'warning' : 'passed', true, projectWarnings);
    }
    if (step === 1) {
      return makeStatus(step, label, hasBasicWarning ? 'warning' : 'passed', true, hasBasicWarning ? ['基本信息存在未填写项。'] : []);
    }
    if (step === 2) {
      return makeStatus(step, label, audit.materialWarnings.length ? 'warning' : 'passed', true, audit.materialWarnings);
    }
    if (step === 3) {
      return makeStatus(step, label, audit.gradationWarnings.length ? 'warning' : 'passed', true, audit.gradationWarnings);
    }
    if (step === 4) {
      return makeStatus(step, label, marshallComplete ? 'passed' : 'blocked', true, audit.marshallWarnings);
    }
    if (step === 5) {
      const canEnter = marshallComplete;
      return makeStatus(step, label, !canEnter ? 'blocked' : oacPassed ? 'passed' : 'blocked', canEnter, !canEnter ? audit.marshallWarnings : audit.oacWarnings);
    }
    if (step === 6) {
      return makeStatus(step, label, oacPassed ? 'passed' : 'blocked', oacPassed, audit.oacWarnings);
    }
    return makeStatus(step, label, audit.conclusion === '可出具' ? 'passed' : state.oacResult ? 'warning' : 'blocked', Boolean(state.oacResult), audit.reportWarnings);
  });
}

function getProjectWarnings(basicInfo: BasicInfo, projectLedger?: ProjectLedger) {
  if (!projectLedger) return [];
  const warnings: string[] = [];
  if (!basicInfo.projName.trim()) warnings.push('工程名称未填写。');
  if (!basicInfo.projUnit.trim()) warnings.push('编制单位未填写。');
  if (!projectLedger.projectCode.trim()) warnings.push('工程编号未填写。');
  if (!projectLedger.clientUnit.trim()) warnings.push('委托单位未填写。');
  if (!projectLedger.sampleCode.trim()) warnings.push('样品编号未填写。');
  if (!projectLedger.samplingDate.trim()) warnings.push('取样日期未填写。');
  if (!projectLedger.testDate.trim()) warnings.push('试验日期未填写。');
  return warnings;
}

function makeStatus(step: number, label: string, status: StepWorkflowStatus['status'], canEnter: boolean, reasons: string[]): StepWorkflowStatus {
  return {
    step,
    label,
    status,
    canEnter,
    reasons,
    warningCount: reasons.length,
  };
}
