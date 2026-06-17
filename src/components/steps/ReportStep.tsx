import React from 'react';
import { Card, SLabel, Button } from '../ui';
import { useMixDesign } from '../../store/MixDesignContext';
import { GRADS } from '../../lib/constants';
import { downloadBinaryFile, downloadTextFile, exportDesignWorkbook, exportDesignXlsx } from '../../lib/export';
import { Archive, ClipboardCheck, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ReportStep({ onOpenAi }: { onOpenAi: (prefill: string) => void }) {
  const {
    basicInfo,
    projectLedger,
    asphaltQuality,
    standardProfile,
    materials,
    gradingData,
    oacResult,
    marshallData,
    marshallGroups,
    setStep,
    markStepDone,
    inputAudit,
    workflowStatus,
    performanceRecords,
    performanceConclusion,
    reviewIssues,
    projectReadiness,
    reportVersion,
    freezeReport,
  } = useMixDesign();
  const g = GRADS[basicInfo.mixType];

  const handlePrint = () => {
    markStepDone(6);
    window.print();
  };

  const handleWorkbook = () => {
    const csv = exportDesignWorkbook({
      basicInfo,
      projectLedger,
      asphaltQuality,
      standard: standardProfile,
      materials,
      blendPassRates: gradingData.passRates,
      sieves: g.sieves,
      marshallData,
      marshallGroups,
      oacResult,
      checks: oacResult?.checks ?? [],
      performanceRecords,
      reviewIssues,
    });
    downloadTextFile('asphalt-mix-design.csv', csv);
  };

  const handleXlsx = async () => {
    const xlsx = await exportDesignXlsx({
      basicInfo,
      projectLedger,
      asphaltQuality,
      standard: standardProfile,
      materials,
      blendPassRates: gradingData.passRates,
      sieves: g.sieves,
      marshallData,
      marshallGroups,
      oacResult,
      checks: oacResult?.checks ?? [],
      performanceRecords,
      reviewIssues,
    });
    downloadBinaryFile('asphalt-mix-design-workbook.xlsx', xlsx);
  };

  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SLabel className="print:hidden">设计配合比报告</SLabel>

      <div className="bg-surface border border-border rounded-lg p-7 print:border-none print:shadow-none print:p-0 print:bg-white">
        <div className="text-center py-10 px-0 mb-6 border border-border bg-app-bg print:border-black print:bg-white">
          <div className="font-mono text-[11px] text-text3 tracking-[3px] mb-3">ASPHALT MIX DESIGN REPORT</div>
          <div className="text-[22px] font-bold text-text1 mb-1.5 font-sans">沥青混凝土配合比设计报告</div>
          <div className="font-mono text-[12px] text-text3">
            报告编号：{projectLedger.reportCode || '未冻结生成'} | 版本：{reportVersion.version} | 状态：{reportVersion.status === 'frozen' ? '已冻结' : '草稿'}
          </div>
          <div className={cn("inline-flex mt-4 px-4 py-1.5 rounded-sm border font-mono text-xs font-bold", inputAudit.conclusion === '可出具' ? "border-green/30 text-green bg-green/5" : inputAudit.conclusion === '需复核' ? "border-yellow/30 text-yellow bg-yellow/5" : "border-red/30 text-red bg-red/5")}>
            结论状态：{projectReadiness.statusText}
          </div>
        </div>
        
        <div className="h-[1px] bg-gradient-to-r from-transparent via-border to-transparent my-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <SLabel className="mb-3">项目台账</SLabel>
            <div className="bg-surface2 border border-border rounded-lg overflow-hidden">
              <Row k="工程编号" v={projectLedger.projectCode} />
              <Row k="委托单位" v={projectLedger.clientUnit} />
              <Row k="样品编号" v={projectLedger.sampleCode} />
              <Row k="取样地点" v={projectLedger.sampleLocation} />
              <Row k="取样日期" v={projectLedger.samplingDate} />
              <Row k="试验日期" v={projectLedger.testDate} />
              <Row k="试验/复核/批准" v={`${projectLedger.tester} / ${projectLedger.reviewer} / ${projectLedger.approver}`} />
            </div>
          </div>
          <div>
            <SLabel className="mb-3">原材料参数</SLabel>
            <div className="bg-surface2 border border-border rounded-lg overflow-hidden">
              <Row k="混合料类型" v={basicInfo.mixType} />
              <Row k="沥青品种" v={basicInfo.asphaltGrade} />
              <Row k="沥青供应商/批号" v={`${asphaltQuality.supplier} / ${asphaltQuality.batchNo}`} />
              <Row k="沥青密度" v={`${basicInfo.denB} g/cm³`} />
              <Row k="合成毛体积密度" v={`${basicInfo.gammaSb} g/cm³`} />
              <Row k="合成表观密度" v={`${basicInfo.gammaSa} g/cm³`} />
              <Row k="规范版本" v={standardProfile.label} />
            </div>
          </div>
          <div>
            <SLabel className="mb-3">配合比结果</SLabel>
            {oacResult ? (
              <div className="bg-surface2 border border-border rounded-lg overflow-hidden">
                <Row k="最佳油石比 OAC" v={`${oacResult.oac.toFixed(2)} %`} className="text-amber" />
                <Row k="马歇尔稳定度" v={`${oacResult.ms.toFixed(1)} kN`} />
                <Row k="流值" v={`${oacResult.fl.toFixed(0)} ×0.1mm`} />
                <Row k="空隙率 VV" v={`${oacResult.vv.toFixed(1)} %`} />
                <Row k="矿料间隙率 VMA" v={`${oacResult.vma.toFixed(1)} %`} />
                <Row k="沥青饱和度 VFA" v={`${oacResult.vfa.toFixed(0)} %`} />
              </div>
            ) : (
              <div className="text-text3 text-[13px] py-4">无计算结果</div>
            )}
          </div>
        </div>

        <SLabel className="mb-3">报告冻结与交付状态</SLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <StatusBox label="冻结状态" value={reportVersion.status === 'frozen' ? `已冻结 ${reportVersion.version}` : '草稿'} tone={reportVersion.status === 'frozen' ? 'good' : 'warn'} />
          <StatusBox label="冻结条件" value={projectReadiness.canFreeze ? '允许冻结' : '不可冻结'} tone={projectReadiness.canFreeze ? 'good' : 'bad'} />
          <StatusBox label="性能验证" value={performanceConclusion} tone={performanceConclusion === '已通过' ? 'good' : performanceConclusion === '需复核' ? 'bad' : 'warn'} />
        </div>

        <SLabel className="mb-3">数据完整性检查</SLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {workflowStatus.map(flow => (
            <div key={flow.step} className={cn("border rounded-sm px-4 py-3", flow.status === 'passed' ? "border-green/25 bg-green/5" : flow.status === 'warning' ? "border-yellow/25 bg-yellow/5" : flow.status === 'blocked' ? "border-red/25 bg-red/5" : "border-border bg-app-bg")}>
              <div className="flex justify-between gap-3">
                <span className="font-mono text-[11px] text-text2">{flow.label}</span>
                <span className={cn("font-mono text-[11px] font-bold", flow.status === 'passed' ? "text-green" : flow.status === 'warning' ? "text-yellow" : flow.status === 'blocked' ? "text-red" : "text-text3")}>{statusLabel(flow.status)}</span>
              </div>
              {flow.reasons[0] && <div className="mt-1 text-[11px] text-text3 leading-relaxed">{flow.reasons[0]}</div>}
            </div>
          ))}
        </div>

        <SLabel className="mb-3">原材料比例</SLabel>
        <div className="overflow-x-auto mb-5">
          <table className="w-full border-collapse font-mono text-[12px]">
            <thead>
              <tr>
                {['材料', '类型', '比例', '毛体积密度', '表观密度', '吸水率'].map(h => (
                  <th key={h} className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id}>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{m.name}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{m.type}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{m.proportion}%</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{m.gammaSb}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{m.gammaSa}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{m.absorption}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SLabel className="mb-3">性能验证</SLabel>
        <div className="overflow-x-auto mb-5">
          <table className="w-full border-collapse font-mono text-[12px]">
            <thead>
              <tr>
                {['验证项目', '实测值', '单位', '要求', '判定'].map(h => (
                  <th key={h} className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {performanceRecords.map(record => (
                <tr key={record.id}>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{record.label}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{record.value || '-'}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{record.unit}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{record.requirement}</td>
                  <td className={cn("py-2.5 px-3 text-center border-b border-border2/50 font-bold", record.ok === true ? "text-green" : record.ok === false ? "text-red" : "text-yellow")}>{record.ok === true ? '合格' : record.ok === false ? '不满足' : '待补充'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SLabel className="mb-3">合成级配</SLabel>
        <div className="overflow-x-auto mb-5">
          <table className="w-full border-collapse font-mono text-[12px]">
            <tbody>
              <tr>
                <td className="bg-app-bg text-text3 text-[10px] py-2.5 px-3 border-b border-border">筛孔(mm)</td>
                {g.sieves.map(s => <td key={s} className="py-2.5 px-3 text-center border-b border-border2/50">{s}</td>)}
              </tr>
              <tr>
                <td className="bg-app-bg text-text3 text-[10px] py-2.5 px-3 border-b border-border">通过率(%)</td>
                {gradingData.passRates.map((v, i) => <td key={i} className="py-2.5 px-3 text-center border-b border-border2/50">{v.toFixed(1)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>

        <SLabel className="mb-3">马歇尔试验汇总</SLabel>
        <div className="overflow-x-auto mb-5">
          <table className="w-full border-collapse font-mono text-[12px]">
            <thead>
              <tr>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal">#</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal">油石比</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal">密度</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal">稳定度</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal">流值</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal">VV</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal">VMA</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal">VFA</th>
              </tr>
            </thead>
            <tbody>
              {marshallData.map((d, i) => (
                <tr key={i}>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{i + 1}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{d.oac}%</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{d.den}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{d.ms}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{d.fl}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{d.vv}%</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{d.vma}%</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{d.vfa}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SLabel className="mb-3">技术指标验证</SLabel>
        <table className="w-full border-collapse font-mono text-[12px]">
          <thead>
            <tr>
              <th className="text-left bg-app-bg text-text3 text-[10px] tracking-widest py-2 px-4 border-b border-border font-normal">指标</th>
              <th className="text-left bg-app-bg text-text3 text-[10px] tracking-widest py-2 px-4 border-b border-border font-normal">计算值</th>
              <th className="text-left bg-app-bg text-text3 text-[10px] tracking-widest py-2 px-4 border-b border-border font-normal">规范要求</th>
              <th className="text-left bg-app-bg text-text3 text-[10px] tracking-widest py-2 px-4 border-b border-border font-normal">判定</th>
            </tr>
          </thead>
          <tbody>
            {oacResult?.checks.map(c => (
              <React.Fragment key={c.key}>
                <VerifyRow name={c.label} val={`${c.value.toFixed(c.key === 'fl' || c.key === 'vfa' ? 0 : 1)}`} req={c.requirement} ok={c.ok} />
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {oacResult && (
          <>
            <SLabel className="mb-3 mt-5">OAC 推导</SLabel>
            <div className="bg-surface2 border border-border rounded-lg overflow-hidden">
              <Row k="OAC1" v={`${oacResult.oac1.toFixed(3)} %`} />
              <Row k="OAC2" v={oacResult.oac2 === null ? '无共同合格区间' : `${oacResult.oac2.toFixed(3)} %`} />
              <Row k="共同合格区间" v={oacResult.oacMin === null ? '无' : `${oacResult.oacMin.toFixed(2)}~${oacResult.oacMax?.toFixed(2)} %`} />
              <Row k="最终 OAC" v={`${oacResult.oac.toFixed(3)} %`} className="text-amber" />
            </div>
          </>
        )}

        <SLabel className="mb-3 mt-5">问题与处置台账</SLabel>
        <div className="overflow-x-auto mb-5">
          <table className="w-full border-collapse font-mono text-[12px]">
            <thead>
              <tr>
                {['来源', '级别', '问题', '处置建议', '责任人', '状态'].map(h => (
                  <th key={h} className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviewIssues.length ? reviewIssues.map(issue => (
                <tr key={issue.id}>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{issue.source}</td>
                  <td className={cn("py-2.5 px-3 text-center border-b border-border2/50 font-bold", issue.level === 'blocking' ? "text-red" : "text-yellow")}>{issue.level === 'blocking' ? '阻塞' : '警告'}</td>
                  <td className="py-2.5 px-3 border-b border-border2/50">{issue.title}</td>
                  <td className="py-2.5 px-3 border-b border-border2/50 text-text3">{issue.action}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{issue.owner}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/50">{issue.closed ? '已关闭' : '未关闭'}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="py-4 text-center text-green border-b border-border2/50">无未关闭复核问题</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="h-[1px] bg-gradient-to-r from-transparent via-border to-transparent my-6" />
        <div className="font-mono text-[11px] text-text3 text-right">
          依据 {standardProfile.designSpec} · {standardProfile.testSpec} · 生成于 {dateStr}
        </div>
      </div>

      <div className="flex gap-2 justify-between mt-6 pb-2 print:hidden">
        <Button variant="ghost" onClick={() => setStep(6)}>← 返回</Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenAi('请根据当前项目审查状态生成复核备注。')}><ClipboardCheck className="w-3.5 h-3.5" /> 审查备注</Button>
          <Button variant="ghost" size="sm" onClick={freezeReport} disabled={!projectReadiness.canFreeze}><Archive className="w-3.5 h-3.5" /> 冻结</Button>
          <Button variant="ghost" size="sm" onClick={handleWorkbook}><Download className="w-3.5 h-3.5" /> CSV</Button>
          <Button variant="ghost" size="sm" onClick={handleXlsx}><FileSpreadsheet className="w-3.5 h-3.5" /> XLSX</Button>
          <Button onClick={handlePrint}><Printer className="w-4 h-4" /> 打印 / PDF</Button>
        </div>
      </div>
    </div>
  );
}

function StatusBox({ label, value, tone }: { label: string; value: string; tone: 'good' | 'warn' | 'bad' }) {
  return (
    <div className={cn("border rounded-sm px-4 py-3", tone === 'good' ? "border-green/25 bg-green/5" : tone === 'warn' ? "border-yellow/25 bg-yellow/5" : "border-red/25 bg-red/5")}>
      <div className="font-mono text-[10px] text-text3 tracking-widest uppercase">{label}</div>
      <div className={cn("mt-1 font-mono text-[15px] font-bold", tone === 'good' ? "text-green" : tone === 'warn' ? "text-yellow" : "text-red")}>{value}</div>
    </div>
  );
}

function Row({ k, v, className }: { k: string, v: React.ReactNode, className?: string }) {
  return (
    <div className="flex justify-between items-center px-5 py-2.5 border-b border-border2/50 text-[13px] last:border-b-0">
      <span className="font-mono text-[11px] text-text2">{k}</span>
      <span className={`font-mono font-bold ${className || 'text-text1'}`}>{v}</span>
    </div>
  );
}

function VerifyRow({ name, val, req, ok }: { name: string, val: string, req: string, ok: boolean }) {
  return (
    <tr>
      <td className="py-2.5 px-4 border-b border-border2/50 text-text1">{name}</td>
      <td className="py-2.5 px-4 border-b border-border2/50 text-text2">{val}</td>
      <td className="py-2.5 px-4 border-b border-border2/50 text-text3">{req}</td>
      <td className={`py-2.5 px-4 border-b border-border2/50 font-bold ${ok ? 'text-green' : 'text-red'}`}>
        {ok ? '✓ 合格' : '✗ 不满足'}
      </td>
    </tr>
  );
}

function statusLabel(status: string) {
  if (status === 'passed') return '已通过';
  if (status === 'warning') return '有警告';
  if (status === 'blocked') return '阻塞';
  if (status === 'editing') return '录入中';
  return '未开始';
}
