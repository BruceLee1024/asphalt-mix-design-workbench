import ExcelJS from 'exceljs';
import type { AsphaltQualityRecord, BasicInfo, MaterialSource, MarshallGroup, MarshallPoint, OacResult, PerformanceCheck, PerformanceTestRecord, ProjectLedger, ReviewIssue, StandardProfile } from '../types';

export interface ExportState {
  basicInfo: BasicInfo;
  projectLedger: ProjectLedger;
  asphaltQuality: AsphaltQualityRecord;
  standard: StandardProfile;
  materials: MaterialSource[];
  blendPassRates: number[];
  sieves: readonly number[];
  marshallData: MarshallPoint[];
  marshallGroups: MarshallGroup[];
  oacResult: OacResult | null;
  checks: PerformanceCheck[];
  performanceRecords: PerformanceTestRecord[];
  reviewIssues: ReviewIssue[];
}

export function exportDesignWorkbook(state: ExportState): string {
  const sections = [
    csvSection('基本信息', [
      ['工程编号', state.projectLedger.projectCode],
      ['项目名称', state.basicInfo.projName],
      ['委托单位', state.projectLedger.clientUnit],
      ['设计单位', state.basicInfo.projUnit],
      ['样品编号', state.projectLedger.sampleCode],
      ['取样地点', state.projectLedger.sampleLocation],
      ['取样日期', state.projectLedger.samplingDate],
      ['试验日期', state.projectLedger.testDate],
      ['试验人', state.projectLedger.tester],
      ['复核人', state.projectLedger.reviewer],
      ['批准人', state.projectLedger.approver],
      ['报告编号', state.projectLedger.reportCode],
      ['混合料类型', state.basicInfo.mixType],
      ['规范版本', state.standard.label],
      ['沥青标号', state.basicInfo.asphaltGrade],
      ['沥青密度', state.basicInfo.denB],
    ]),
    csvSection('沥青质量', [
      ['供应商', state.asphaltQuality.supplier],
      ['批号', state.asphaltQuality.batchNo],
      ['检测报告编号', state.asphaltQuality.testReportNo],
      ['针入度', state.asphaltQuality.penetration],
      ['软化点', state.asphaltQuality.softeningPoint],
      ['延度', state.asphaltQuality.ductility],
    ]),
    csvSection('原材料', [
      ['材料', '类型', '比例(%)', '毛体积密度', '表观密度', '吸水率(%)', '产地/料场', '规格', '批次', '检测报告号'],
      ...state.materials.map(m => [m.name, m.type, m.proportion, m.gammaSb, m.gammaSa, m.absorption, m.quality?.origin ?? '', m.quality?.specification ?? '', m.quality?.batchNo ?? '', m.quality?.testReportNo ?? '']),
    ]),
    csvSection('合成级配', [
      ['筛孔(mm)', ...state.sieves],
      ['合成通过率(%)', ...state.blendPassRates],
    ]),
    csvSection('马歇尔数据', [
      ['油石比(%)', '毛体积密度', '理论最大密度', '稳定度(kN)', '流值(0.1mm)', 'VV(%)', 'VMA(%)', 'VFA(%)'],
      ...state.marshallData.map(d => [d.oac, d.den, d.gt, d.ms, d.fl, d.vv, d.vma, d.vfa]),
    ]),
    csvSection('马歇尔原始记录', [
      ['油石比(%)', '试件', '高度(mm)', '空气中质量(g)', '水中质量(g)', '表干质量(g)', '理论最大密度', '稳定度(kN)', '流值(0.1mm)', '组内警告'],
      ...state.marshallGroups.flatMap(group => group.rawSpecimens.map((specimen, index) => [group.oac, index + 1, specimen.height, specimen.massAir, specimen.massWater, specimen.massSsd, specimen.gt, specimen.ms, specimen.fl, group.warnings.join(' | ')])),
    ]),
    csvSection('OAC分析', state.oacResult ? [
      ['OAC1', state.oacResult.oac1],
      ['OAC2', state.oacResult.oac2 ?? '无共同合格区间'],
      ['共同区间', state.oacResult.oacMin === null ? '无' : `${state.oacResult.oacMin}~${state.oacResult.oacMax}`],
      ['最终OAC', state.oacResult.oac],
      ['a1 最大密度', state.oacResult.a1],
      ['a2 最大稳定度', state.oacResult.a2],
      ['a3 目标空隙率', state.oacResult.a3],
      ['a4 VFA中值', state.oacResult.a4 ?? '未覆盖'],
      ...state.checks.map(c => [c.label, c.value, c.requirement, c.ok ? '合格' : '不满足']),
    ] : [['无计算结果']]),
    csvSection('性能验证', [
      ['验证项目', '实测值', '单位', '要求', '启用', '判定'],
      ...state.performanceRecords.map(record => [record.label, record.value, record.unit, record.requirement, record.enabled ? '是' : '否', record.ok === true ? '合格' : record.ok === false ? '不满足' : '待补充']),
    ]),
    csvSection('问题台账', [
      ['来源', '级别', '问题', '详情', '处置建议', '责任人', '状态'],
      ...state.reviewIssues.map(issue => [issue.source, issue.level, issue.title, issue.detail, issue.action, issue.owner, issue.closed ? '已关闭' : '未关闭']),
    ]),
  ];

  return sections.join('\n\n');
}

