import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBlendGradation, calculateOacAnalysis, calculateVolumetrics, validateGradation } from './math';
import { GRADS, SPECS } from './constants';
import { getWorkflowStatus } from './workflow';
import {
  calculateMarshallGroup,
  calculatePerformanceChecks,
  createDefaultAsphaltQuality,
  createDefaultPerformanceRecords,
  createDefaultProjectLedger,
  createDefaultReportVersion,
  createMarshallGroup,
  getPerformanceConclusion,
  getProjectReadiness,
  getReviewIssues,
} from './lab';
import type { BasicInfo, BlendDesign, MaterialSource, MarshallGroup, MarshallPoint, OacResult, PerformanceTestRecord } from '../types';

test('calculateBlendGradation weights material passing rates', () => {
  const materials: MaterialSource[] = [
    { id: 'a', name: '10-15mm', type: 'coarse', proportion: 60, gammaSb: 2.7, gammaSa: 2.74, absorption: 0.5, passRates: [100, 80, 20] },
    { id: 'b', name: '机制砂', type: 'fine', proportion: 40, gammaSb: 2.65, gammaSa: 2.7, absorption: 0.8, passRates: [100, 100, 90] },
  ];
  const blend = calculateBlendGradation(materials);
  assert.deepEqual(blend.passRates, [100, 88, 48]);
  assert.equal(blend.totalProportion, 100);
});

test('validateGradation reports out-of-range gradation values', () => {
  const warnings = validateGradation([100, 100, 90, 70, 55, 40, 30, 20, 15, 9], GRADS['AC-13']);
  assert.ok(warnings.some(w => w.includes('9.5mm')));
  assert.ok(warnings.some(w => w.includes('0.075mm')));
});

test('calculateVolumetrics derives VV, VMA and VFA', () => {
  const point = calculateVolumetrics({ oac: 4.5, den: 2.408, gt: 2.476, ms: 9.2, fl: 31, vv: 0, vma: 0, vfa: 0 }, { gammaSb: 2.71 });
  assert.equal(point.vv, 2.7);
  assert.equal(point.vma, 15);
  assert.equal(point.vfa, 82);
});

test('calculateOacAnalysis returns OAC1, OAC2 and final OAC for a valid data set', () => {
  const data: MarshallPoint[] = [
    { oac: 3.5, den: 2.368, gt: 2.514, ms: 7.8, fl: 26, vv: 5.8, vma: 16.2, vfa: 64.2 },
    { oac: 4.0, den: 2.391, gt: 2.495, ms: 8.6, fl: 28, vv: 4.9, vma: 15.8, vfa: 69.0 },
    { oac: 4.5, den: 2.408, gt: 2.476, ms: 9.2, fl: 31, vv: 4.1, vma: 15.5, vfa: 73.5 },
    { oac: 5.0, den: 2.415, gt: 2.457, ms: 8.9, fl: 35, vv: 3.4, vma: 15.4, vfa: 77.9 },
    { oac: 5.5, den: 2.410, gt: 2.438, ms: 8.2, fl: 38, vv: 2.8, vma: 15.6, vfa: 82.1 },
  ];
  const result = calculateOacAnalysis(data, SPECS.hw);
  assert.ok(result);
  assert.ok(result.oac1 > 4.3 && result.oac1 < 4.8);
  assert.ok(result.oac2);
  assert.ok(result.oac > 4.2 && result.oac < 5.0);
});

test('calculateOacAnalysis warns when no common OAC2 range exists', () => {
  const data: MarshallPoint[] = [
    { oac: 3.5, den: 2.30, gt: 2.55, ms: 5.0, fl: 18, vv: 5.8, vma: 12, vfa: 62 },
    { oac: 4.0, den: 2.32, gt: 2.54, ms: 5.5, fl: 19, vv: 4.9, vma: 12, vfa: 66 },
    { oac: 4.5, den: 2.33, gt: 2.53, ms: 5.8, fl: 50, vv: 4.1, vma: 12, vfa: 70 },
    { oac: 5.0, den: 2.31, gt: 2.52, ms: 5.4, fl: 55, vv: 3.4, vma: 12, vfa: 74 },
    { oac: 5.5, den: 2.29, gt: 2.51, ms: 5.1, fl: 60, vv: 2.8, vma: 12, vfa: 78 },
  ];
  const result = calculateOacAnalysis(data, SPECS.hw);
  assert.ok(result);
  assert.equal(result.oac2, null);
  assert.ok(result.warnings.some(w => w.includes('共同油石比范围')));
});

