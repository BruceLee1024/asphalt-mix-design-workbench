import React from 'react';
import { Card, SLabel, Button, InfoBox } from '../ui';
import { useMixDesign } from '../../store/MixDesignContext';
import { GRADS } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area } from 'recharts';
import { AlertTriangle, CheckCircle2, ListChecks, RefreshCcw, SlidersHorizontal, Target } from 'lucide-react';

export function GradingStep() {
  const { basicInfo, gradingData, fillDefaultGrading, gradingWarnings, blendDesign, materials, tmrdResult, calcTMRD, setStep, markStepDone, oacInit, specialtyParams } = useMixDesign();
  const [chartMode, setChartMode] = React.useState<'line' | 'bar'>('line');

  const g = GRADS[basicInfo.mixType];
  if (!g) return null;

  const chartData = g.sieves.map((s, i) => {
    const val = gradingData.passRates[i];
    const lo = g.lo[i];
    const hi = g.hi[i];
    const inRange = val >= lo && val <= hi;
    return {
      sieve: String(s),
      value: val,
      lo,
      hi,
      mid: (lo + hi) / 2,
      inRange,
      midDev: val - (lo + hi) / 2,
      productionPreference: productionPreference(s, val, lo, hi)
    };
  });

  const warns = gradingWarnings;
  const outOfRange = chartData.filter(d => !d.inRange);
  const maxDeviation = chartData.reduce((max, d) => Math.abs(d.midDev) > Math.abs(max.midDev) ? d : max, chartData[0]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SLabel>矿料级配设计审查</SLabel>

      <Card 
        title="合成级配审查台账"
        headerRight={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(2)}><SlidersHorizontal className="w-3.5 h-3.5" /> 原材料</Button>
            <Button variant="ghost" size="sm" onClick={fillDefaultGrading}><Target className="w-3.5 h-3.5" /> 拟合中值</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
          <ReviewTile icon={outOfRange.length ? AlertTriangle : CheckCircle2} label="超限筛孔" value={`${outOfRange.length} 个`} tone={outOfRange.length ? 'bad' : 'good'} />
          <ReviewTile icon={ListChecks} label="材料档数" value={`${materials.length} 档`} tone="neutral" />
          <ReviewTile icon={Target} label="最大中值偏差" value={`${maxDeviation?.sieve ?? '-'}mm / ${maxDeviation?.midDev > 0 ? '+' : ''}${maxDeviation?.midDev.toFixed(1) ?? '-'}`} tone={Math.abs(maxDeviation?.midDev ?? 0) > 8 ? 'warn' : 'neutral'} />
          <ReviewTile icon={blendDesign.totalProportion === 100 ? CheckCircle2 : AlertTriangle} label="比例合计" value={`${blendDesign.totalProportion.toFixed(1)}%`} tone={Math.abs(blendDesign.totalProportion - 100) <= 0.2 ? 'good' : 'warn'} />
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">筛孔 (mm)</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">规范下限</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">规范上限</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">合成通过率 (%)</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">范围判断</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">中值偏差</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">生产偏好</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, i) => (
                <tr key={i} className="hover:bg-[rgba(245,166,35,0.025)] transition-colors group">
                  <td className="py-2 px-3 text-center border-b border-border2/60 text-amber font-bold group-last:border-none">{d.sieve}</td>
                  <td className="py-2 px-3 text-center border-b border-border2/60 text-text3 group-last:border-none">{d.lo}</td>
                  <td className="py-2 px-3 text-center border-b border-border2/60 text-text3 group-last:border-none">{d.hi}</td>
                  <td className="py-2 px-3 text-center border-b border-border2/60 group-last:border-none text-text1 font-bold">{d.value.toFixed(1)}</td>
                  <td className={cn("py-2 px-3 text-center border-b border-border2/60 group-last:border-none", d.inRange ? "text-green" : "text-red bg-red/5")}>
                    {d.inRange ? '合格' : '超出'}
                  </td>
                  <td className="py-2 px-3 text-center border-b border-border2/60 text-text3 group-last:border-none">
                    <span className={cn(
                      Math.abs(d.midDev) < (d.hi - d.lo) * 0.15 ? "text-green" :
                      Math.abs(d.midDev) < (d.hi - d.lo) * 0.35 ? "text-yellow" : "text-text3"
                    )}>
                      {d.midDev > 0 ? '+' : ''}{d.midDev.toFixed(1)}
                    </span>
                  </td>
                  <td className={cn("py-2 px-3 text-center border-b border-border2/60 group-last:border-none", d.productionPreference === '命中' ? 'text-green' : d.productionPreference === '不适用' ? 'text-text3' : 'text-yellow')}>
                    {d.productionPreference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {warns.length > 0 && (
          <InfoBox className="border-l-red text-red">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {warns.join(' | ')}
          </InfoBox>
        )}
        <InfoBox>
          合成级配来自 {materials.length} 档原生料{specialtyParams.rap.enabled ? `及 ${specialtyParams.rap.content}% RAP` : ''}，比例合计 {blendDesign.totalProportion.toFixed(1)}%。生产偏好为辅助调校目标，不替代规范上下限。
        </InfoBox>
      </Card>

      <Card 
        title="级配曲线与规范带"
        headerRight={
          <div className="flex gap-0.5">
            <button className={cn("px-4 py-1.5 rounded-sm font-mono text-[11px] border transition-colors", chartMode === 'line' ? "bg-surface3 text-amber border-amber-dim" : "bg-transparent text-text2 border-border hover:bg-surface2 hover:text-text1")} onClick={() => setChartMode('line')}>折线</button>
            <button className={cn("px-4 py-1.5 rounded-sm font-mono text-[11px] border transition-colors", chartMode === 'bar' ? "bg-surface3 text-amber border-amber-dim" : "bg-transparent text-text2 border-border hover:bg-surface2 hover:text-text1")} onClick={() => setChartMode('bar')}>柱状</button>
          </div>
        }
      >
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-4">
          <div className="bg-app-bg border border-border rounded-lg p-5 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'line' ? (
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(46,46,58,0.8)" vertical={false} />
                  <XAxis dataKey="sieve" stroke="#565668" tick={{ fill: '#565668', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={{ stroke: 'rgba(46,46,58,0.5)' }} />
                  <YAxis domain={[0, 100]} stroke="#565668" tick={{ fill: '#565668', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={{ stroke: 'rgba(46,46,58,0.5)' }} />
                  
                  <Area type="monotone" dataKey="hi" stroke="none" fill="rgba(245,166,35,0.06)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="hi" stroke="rgba(245,166,35,0.3)" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="lo" stroke="rgba(245,166,35,0.3)" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="mid" stroke="rgba(91,156,246,0.45)" strokeDasharray="2 5" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="value" stroke="#F5A623" strokeWidth={2.5} dot={{ stroke: '#0D0D11', strokeWidth: 1.5, r: 4, fill: '#F5A623' }} activeDot={{ r: 6 }} isAnimationActive={false} />
                </ComposedChart>
              ) : (
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(46,46,58,0.8)" vertical={false} />
                  <XAxis dataKey="sieve" stroke="#565668" tick={{ fill: '#565668', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={{ stroke: 'rgba(46,46,58,0.5)' }} />
                  <YAxis domain={[0, 100]} stroke="#565668" tick={{ fill: '#565668', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={{ stroke: 'rgba(46,46,58,0.5)' }} />
                  <Bar dataKey="value" fill="#F5A623" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="bg-app-bg border border-border rounded-lg p-4">
            <div className="font-mono text-[10px] text-text3 tracking-widest uppercase mb-3">Review Notes</div>
            <div className="space-y-2">
              {(warns.length ? warns : ['级配位于规范范围内，仍需结合体积指标与路用性能验证。']).slice(0, 6).map((warning, index) => (
                <div key={index} className={cn("rounded-sm border px-3 py-2 text-xs leading-relaxed", warns.length ? "border-yellow/20 bg-yellow/5 text-yellow" : "border-green/20 bg-green/5 text-green")}>
                  {warning}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-[10px] text-text3 font-mono mb-2">超限筛孔</div>
              <div className="flex flex-wrap gap-1.5">
                {outOfRange.length ? outOfRange.map(d => <span key={d.sieve} className="rounded-sm border border-red/30 bg-red/5 px-2 py-1 text-[10px] font-mono text-red">{d.sieve}mm</span>) : <span className="text-[11px] text-green font-mono">无超限</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4 flex-wrap mt-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-text2"><div className="w-[18px] h-0.5 rounded-[1px] bg-amber"></div>设计级配</div>
          {chartMode === 'line' && (
            <>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-text2"><div className="w-[18px] h-0 border-t border-dashed border-amber bg-[rgba(245,166,35,0.4)]"></div>规范上限</div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-text2"><div className="w-[18px] h-0 border-t border-dashed border-[rgba(245,166,35,0.5)] bg-[rgba(245,166,35,0.4)]"></div>规范下限</div>
            </>
          )}
        </div>
      </Card>

      <Card title="理论最大密度计算（计算法 T0711）">
        {tmrdResult ? (
          <div className="bg-surface2 border border-border rounded-lg overflow-hidden">
            <div className="flex justify-between items-center px-5 py-2.5 border-b border-border2/50 text-[13px]">
              <span className="font-mono text-[11px] text-text2">初始估计油石比</span>
              <span className="font-mono font-bold text-text1">{oacInit.toFixed(1)} %</span>
            </div>
            <div className="flex justify-between items-center px-5 py-2.5 border-b border-border2/50 text-[13px]">
              <span className="font-mono text-[11px] text-text2">计算法理论最大密度 γt</span>
              <span className="font-mono font-bold text-amber text-[15px]">{tmrdResult.toFixed(3)} g/cm³</span>
            </div>
          </div>
        ) : (
          <div className="font-mono text-[13px] text-text2 leading-loose">点击"计算理论最大密度"后显示结果</div>
        )}
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={() => calcTMRD(oacInit)}><RefreshCcw className="w-3.5 h-3.5" /> 计算理论最大密度 γt</Button>
        </div>
        <InfoBox className="mt-3">⚠ 计算法结果仅供参考，最终应以 T0711 真空法实测值为准。</InfoBox>
      </Card>

      <div className="flex justify-between mt-6 pb-2">
        <Button variant="ghost" onClick={() => setStep(2)}>← 返回</Button>
        <Button onClick={() => { markStepDone(3); setStep(4); }}>下一步：马歇尔试验 →</Button>
      </div>
    </div>
  );
}

function productionPreference(sieve: number, value: number, lo: number, hi: number) {
  const mid = (lo + hi) / 2;
  if (sieve === 9.5) return value >= mid && value <= hi ? '命中' : '偏离';
  if (sieve === 4.75) return Math.abs(value - mid) <= (hi - lo) * 0.12 ? '命中' : '偏离';
  if (sieve === 2.36) return value >= mid && value <= hi ? '命中' : '偏离';
  if (sieve < 2.36) return value >= lo && value <= mid ? '命中' : '偏离';
  return '不适用';
}

function ReviewTile({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  return (
    <div className={cn(
      "rounded-sm border bg-app-bg px-4 py-3",
      tone === 'good' && "border-green/25",
      tone === 'warn' && "border-yellow/25",
      tone === 'bad' && "border-red/25",
      tone === 'neutral' && "border-border"
    )}>
      <div className="flex items-center gap-2 text-[10px] text-text3 font-mono tracking-widest uppercase">
        <Icon className={cn("w-3.5 h-3.5", tone === 'good' && "text-green", tone === 'warn' && "text-yellow", tone === 'bad' && "text-red", tone === 'neutral' && "text-text3")} />
        {label}
      </div>
      <div className="mt-1 text-[17px] font-mono font-bold text-text1">{value}</div>
    </div>
  );
}