export async function exportDesignXlsx(state: ExportState): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AC Mix Design Workbench';
  workbook.created = new Date();
  appendSheet(workbook, '项目台账', [
    ['工程编号', state.projectLedger.projectCode],
    ['项目名称', state.basicInfo.projName],
    ['委托单位', state.projectLedger.clientUnit],
    ['设计单位', state.basicInfo.projUnit],
    ['样品编号', state.projectLedger.sampleCode],
    ['取样地点', state.projectLedger.sampleLocation],
    ['取样日期', state.projectLedger.samplingDate],
    ['试验日期', state.projectLedger.testDate],
    ['试验人', state.projectLedger.tester],
    ['复核人', state.projectLedger.reviewer],
    ['批准人', state.projectLedger.approver],
    ['报告编号', state.projectLedger.reportCode],
    ['规范版本', state.standard.label],
  ]);
  appendSheet(workbook, '原材料', [
    ['材料', '类型', '比例(%)', '毛体积密度', '表观密度', '吸水率(%)', '产地/料场', '规格', '批次', '检测报告号', '针片状', '压碎值', '砂当量', '亲水系数'],
    ...state.materials.map(m => [m.name, m.type, m.proportion, m.gammaSb, m.gammaSa, m.absorption, m.quality?.origin ?? '', m.quality?.specification ?? '', m.quality?.batchNo ?? '', m.quality?.testReportNo ?? '', m.quality?.flakiness ?? '', m.quality?.crushingValue ?? '', m.quality?.sandEquivalent ?? '', m.quality?.hydrophilicCoefficient ?? '']),
    [],
    ['沥青供应商', state.asphaltQuality.supplier],
    ['沥青批号', state.asphaltQuality.batchNo],
    ['沥青报告号', state.asphaltQuality.testReportNo],
    ['针入度', state.asphaltQuality.penetration],
    ['软化点', state.asphaltQuality.softeningPoint],
    ['延度', state.asphaltQuality.ductility],
  ]);
  appendSheet(workbook, '合成级配', [
    ['筛孔(mm)', ...state.sieves],
    ['合成通过率(%)', ...state.blendPassRates],
  ]);
  appendSheet(workbook, '马歇尔原始记录', [
    ['油石比(%)', '试件', '高度(mm)', '空气中质量(g)', '水中质量(g)', '表干质量(g)', '理论最大密度', '稳定度(kN)', '流值(0.1mm)', '组内警告'],
    ...state.marshallGroups.flatMap(group => group.rawSpecimens.map((specimen, index) => [group.oac, index + 1, specimen.height, specimen.massAir, specimen.massWater, specimen.massSsd, specimen.gt, specimen.ms, specimen.fl, group.warnings.join(' | ')])),
    [],
    ['油石比(%)', '毛体积密度', '理论最大密度', '稳定度(kN)', '流值(0.1mm)', 'VV(%)', 'VMA(%)', 'VFA(%)'],
    ...state.marshallData.map(d => [d.oac, d.den, d.gt, d.ms, d.fl, d.vv, d.vma, d.vfa]),
  ]);
  appendSheet(workbook, 'OAC推导', state.oacResult ? [
    ['OAC1', state.oacResult.oac1],
    ['OAC2', state.oacResult.oac2 ?? '无共同合格区间'],
    ['共同区间', state.oacResult.oacMin === null ? '无' : `${state.oacResult.oacMin}~${state.oacResult.oacMax}`],
    ['最终OAC', state.oacResult.oac],
    ['a1 最大密度', state.oacResult.a1],
    ['a2 最大稳定度', state.oacResult.a2],
    ['a3 目标空隙率', state.oacResult.a3],
    ['a4 VFA中值', state.oacResult.a4 ?? '未覆盖'],
    [],
    ['指标', '计算值', '要求', '判定'],
    ...state.checks.map(c => [c.label, c.value, c.requirement, c.ok ? '合格' : '不满足']),
  ] : [['无计算结果']]);
  appendSheet(workbook, '性能验证', [
    ['验证项目', '实测值', '单位', '要求', '启用', '判定'],
    ...state.performanceRecords.map(record => [record.label, record.value, record.unit, record.requirement, record.enabled ? '是' : '否', record.ok === true ? '合格' : record.ok === false ? '不满足' : '待补充']),
  ]);
  appendSheet(workbook, '问题台账', [
    ['来源', '级别', '问题', '详情', '处置建议', '责任人', '状态'],
    ...state.reviewIssues.map(issue => [issue.source, issue.level, issue.title, issue.detail, issue.action, issue.owner, issue.closed ? '已关闭' : '未关闭']),
  ]);
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob(['\ufeff', content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadBinaryFile(filename: string, content: ArrayBuffer, mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function appendSheet(workbook: ExcelJS.Workbook, name: string, rows: Array<Array<string | number | boolean | null>>) {
  const sheet = workbook.addWorksheet(name);
  rows.forEach(row => sheet.addRow(row));
  sheet.columns.forEach(column => {
    let max = 10;
    column.eachCell?.({ includeEmpty: true }, cell => {
      max = Math.max(max, String(cell.value ?? '').length + 2);
    });
    column.width = Math.min(max, 28);
  });
}

function csvSection(title: string, rows: Array<Array<string | number | null>>) {
  return [`# ${title}`, ...rows.map(row => row.map(csvCell).join(','))].join('\n');
}

function csvCell(value: string | number | null) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}
