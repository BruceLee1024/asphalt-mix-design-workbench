import React from 'react';
import { AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react';
import { Button, Card, Input, SLabel } from '../ui';
import { useMixDesign } from '../../store/MixDesignContext';
import { cn } from '../../lib/utils';

export function VerificationStep() {
  const { oacResult, basicInfo, performanceRecords, performanceConclusion, updatePerformanceRecord, specialtyChecks, setStep, markStepDone } = useMixDesign();

  if (!oacResult) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <SLabel>性能验证</SLabel>
        <div className="text-center py-16 px-5 text-text3 font-mono text-[13px]">尚未计算最佳油石比。</div>
      </div>
    );
  }

  const allMarshallOk = oacResult.checks.every(check => check.ok);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SLabel>性能验证台账</SLabel>

      <Card title={`目标配合比指标复核（${basicInfo.mixType}）`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {oacResult.checks.map(check => (
            <div key={check.key} className={cn("rounded-sm border px-4 py-3 bg-app-bg", check.ok ? "border-green/25" : "border-red/25")}>
              <div className="flex items-center gap-2 text-[10px] text-text3 font-mono tracking-widest uppercase">
                {check.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green" /> : <AlertTriangle className="w-3.5 h-3.5 text-red" />}
                {check.label}
              </div>
              <div className="mt-2 font-mono text-[16px] font-bold text-text1">{check.value.toFixed(check.key === 'fl' || check.key === 'vfa' ? 0 : 1)}</div>
              <div className="mt-1 text-[10px] font-mono text-text3">{check.requirement}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="路用性能验证记录">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr>
                {['启用', '验证项目', '实测值', '单位', '要求', '依据', '判定'].map(h => (
                  <th key={h} className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {performanceRecords.map(record => (
                <tr key={record.id} className="hover:bg-[rgba(245,166,35,0.025)]">
                  <td className="py-2.5 px-3 text-center border-b border-border2/60">
                    <input
                      type="checkbox"
                      checked={record.enabled}
                      onChange={e => updatePerformanceRecord(record.id, { enabled: e.target.checked })}
                      aria-label={`${record.label} 启用状态`}
                    />
                  </td>
                  <td className="py-2.5 px-3 border-b border-border2/60 text-text1">{record.label}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/60">
                    <Input className="w-[110px] text-center p-1.5" type="number" step="0.1" value={record.value || ''} onChange={e => updatePerformanceRecord(record.id, { value: parseFloat(e.target.value) || 0 })} />
                  </td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/60 text-text3">{record.unit}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/60 text-text3">{record.requirement}</td>
                  <td className="py-2.5 px-3 text-center border-b border-border2/60 text-text3">{record.sourceLabel ?? record.sourceId ?? '-'}</td>
                  <td className={cn("py-2.5 px-3 text-center border-b border-border2/60 font-bold", record.ok === true ? "text-green" : record.ok === false ? "text-red" : "text-yellow")}>
                    {record.ok === true ? '合格' : record.ok === false ? '不满足' : '待补充'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={cn("mt-4 rounded-sm border px-4 py-3 font-mono text-xs flex items-center gap-2", performanceConclusion === '已通过' ? "border-green/25 bg-green/5 text-green" : performanceConclusion === '需复核' ? "border-red/25 bg-red/5 text-red" : "border-yellow/25 bg-yellow/5 text-yellow")}>
          {performanceConclusion === '已通过' ? <CheckCircle2 className="w-4 h-4" /> : performanceConclusion === '需复核' ? <AlertTriangle className="w-4 h-4" /> : <CircleDashed className="w-4 h-4" />}
          {performanceConclusion === '已通过' ? '路用性能验证已通过。' : performanceConclusion === '需复核' ? '存在路用性能验证不合格项，报告不可正式交付。' : '目标配合比完成，性能验证待补充。'}
        </div>
      </Card>

      {specialtyChecks.length ? (
        <Card title="专项校核结果">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {specialtyChecks.map(check => (
              <div key={check.id} className={cn("rounded-sm border px-4 py-3 bg-app-bg", check.ok === true ? "border-green/25" : check.ok === false ? "border-red/25" : "border-yellow/25")}>
                <div className="flex items-center gap-2 text-[10px] text-text3 font-mono tracking-widest uppercase">
                  {check.ok === true ? <CheckCircle2 className="w-3.5 h-3.5 text-green" /> : check.ok === false ? <AlertTriangle className="w-3.5 h-3.5 text-red" /> : <CircleDashed className="w-3.5 h-3.5 text-yellow" />}
                  {check.label}
                </div>
                <div className="mt-2 font-mono text-[16px] font-bold text-text1">{check.value}</div>
                <div className="mt-1 text-[10px] font-mono text-text3">{check.requirement} · {check.sourceId}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card title="综合评价">
        <div className="bg-surface2 border border-border rounded-lg overflow-hidden">
          <Row label="马歇尔指标" value={allMarshallOk ? '全部满足规范要求' : '存在不满足项'} tone={allMarshallOk ? 'good' : 'bad'} />
          <Row label="性能验证" value={performanceConclusion} tone={performanceConclusion === '已通过' ? 'good' : performanceConclusion === '需复核' ? 'bad' : 'warn'} />
          <Row label="推荐操作" value={performanceConclusion === '已通过' ? '可冻结正式报告' : '补充或复核性能验证记录后再冻结报告'} tone="neutral" />
        </div>
      </Card>

      <div className="flex justify-between mt-6 pb-2">
        <Button variant="ghost" onClick={() => setStep(5)}>← 返回</Button>
        <Button onClick={() => { markStepDone(6); setStep(7); }}>生成设计报告 →</Button>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  return (
    <div className="flex justify-between items-center px-5 py-3 border-b border-border2/50 text-[13px] last:border-b-0">
      <span className="font-mono text-[11px] text-text2">{label}</span>
      <span className={cn("font-mono font-bold", tone === 'good' && "text-green", tone === 'warn' && "text-yellow", tone === 'bad' && "text-red", tone === 'neutral' && "text-text1")}>{value}</span>
    </div>
  );
}
