import React from 'react';
import { Card, SLabel, FormGroup, Input, Select, Button, InfoBox } from '../ui';
import { useMixDesign } from '../../store/MixDesignContext';
import type { MarshallSpecimen } from '../../types';
import { AlertTriangle, Calculator, CheckCircle2, RefreshCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

export function MarshallStep() {
  const {
    oacInit,
    setOacInit,
    marshallData,
    marshallGroups,
    updateMarshallPoint,
    updateMarshallRawSpecimen,
    updateMarshallGroupMode,
    updateMarshallSpecimenCount,
    fillSampleMarshall,
    calcOAC,
    specialtyParams,
    updateSpecialtyParams,
    setStep,
    markStepDone,
    oacResult,
    isDenseAc,
    inputAudit,
    basicInfo,
  } = useMixDesign();
  const missingRows = marshallData.filter(d => !d.oac || !d.den || !d.gt || !d.ms || !d.fl).length;

  const handleDataChange = (index: number, field: keyof MarshallSpecimen, value: string) => {
    updateMarshallPoint(index, { [field]: parseFloat(value) || 0 } as Partial<MarshallSpecimen>);
  };

  const handleCalc = () => {
    const ok = calcOAC();
    if (ok) {
      markStepDone(4);
      setStep(5);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SLabel>马歇尔试验参数</SLabel>
      {!isDenseAc && (
        <InfoBox className="border-l-yellow text-yellow">
          当前混合料类型为专项设计类型，本页仍可录入马歇尔数据；自动 OAC 判定会按所选设计方法和知识库适用范围执行。
        </InfoBox>
      )}

      <Card title="试验条件">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          <FormGroup label="初始估计油石比 (%)" hint="以此为中心，±0.5%、±1.0% 各一组">
            <Input 
              type="number" step="0.1" 
              value={oacInit} 
              onChange={e => setOacInit(parseFloat(e.target.value) || 4.5)} 
            />
          </FormGroup>
          <FormGroup label="击实次数（双面）">
            <Select>
              <option value="75">75 次（高速/一级公路）</option>
              <option value="50">50 次（二级及以下）</option>
            </Select>
          </FormGroup>
          <FormGroup label="试件数量（每组）">
            <Select>
              <option value="3">3 个</option>
              <option value="4">4 个</option>
            </Select>
          </FormGroup>
          <FormGroup label="试验温度 (°C)" hint="标准温度 60°C，浸水 30~40min">
            <Input type="number" defaultValue="60" />
          </FormGroup>
        </div>
      </Card>

      {basicDesignPanel()}

      <Card 
        title="5组油石比试验结果（平均值快速录入）"
        headerRight={
          <Button variant="ghost" size="sm" onClick={fillSampleMarshall}>
            <RefreshCcw className="w-3.5 h-3.5" /> 示例数据
          </Button>
        }
      >
        <div className="overflow-x-auto mt-4">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">#</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">状态</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">油石比 (%)</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">毛体积密度 γf</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">最大理论密度 γt</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">稳定度 MS (kN)</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">流值 FL (0.1mm)</th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">VV (%) <span className="text-[9px] text-text3/50">(自动)</span></th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">VMA (%) <span className="text-[9px] text-text3/50">(自动)</span></th>
                <th className="bg-app-bg text-text3 text-[10px] tracking-wide py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">VFA (%) <span className="text-[9px] text-text3/50">(自动)</span></th>
              </tr>
            </thead>
            <tbody>
              {marshallData.map((d, i) => {
                const rowComplete = Boolean(d.oac && d.den && d.gt && d.ms && d.fl);
                return (
                <tr key={i} className={cn("hover:bg-[rgba(245,166,35,0.025)] transition-colors group", !rowComplete && "bg-yellow/5")}>
                  <td className="py-2 px-3 text-center border-b border-border2/60 text-amber font-bold group-last:border-none">{i + 1}</td>
                  <td className="py-2 px-3 text-center border-b border-border2/60 group-last:border-none">
                    <span className={cn("inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[10px] font-mono", rowComplete ? "border-green/30 text-green bg-green/5" : "border-yellow/30 text-yellow bg-yellow/5")}>
                      {rowComplete ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {rowComplete ? '完整' : '缺项'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center border-b border-border2/60 group-last:border-none">
                    <Input className="w-[76px] text-center p-1.5" type="number" step="0.1" value={d.oac} onChange={e => handleDataChange(i, 'oac', e.target.value)} />
                  </td>
                  <td className="py-2 px-3 text-center border-b border-border2/60 group-last:border-none">
                    <Input className="w-[76px] text-center p-1.5" type="number" step="0.001" value={d.den || ''} onChange={e => handleDataChange(i, 'den', e.target.value)} />
                  </td>
                  <td className="py-2 px-3 text-center border-b border-border2/60 group-last:border-none">
                    <Input className="w-[76px] text-center p-1.5" type="number" step="0.001" value={d.gt || ''} onChange={e => handleDataChange(i, 'gt', e.target.value)} />
                  </td>
                  <td className="py-2 px-3 text-center border-b border-border2/60 group-last:border-none">
                    <Input className="w-[76px] text-center p-1.5" type="number" step="0.1" value={d.ms || ''} onChange={e => handleDataChange(i, 'ms', e.target.value)} />
                  </td>
                  <td className="py-2 px-3 text-center border-b border-border2/60 group-last:border-none">
                    <Input className="w-[76px] text-center p-1.5" type="number" step="0.1" value={d.fl || ''} onChange={e => handleDataChange(i, 'fl', e.target.value)} />
                  </td>
                  <td className="py-2 px-3 text-center border-b border-border2/60 group-last:border-none text-text2 font-bold bg-app-bg/60">
                    {d.vv || '-'}
                  </td>
                  <td className="py-2 px-3 text-center border-b border-border2/60 group-last:border-none text-text2 font-bold bg-app-bg/60">
                    {d.vma || '-'}
                  </td>
                  <td className="py-2 px-3 text-center border-b border-border2/60 group-last:border-none text-text2 font-bold bg-app-bg/60">
                    {d.vfa || '-'}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <InfoBox>
          MS 须按高度修正。输入毛体积密度与理论最大密度后，VV、VMA、VFA 将自动按当前合成毛体积密度计算。
        </InfoBox>
        {oacResult?.warnings.length ? (
          <InfoBox className="border-l-yellow text-yellow">
            {oacResult.warnings.join(' | ')}
          </InfoBox>
        ) : null}
        {inputAudit.marshallWarnings.length ? (
          <InfoBox className="border-l-yellow text-yellow">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {inputAudit.marshallWarnings.join(' | ')}
          </InfoBox>
        ) : null}
      </Card>

      <Card title="马歇尔原始记录台账">
        <div className="space-y-4">
          {marshallGroups.map((group, groupIndex) => (
            <div key={group.id} className={cn("border rounded-sm bg-app-bg/60", group.warnings.length ? "border-yellow/25" : "border-border")}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="font-mono text-xs font-bold text-text1">
                  油石比 {group.oac.toFixed(1)}% · 汇总密度 {group.point.den ? group.point.den.toFixed(3) : '-'} · MS {group.point.ms || '-'}
                </div>
                <div className="flex items-center gap-2">
                  <Select className="w-[88px] p-1.5 text-[11px]" value={group.mode} onChange={e => updateMarshallGroupMode(groupIndex, e.target.value as 'raw' | 'average')}>
                    <option value="raw">原始</option>
                    <option value="average">平均</option>
                  </Select>
                  <Select className="w-[76px] p-1.5 text-[11px]" value={group.specimenCount} onChange={e => updateMarshallSpecimenCount(groupIndex, Number(e.target.value) as 3 | 4)}>
                    <option value={3}>3 个</option>
                    <option value={4}>4 个</option>
                  </Select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-mono text-xs">
                  <thead>
                    <tr>
                      {['试件', '高度(mm)', '空气中质量(g)', '水中质量(g)', '表干质量(g)', '理论最大密度', '稳定度(kN)', '流值(0.1mm)'].map(h => (
                        <th key={h} className="bg-surface2 text-text3 text-[10px] py-2 px-2 text-center border-b border-border font-normal whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.rawSpecimens.map((specimen, specimenIndex) => (
                      <tr key={specimen.id}>
                        <td className="py-2 px-2 border-b border-border2/60 text-center text-amber font-bold">{specimenIndex + 1}</td>
                        <RawCell value={specimen.height} onChange={value => updateMarshallRawSpecimen(groupIndex, specimenIndex, { height: value })} step="0.1" />
                        <RawCell value={specimen.massAir} onChange={value => updateMarshallRawSpecimen(groupIndex, specimenIndex, { massAir: value })} step="0.1" />
                        <RawCell value={specimen.massWater} onChange={value => updateMarshallRawSpecimen(groupIndex, specimenIndex, { massWater: value })} step="0.1" />
                        <RawCell value={specimen.massSsd} onChange={value => updateMarshallRawSpecimen(groupIndex, specimenIndex, { massSsd: value })} step="0.1" />
                        <RawCell value={specimen.gt} onChange={value => updateMarshallRawSpecimen(groupIndex, specimenIndex, { gt: value })} step="0.001" />
                        <RawCell value={specimen.ms} onChange={value => updateMarshallRawSpecimen(groupIndex, specimenIndex, { ms: value })} step="0.1" />
                        <RawCell value={specimen.fl} onChange={value => updateMarshallRawSpecimen(groupIndex, specimenIndex, { fl: value })} step="0.1" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {group.warnings.length ? (
                <div className="px-4 py-2 text-[11px] font-mono text-yellow bg-yellow/5 border-t border-yellow/20">
                  {group.warnings.join(' | ')}
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <InfoBox>原始记录模式按空气中质量 /（表干质量 - 水中质量）计算试件毛体积密度，并自动汇总为 OAC 分析输入。</InfoBox>
      </Card>

      <div className="flex justify-between mt-6 pb-2">
        <Button variant="ghost" onClick={() => setStep(3)}>← 返回</Button>
        <Button onClick={handleCalc} disabled={isCalcDisabled()} title={missingRows ? `${missingRows} 组数据未完整录入` : undefined}>
          <Calculator className="w-4 h-4" /> {calcButtonLabel()} →
        </Button>
      </div>
    </div>
  );

  function basicDesignPanel() {
    if (basicInfo.designMethod === 'superpave') {
      return (
        <Card title="Superpave / SGC 参数">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5">
            <FormGroup label="Nini">
              <Input type="number" value={specialtyParams.superpave.nini} onChange={e => updateSpecialtyParams({ superpave: { nini: parseFloat(e.target.value) || 0 } })} />
            </FormGroup>
            <FormGroup label="Ndes">
              <Input type="number" value={specialtyParams.superpave.ndes} onChange={e => updateSpecialtyParams({ superpave: { ndes: parseFloat(e.target.value) || 0 } })} />
            </FormGroup>
            <FormGroup label="Nmax">
              <Input type="number" value={specialtyParams.superpave.nmax} onChange={e => updateSpecialtyParams({ superpave: { nmax: parseFloat(e.target.value) || 0 } })} />
            </FormGroup>
            <FormGroup label="Ndes 压实度 (%Gmm)" hint="目标约 96%Gmm">
              <Input type="number" step="0.1" value={specialtyParams.superpave.gmmAtNdes} onChange={e => updateSpecialtyParams({ superpave: { gmmAtNdes: parseFloat(e.target.value) || 0 } })} />
            </FormGroup>
            <FormGroup label="Nmax 压实度 (%Gmm)" hint="知识库限值：< 98%Gmm">
              <Input type="number" step="0.1" value={specialtyParams.superpave.gmmAtNmax} onChange={e => updateSpecialtyParams({ superpave: { gmmAtNmax: parseFloat(e.target.value) || 0 } })} />
            </FormGroup>
            <FormGroup label="Ndes 对应沥青含量 (%)">
              <Input type="number" step="0.1" value={specialtyParams.superpave.asphaltContentAtNdes} onChange={e => updateSpecialtyParams({ superpave: { asphaltContentAtNdes: parseFloat(e.target.value) || 0 } })} />
            </FormGroup>
          </div>
          <InfoBox>固定参数：垂直压力 {specialtyParams.superpave.pressureKpa} kPa，旋转角 {specialtyParams.superpave.angleDeg}°，转速 {specialtyParams.superpave.speedRpm} r/min。</InfoBox>
        </Card>
      );
    }
    if (basicInfo.mixType === 'SMA-13') {
      return (
        <Card title="SMA 体积专项参数">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
            <FormGroup label="VMA (%)" hint="知识库限值：≥ 18%">
              <Input type="number" step="0.1" value={specialtyParams.sma.vma} onChange={e => updateSpecialtyParams({ sma: { vma: parseFloat(e.target.value) || 0 } })} />
            </FormGroup>
            <FormGroup label="VCAmix (%)">
              <Input type="number" step="0.1" value={specialtyParams.sma.vcamix} onChange={e => updateSpecialtyParams({ sma: { vcamix: parseFloat(e.target.value) || 0 } })} />
            </FormGroup>
            <FormGroup label="VCADRC (%)">
              <Input type="number" step="0.1" value={specialtyParams.sma.vcadrc} onChange={e => updateSpecialtyParams({ sma: { vcadrc: parseFloat(e.target.value) || 0 } })} />
            </FormGroup>
            <FormGroup label="纤维掺量 (%)">
              <Input type="number" step="0.01" value={specialtyParams.sma.fiberContent} onChange={e => updateSpecialtyParams({ sma: { fiberContent: parseFloat(e.target.value) || 0 } })} />
            </FormGroup>
          </div>
        </Card>
      );
    }
    if (basicInfo.designMethod === 'patent-oac') {
      return (
        <Card title="改性沥青 OAC 直算说明">
          <InfoBox>
            直算路径将使用当前道路等级的 VV/VFA 规范上下限代入内置专利公式，生成 OAC 初值。报告会保留“需试验复核”的适用性提示。
          </InfoBox>
        </Card>
      );
    }
    return null;
  }

  function isCalcDisabled() {
    if (basicInfo.designMethod === 'superpave') return !specialtyParams.superpave.asphaltContentAtNdes || !specialtyParams.superpave.gmmAtNdes || !specialtyParams.superpave.gmmAtNmax;
    if (basicInfo.designMethod === 'patent-oac') return false;
    return !isDenseAc || missingRows > 0;
  }

  function calcButtonLabel() {
    if (basicInfo.designMethod === 'superpave') return '计算 Superpave OAC';
    if (basicInfo.designMethod === 'patent-oac') return '直算 OAC';
    return '计算 OAC1 / OAC2';
  }
}

function RawCell({ value, onChange, step }: { value: number; onChange: (value: number) => void; step: string }) {
  return (
    <td className="py-2 px-2 border-b border-border2/60 text-center">
      <Input className="w-[88px] text-center p-1.5" type="number" step={step} value={value || ''} onChange={e => onChange(parseFloat(e.target.value) || 0)} />
    </td>
  );
}