const basicInfo: BasicInfo = {
  mixType: 'AC-13',
  roadGrade: 'hw',
  layerPos: 'top',
  standardProfileId: 'jtg-f40-2004-jtg3410-2025',
  climate: '1区',
  projName: '测试项目',
  projUnit: '测试单位',
  asphaltGrade: '70A',
  denB: 1.03,
  gammaSb: 2.71,
  gammaSa: 2.745,
  wa: 0.5,
};

function workflowInput(overrides: Partial<{
  blendDesign: BlendDesign;
  gradingWarnings: string[];
  marshallData: MarshallPoint[];
  oacResult: OacResult | null;
}> = {}) {
  const marshallData: MarshallPoint[] = [
    { oac: 3.5, den: 2.368, gt: 2.514, ms: 7.8, fl: 26, vv: 5.8, vma: 16.2, vfa: 64.2 },
    { oac: 4.0, den: 2.391, gt: 2.495, ms: 8.6, fl: 28, vv: 4.9, vma: 15.8, vfa: 69.0 },
    { oac: 4.5, den: 2.408, gt: 2.476, ms: 9.2, fl: 31, vv: 4.1, vma: 15.5, vfa: 73.5 },
    { oac: 5.0, den: 2.415, gt: 2.457, ms: 8.9, fl: 35, vv: 3.4, vma: 15.4, vfa: 77.9 },
    { oac: 5.5, den: 2.410, gt: 2.438, ms: 8.2, fl: 38, vv: 2.8, vma: 15.6, vfa: 82.1 },
  ];
  return {
    basicInfo,
    blendDesign: { passRates: GRADS['AC-13'].lo.map((lo, i) => (lo + GRADS['AC-13'].hi[i]) / 2), totalProportion: 100, warnings: [] },
    gradingWarnings: [],
    marshallData,
    oacResult: calculateOacAnalysis(marshallData, SPECS.hw),
    ...overrides,
  };
}

test('getWorkflowStatus marks material proportion mismatch as warning', () => {
  const statuses = getWorkflowStatus(workflowInput({ blendDesign: { passRates: [], totalProportion: 96.5, warnings: [] } }));
  assert.equal(statuses[2].status, 'warning');
  assert.ok(statuses[2].reasons.some(reason => reason.includes('96.5')));
});

test('getWorkflowStatus marks gradation warnings on blend step', () => {
  const statuses = getWorkflowStatus(workflowInput({ gradingWarnings: ['筛孔 0.075mm 通过率超限。'] }));
  assert.equal(statuses[3].status, 'warning');
  assert.equal(statuses[3].warningCount, 1);
});

test('getWorkflowStatus blocks OAC when Marshall data is incomplete', () => {
  const incomplete = workflowInput().marshallData.map((row, index) => index === 0 ? { ...row, den: 0 } : row);
  const statuses = getWorkflowStatus(workflowInput({ marshallData: incomplete, oacResult: null }));
  assert.equal(statuses[4].status, 'blocked');
  assert.equal(statuses[5].canEnter, false);
});

test('getWorkflowStatus blocks result flow when OAC2 has no common range', () => {
  const result = calculateOacAnalysis([
    { oac: 3.5, den: 2.30, gt: 2.55, ms: 5.0, fl: 18, vv: 5.8, vma: 12, vfa: 62 },
    { oac: 4.0, den: 2.32, gt: 2.54, ms: 5.5, fl: 19, vv: 4.9, vma: 12, vfa: 66 },
    { oac: 4.5, den: 2.33, gt: 2.53, ms: 5.8, fl: 50, vv: 4.1, vma: 12, vfa: 70 },
    { oac: 5.0, den: 2.31, gt: 2.52, ms: 5.4, fl: 55, vv: 3.4, vma: 12, vfa: 74 },
    { oac: 5.5, den: 2.29, gt: 2.51, ms: 5.1, fl: 60, vv: 2.8, vma: 12, vfa: 78 },
  ], SPECS.hw);
  const statuses = getWorkflowStatus(workflowInput({ oacResult: result }));
  assert.equal(statuses[5].status, 'blocked');
  assert.ok(statuses[5].reasons.some(reason => reason.includes('OAC2')));
});

