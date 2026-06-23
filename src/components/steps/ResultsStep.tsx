import React from 'react';
import { Card, SLabel, Button, InfoBox } from '../ui';
import { useMixDesign } from '../../store/MixDesignContext';
import { cn } from '../../lib/utils';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle2, FileWarning } from 'lucide-react';

export function ResultsStep() {
  const { oacResult, marshallData, basicInfo, setStep, markStepDone, inputAudit, specialtyChecks, constructionGuidance } = useMixDesign();

  if (!oacResult) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <SLabel>配合比计算结果</SLabel>
        <div className="text-center py-16 px-5 text-text3 font-mono text-[13px]">
          <div className="text-4xl mb-3 opacity-30">◎</div>
        请先在马歇尔试验页填入数据并点击“计算 OAC1 / OAC2”
        </div>
        <div className="flex justify-start mt-6"><Button variant="ghost" onClick={() => setStep(4)}>← 返回</Button></div>
      </div>
    );
  }

  const isMarshallResult = (oacResult.method ?? 'marshall') === 'marshall';
  const cards = [
    { lbl: '最佳油石比 OAC', val: oacResult.oac.toFixed(2), unit: '%', chk: null },
    ...oacResult.checks.map(c => ({
      lbl: c.label,
      val: c.value.toFixed(c.key === 'fl' || c.key === 'vfa' ? 0 : 1),
      unit: c.key === 'ms' ? 'kN' : c.key === 'fl' ? '×0.1mm' : '%',
      chk: c.ok ? 'ok' : 'fail',
      req: c.requirement,
    })),
    { lbl: '最大密度 @OAC', val: oacResult.den.toFixed(3), unit: 'g/cm³', chk: null },
    { lbl: '混合料类型', val: basicInfo.mixType, unit: '', chk: null },
  ];

  const xs = marshallData.map(d => d.oac).filter(Boolean);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);

  const MiniChart = ({ dataKey, title, color }: { dataKey: string, title: string, color: string }) => {
    const data = marshallData.map(d => ({ oac: d.oac, [dataKey]: d[dataKey as keyof typeof d] }));
    const ys = data.map(d => d[dataKey] as number);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const pad = (max - min) * 0.2 || 0.5;

    return (
      <div className="bg-app-bg border border-border rounded-sm p-4 relative">
        <div className="text-[10px] font-mono text-text3 mb-2">{title}</div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
              <XAxis dataKey="oac" type="number" domain={[xMin, xMax]} hide />
              <YAxis domain={[min - pad, max + pad]} stroke="#565668" tick={{ fill: '#565668', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <ReferenceLine x={oacResult.oac1} stroke="rgba(91,156,246,0.45)" strokeDasharray="2 5" />
              {oacResult.oac2 !== null && <ReferenceLine x={oacResult.oac2} stroke="rgba(61,220,132,0.45)" strokeDasharray="2 5" />}
              <ReferenceLine x={oacResult.oac} stroke="rgba(245,166,35,0.5)" strokeDasharray="3 4" />
              {dataKey === 'den' && <ReferenceLine x={oacResult.a1} stroke="rgba(255,255,255,0.35)" strokeDasharray="1 4" />}
              {dataKey === 'ms' && <ReferenceLine x={oacResult.a2} stroke="rgba(255,255,255,0.35)" strokeDasharray="1 4" />}
              {dataKey === 'vv' && <ReferenceLine x={oacResult.a3} stroke="rgba(255,255,255,0.35)" strokeDasharray="1 4" />}
              {dataKey === 'vfa' && oacResult.a4 !== null && <ReferenceLine x={oacResult.a4} stroke="rgba(255,255,255,0.35)" strokeDasharray="1 4" />}
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color, stroke: '#0D0D11', strokeWidth: 1.5, r: 4 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SLabel>配合比计算结果</SLabel>

      <div className={cn(
        "mb-4 rounded-sm border px-4 py-3 flex items-start gap-3 font-mono text-xs",
        inputAudit.oacWarnings.length ? "border-yellow/25 bg-yellow/5 text-yellow" : "border-green/25 bg-green/5 text-green"
      )}>
        {inputAudit.oacWarnings.length ? <FileWarning className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
        <div>
          <div className="font-bold mb-1">{inputAudit.oacWarnings.length ? 'OAC 推导需复核' : 'OAC 推导已形成可用结果'}</div>
          <div className="leading-relaxed">{inputAudit.oacWarnings.length ? inputAudit.oacWarnings.join(' | ') : 'OAC1、OAC2 与最终指标校核已完成。'}</div>
        </div>
      </div>

      <Card title={isMarshallResult ? '最佳油石比推导（OAC1 / OAC2）' : '专项设计路径结果'}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          <LedgerTile label="设计方法" value={basicInfo.designMethod} />
          <LedgerTile label={isMarshallResult ? 'OAC2 共同区间中值' : '知识库依据'} value={isMarshallResult ? (oacResult.oac2 === null ? '无共同区间' : `${oacResult.oac2.toFixed(3)}%`) : (oacResult.sourceId ?? '专项规则')} tone={isMarshallResult && oacResult.oac2 === null ? 'bad' : 'default'} />
          <LedgerTile label="最终 OAC" value={`${oacResult.oac.toFixed(3)}%`} tone="highlight" />
        </div>
        {isMarshallResult ? (
        <div className="bg-surface2 border border-border rounded-lg overflow-hidden">
          <div className="flex justify-between items-center px-5 py-2.5 border-b border-border2/50 text-[13px]">
            <span className="font-mono text-[11px] text-text2">a1 最大密度对应油石比</span>
            <span className="font-mono font-bold text-text1">{oacResult.a1.toFixed(3)} %</span>
          </div>
          <div className="flex justify-between items-center px-5 py-2.5 border-b border-border2/50 text-[13px]">
            <span className="font-mono text-[11px] text-text2">a2 最大稳定度对应油石比</span>
            <span className="font-mono font-bold text-text1">{oacResult.a2.toFixed(3)} %</span>
          </div>
          <div className="flex justify-between items-center px-5 py-2.5 border-b border-border2/50 text-[13px]">
            <span className="font-mono text-[11px] text-text2">a3 目标空隙率 4% 对应油石比</span>
            <span className="font-mono font-bold text-text1">{oacResult.a3.toFixed(3)} %</span>
          </div>
          <div className="flex justify-between items-center px-5 py-2.5 border-b border-border2/50 text-[13px]">
            <span className="font-mono text-[11px] text-text2">a4 VFA 中值对应油石比</span>
            <span className="font-mono font-bold text-text1">{oacResult.a4 === null ? '未覆盖' : `${oacResult.a4.toFixed(3)} %`}</span>
          </div>
          <div className="flex justify-between items-center px-5 py-2.5 border-b border-border2/50 text-[13px]">
            <span className="font-mono text-[11px] text-text2">OAC1</span>
            <span className="font-mono font-bold text-text1">{oacResult.oac1.toFixed(3)} %</span>
          </div>
          <div className="flex justify-between items-center px-5 py-2.5 border-b border-border2/50 text-[13px]">
            <span className="font-mono text-[11px] text-text2">OAC2 共同合格区间中值</span>
            <span className="font-mono font-bold text-text1">
              {oacResult.oac2 === null ? '无共同区间' : `${oacResult.oac2.toFixed(3)} %（${oacResult.oacMin?.toFixed(2)}~${oacResult.oacMax?.toFixed(2)}）`}
            </span>
          </div>
          <div className="flex justify-between items-center px-5 py-3 bg-[rgba(245,166,35,0.06)] text-[13px]">
            <span className="font-mono text-[11px] text-text2">OAC = (OAC1 + OAC2) / 2</span>
            <span className="font-mono font-bold text-amber text-lg">{oacResult.oac.toFixed(3)} %</span>
          </div>
        </div>
        ) : (
          <InfoBox>
            {basicInfo.designMethod === 'superpave'
              ? 'Superpave 路径以 Ndes 转数下空隙率 4% 对应沥青含量作为 OAC，并校核 Nmax 压密度。'
              : '专利直算路径使用当前道路等级 VV/VFA 控制值直接推导 OAC，报告中应保留试验复核说明。'}
          </InfoBox>
        )}
        {oacResult.warnings.length ? (
          <div className="mt-3 text-yellow font-mono text-xs flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> {oacResult.warnings.join(' | ')}</div>
        ) : null}
      </Card>

      {specialtyChecks.length ? (
        <Card title="专项校核">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {specialtyChecks.map(check => (
              <div key={check.id} className={cn("rounded-sm border px-4 py-3 bg-app-bg", check.ok === true ? "border-green/25" : check.ok === false ? "border-red/25" : "border-yellow/25")}>
                <div className="flex items-center gap-2 text-[10px] text-text3 font-mono tracking-widest uppercase">
                  {check.ok === true ? <CheckCircle2 className="w-3.5 h-3.5 text-green" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow" />}
                  {check.label}
                </div>
                <div className="mt-2 font-mono text-[15px] font-bold text-text1">{check.value}</div>
                <div className="mt-1 text-[10px] font-mono text-text3">{check.requirement} · {check.sourceId}</div>
                <div className="mt-2 text-[11px] text-text3 leading-relaxed">{check.message}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {constructionGuidance.length ? (
        <Card title="施工控制建议">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {constructionGuidance.slice(0, 4).map(item => (
              <div key={item.id} className="rounded-sm border border-border bg-app-bg px-4 py-3">
                <div className="font-mono text-[10px] text-text3 tracking-widest uppercase">{item.label}</div>
                <div className="mt-1 text-[12px] text-text1 leading-relaxed">{item.message}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 mb-6">
        {cards.map((c, i) => (
          <div key={i} className={cn("bg-surface2 border border-border rounded-lg p-4.5 relative overflow-hidden transition-all hover:border-border2 hover:-translate-y-[2px]", 
            c.chk === 'ok' && "border-t-2 border-t-green",
            c.chk === 'warn' && "border-t-2 border-t-yellow",
            c.chk === 'fail' && "border-t-2 border-t-red",
            !c.chk && "border-t-2 border-t-amber"
          )}>
            <div className="font-mono text-[10px] text-text3 tracking-[1px] mb-2.5">{c.lbl}</div>
            <div className="font-mono text-[26px] font-bold text-text1 leading-none">
              {c.val}<small className="text-xs text-text2 ml-0.5">{c.unit}</small>
            </div>
            {c.chk && (
              <div className={cn("flex items-center gap-1.5 mt-2.5 text-[10px] font-mono",
                c.chk === 'ok' ? "text-green" : c.chk === 'warn' ? "text-yellow" : "text-red"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.chk === 'ok' ? "bg-green" : c.chk === 'warn' ? "bg-yellow" : "bg-red")}></span>
                {c.chk === 'ok' ? '合格' : c.chk === 'warn' ? '临界' : '不合格'} {c.req ? '· ' + c.req : ''}
              </div>
            )}
          </div>
        ))}
      </div>

      {isMarshallResult && (
      <Card 
        title="马歇尔指标曲线（4面板）"
        headerRight={
          <div className="flex gap-1.5 items-center font-mono text-[10px] text-text2">
            <div className="w-[18px] h-0 border-t border-dashed border-amber bg-[rgba(245,166,35,0.6)]"></div> OAC线
            <div className="w-[18px] h-0 border-t border-dashed border-blue-400/60"></div> OAC1
            <div className="w-[18px] h-0 border-t border-dashed border-green/60"></div> OAC2
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
          <MiniChart dataKey="ms" title="稳定度 MS (kN)" color="#F5A623" />
          <MiniChart dataKey="den" title="毛体积密度 (g/cm³)" color="#5B9CF6" />
          <MiniChart dataKey="vv" title="空隙率 VV (%)" color="#3DDC84" />
          <MiniChart dataKey="vfa" title="VFA 沥青饱和度 (%)" color="#9B7FFF" />
        </div>
      </Card>
      )}

      <div className="flex justify-between mt-6 pb-2">
        <Button variant="ghost" onClick={() => setStep(4)}>← 返回</Button>
        <Button onClick={() => { markStepDone(5); setStep(6); }}>下一步：指标验证 →</Button>
      </div>
    </div>
  );
}

function LedgerTile({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'highlight' | 'bad' }) {
  return (
    <div className={cn(
      "rounded-sm border bg-app-bg px-4 py-3",
      tone === 'highlight' && "border-amber/30",
      tone === 'bad' && "border-red/30",
      tone === 'default' && "border-border"
    )}>
      <div className="font-mono text-[10px] text-text3 tracking-widest uppercase">{label}</div>
      <div className={cn("mt-1 font-mono text-[20px] font-bold", tone === 'highlight' ? "text-amber" : tone === 'bad' ? "text-red" : "text-text1")}>{value}</div>
    </div>
  );
}