test('calculateMarshallGroup summarizes raw 3-specimen records into a Marshall point', () => {
  const group: MarshallGroup = {
    ...createMarshallGroup(4.5, 3),
    rawSpecimens: [
      { id: 'a', height: 63.5, massAir: 1200, massWater: 690, massSsd: 1190, gt: 2.476, ms: 9.0, fl: 30 },
      { id: 'b', height: 63.7, massAir: 1210, massWater: 695, massSsd: 1200, gt: 2.476, ms: 9.3, fl: 31 },
      { id: 'c', height: 63.4, massAir: 1195, massWater: 688, massSsd: 1188, gt: 2.476, ms: 9.1, fl: 32 },
    ],
  };
  const result = calculateMarshallGroup(group, { gammaSb: 2.71 });
  assert.equal(result.point.oac, 4.5);
  assert.ok(result.point.den > 2.38 && result.point.den < 2.42);
  assert.equal(result.point.ms, 9.1);
  assert.equal(result.warnings.length, 0);
});

test('calculateMarshallGroup flags incomplete and abnormal specimen records', () => {
  const group: MarshallGroup = {
    ...createMarshallGroup(4.5, 3),
    rawSpecimens: [
      { id: 'a', height: 61.8, massAir: 1200, massWater: 690, massSsd: 1190, gt: 2.476, ms: 9.0, fl: 30 },
      { id: 'b', height: 63.7, massAir: 1000, massWater: 695, massSsd: 1200, gt: 2.476, ms: 14.3, fl: 31 },
      { id: 'c', height: 63.4, massAir: 0, massWater: 688, massSsd: 1188, gt: 2.476, ms: 9.1, fl: 32 },
    ],
  };
  const result = calculateMarshallGroup(group, { gammaSb: 2.71 });
  assert.ok(result.warnings.some(w => w.includes('未完整')));
  assert.ok(result.warnings.some(w => w.includes('高度')));
});

test('calculatePerformanceChecks returns pending, failed and passed conclusions', () => {
  const pending = calculatePerformanceChecks(createDefaultPerformanceRecords());
  assert.equal(getPerformanceConclusion(pending), '待补充');

  const failed: PerformanceTestRecord[] = pending.map(record => ({ ...record, value: record.key === 'permeability' ? 180 : 100, ok: null }));
  assert.equal(getPerformanceConclusion(calculatePerformanceChecks(failed)), '需复核');

  const passed: PerformanceTestRecord[] = pending.map(record => ({ ...record, value: record.key === 'permeability' ? 80 : record.key === 'rutting' ? 1300 : record.key === 'lowTemperature' ? 2400 : 86, ok: null }));
  assert.equal(getPerformanceConclusion(calculatePerformanceChecks(passed)), '已通过');
});

test('getReviewIssues and getProjectReadiness block report freezing on missing OAC and specimen gaps', () => {
  const state = workflowInput({ oacResult: null });
  const marshallGroups = [calculateMarshallGroup(createMarshallGroup(4.5, 3), { gammaSb: basicInfo.gammaSb })];
  const labState = {
    basicInfo,
    projectLedger: createDefaultProjectLedger(),
    asphaltQuality: createDefaultAsphaltQuality(),
    materials: [],
    blendDesign: state.blendDesign,
    gradingWarnings: [],
    marshallGroups,
    marshallData: state.marshallData,
    oacResult: null,
    performanceRecords: calculatePerformanceChecks(createDefaultPerformanceRecords()),
    reportVersion: createDefaultReportVersion(),
  };
  const issues = getReviewIssues(labState);
  assert.ok(issues.some(issue => issue.source === 'OAC' && issue.level === 'blocking'));
  assert.ok(issues.some(issue => issue.source === '马歇尔' && issue.level === 'blocking'));
  assert.equal(getProjectReadiness(labState).canFreeze, false);
});
