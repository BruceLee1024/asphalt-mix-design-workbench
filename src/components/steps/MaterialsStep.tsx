import React from 'react';
import { Card, SLabel, Button, FormGroup, InfoBox, Input, Select } from '../ui';
import { useMixDesign } from '../../store/MixDesignContext';
import { GRADS } from '../../lib/constants';
import type { MaterialSource } from '../../types';
import { AlertTriangle, CheckCircle2, Plus, RefreshCcw, Target, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function MaterialsStep() {
  const {
    basicInfo,
    materials,
    updateMaterial,
    updateMaterialPassRate,
    addMaterial,
    removeMaterial,
    fillDefaultMaterials,
    fitMaterialsToMidpoint,
    blendDesign,
    specialtyParams,
    updateSpecialtyParams,
    setStep,
    markStepDone,
  } = useMixDesign();
  const g = GRADS[basicInfo.mixType];

  const update = (id: string, key: keyof MaterialSource, value: string) => {
    const numeric = ['proportion', 'gammaSb', 'gammaSa', 'absorption'].includes(key);
    updateMaterial(id, { [key]: numeric ? parseFloat(value) || 0 : value } as Partial<MaterialSource>);
  };

  const updateQuality = (material: MaterialSource, key: keyof NonNullable<MaterialSource['quality']>, value: string) => {
    const numeric = ['flakiness', 'crushingValue', 'sandEquivalent', 'hydrophilicCoefficient'].includes(key);
    updateMaterial(material.id, {
      quality: {
        ...material.quality,
        [key]: numeric ? parseFloat(value) || 0 : value,
      } as NonNullable<MaterialSource['quality']>,
    });
  };

  const updateRapFraction = (id: string, updates: Partial<typeof specialtyParams.rap.fractions[number]>) => {
    updateSpecialtyParams({ rap: { fractions: specialtyParams.rap.fractions.map(fraction => fraction.id === id ? { ...fraction, ...updates } : fraction) } });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SLabel>原材料组成</SLabel>

      <Card
        title="材料比例与密度"
        headerRight={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={fillDefaultMaterials}><RefreshCcw className="w-3.5 h-3.5" /> 默认</Button>
            <Button variant="ghost" size="sm" onClick={fitMaterialsToMidpoint}><Target className="w-3.5 h-3.5" /> 拟合中值</Button>
            <Button variant="ghost" size="sm" onClick={addMaterial}><Plus className="w-3.5 h-3.5" /> 新增</Button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr>
                {['状态', '材料名称', '类型', '比例(%)', '毛体积密度', '表观密度', '吸水率(%)', '操作'].map(h => (
                  <th key={h} className="bg-app-bg text-text3 text-[10px] py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.map(m => {
                const hasMissing = !m.name.trim() || !m.gammaSb || !m.gammaSa || m.passRates.length !== g.sieves.length;
                const hasBadRate = m.passRates.some(v => v < 0 || v > 100 || Number.isNaN(v));
                const rowOk = !hasMissing && !hasBadRate;
                return (
                  <tr key={m.id} className={cn("hover:bg-[rgba(245,166,35,0.025)]", !rowOk && "bg-yellow/5")}>
                    <td className="py-2 px-3 border-b border-border2/60 text-center">
                      <span className={cn("inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[10px] font-mono", rowOk ? "border-green/30 text-green bg-green/5" : "border-yellow/30 text-yellow bg-yellow/5")}>
                        {rowOk ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {rowOk ? '完整' : '待复核'}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-b border-border2/60">
                      <Input className="min-w-[150px] p-1.5" value={m.name} onChange={e => update(m.id, 'name', e.target.value)} />
                    </td>
                    <td className="py-2 px-3 border-b border-border2/60">
                      <Select className="min-w-[90px] p-1.5" value={m.type} onChange={e => updateMaterial(m.id, { type: e.target.value as MaterialSource['type'] })}>
                        <option value="coarse">粗集料</option>
                        <option value="fine">细集料</option>
                        <option value="filler">矿粉</option>
                        <option value="rap">RAP</option>
                        <option value="fiber">纤维</option>
                        <option value="additive">外掺剂</option>
                      </Select>
                    </td>
                    <td className="py-2 px-3 border-b border-border2/60"><Input className="w-[76px] text-center p-1.5" type="number" step="0.1" value={m.proportion} onChange={e => update(m.id, 'proportion', e.target.value)} /></td>
                    <td className="py-2 px-3 border-b border-border2/60"><Input className="w-[86px] text-center p-1.5" type="number" step="0.001" value={m.gammaSb} onChange={e => update(m.id, 'gammaSb', e.target.value)} /></td>
                    <td className="py-2 px-3 border-b border-border2/60"><Input className="w-[86px] text-center p-1.5" type="number" step="0.001" value={m.gammaSa} onChange={e => update(m.id, 'gammaSa', e.target.value)} /></td>
                    <td className="py-2 px-3 border-b border-border2/60"><Input className="w-[76px] text-center p-1.5" type="number" step="0.01" value={m.absorption} onChange={e => update(m.id, 'absorption', e.target.value)} /></td>
                    <td className="py-2 px-3 border-b border-border2/60 text-center">
                      <Button variant="ghost" size="sm" onClick={() => removeMaterial(m.id)} disabled={materials.length <= 1} aria-label={`删除 ${m.name}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <InfoBox className={Math.abs(blendDesign.totalProportion - 100) <= 0.2 ? 'border-l-green text-green' : 'border-l-yellow text-yellow'}>
          当前合成比例合计 {blendDesign.totalProportion.toFixed(1)}%。启用 RAP 后，RAP 总量固定，拟合仅调整原生料。
        </InfoBox>
      </Card>

      <Card title="RAP / 纤维 / 外掺剂专项参数">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
          <FormGroup label="启用 RAP">
            <Select value={specialtyParams.rap.enabled ? 'yes' : 'no'} onChange={e => updateSpecialtyParams({ rap: { enabled: e.target.value === 'yes' } })}>
              <option value="no">否</option>
              <option value="yes">是</option>
            </Select>
          </FormGroup>
          <FormGroup label="RAP 掺量 (%)">
            <Input type="number" step="0.1" value={specialtyParams.rap.content} onChange={e => updateSpecialtyParams({ rap: { content: parseFloat(e.target.value) || 0 } })} />
          </FormGroup>
          <FormGroup label="RAP 沥青含量 (%)" hint="用于扣减应添加新沥青">
            <Input type="number" step="0.01" value={specialtyParams.rap.asphaltContent} onChange={e => updateSpecialtyParams({ rap: { asphaltContent: parseFloat(e.target.value) || 0 } })} />
          </FormGroup>
          <FormGroup label="RAP 含水率 (%)" hint="知识库限值：≤ 3%">
            <Input type="number" step="0.1" value={specialtyParams.rap.moisture} onChange={e => updateSpecialtyParams({ rap: { moisture: parseFloat(e.target.value) || 0 } })} />
          </FormGroup>
          <FormGroup label="RAP 最大粒径 (mm)" hint="知识库限值：≤ 26.5mm">
            <Input type="number" step="0.1" value={specialtyParams.rap.maxParticleSize} onChange={e => updateSpecialtyParams({ rap: { maxParticleSize: parseFloat(e.target.value) || 0 } })} />
          </FormGroup>
          <FormGroup label="RAP 假颗粒含量 (%)">
            <Input type="number" step="0.1" value={specialtyParams.rap.falseParticleContent} onChange={e => updateSpecialtyParams({ rap: { falseParticleContent: parseFloat(e.target.value) || 0 } })} />
          </FormGroup>
          <FormGroup label="高模量外掺剂 (%)">
            <Input type="number" step="0.1" value={specialtyParams.additives.highModulusAdditiveContent} onChange={e => updateSpecialtyParams({ additives: { highModulusAdditiveContent: parseFloat(e.target.value) || 0 } })} />
          </FormGroup>
          <FormGroup label="纤维类型">
            <Input value={specialtyParams.additives.fiberType} onChange={e => updateSpecialtyParams({ additives: { fiberType: e.target.value } })} />
          </FormGroup>
          <FormGroup label="抗剥落剂掺量 (%)">
            <Input type="number" step="0.01" value={specialtyParams.additives.antiStrippingAgentContent} onChange={e => updateSpecialtyParams({ additives: { antiStrippingAgentContent: parseFloat(e.target.value) || 0 } })} />
          </FormGroup>
        </div>
        <InfoBox>
          RAP 掺量按矿料总质量固定。系统以 RAP 掺量 × RAP 沥青含量计算旧沥青贡献，并在 OAC 结果中扣减应添加新沥青。
        </InfoBox>
      </Card>

      {specialtyParams.rap.enabled && (
        <Card title="RAP 破碎分档与合成级配贡献">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-xs">
              <thead><tr>{['分档', '产出率 (%)', '有效掺量 (%)', ...g.sieves.map(s => `${s}mm`)].map(label => <th key={label} className="bg-app-bg text-text3 text-[10px] py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">{label}</th>)}</tr></thead>
              <tbody>{specialtyParams.rap.fractions.map(fraction => (
                <tr key={fraction.id} className="hover:bg-[rgba(245,166,35,0.025)]">
                  <td className="py-2 px-3 border-b border-border2/60 text-amber font-bold">{fraction.label}</td>
                  <td className="py-2 px-2 border-b border-border2/60"><Input className="w-[76px] text-center p-1.5" type="number" step="0.1" value={fraction.yield} onChange={e => updateRapFraction(fraction.id, { yield: parseFloat(e.target.value) || 0 })} /></td>
                  <td className="py-2 px-3 border-b border-border2/60 text-center text-text1">{(specialtyParams.rap.content * fraction.yield / 100).toFixed(1)}</td>
                  {g.sieves.map((_, index) => <td key={index} className="py-2 px-2 border-b border-border2/60"><Input className="w-[68px] text-center p-1.5" type="number" step="0.1" value={fraction.passRates[index] ?? 0} onChange={e => { const passRates = [...fraction.passRates]; passRates[index] = parseFloat(e.target.value) || 0; updateRapFraction(fraction.id, { passRates }); }} /></td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
          <InfoBox className={Math.abs(specialtyParams.rap.fractions.reduce((sum, fraction) => sum + fraction.yield, 0) - 100) <= 0.2 ? 'border-l-green text-green' : 'border-l-yellow text-yellow'}>
            RAP 分档产出率合计 {specialtyParams.rap.fractions.reduce((sum, fraction) => sum + fraction.yield, 0).toFixed(1)}%，应为 100%。细料/粗料会按有效掺量参与合成级配。
          </InfoBox>
        </Card>
      )}

      <Card title="材料来源与质量台账">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr>
                {['材料', '产地/料场', '规格', '批次', '检测报告号', '针片状(%)', '压碎值(%)', '砂当量(%)', '亲水系数', '黏附性等级', '项目最低等级'].map(h => (
                  <th key={h} className="bg-app-bg text-text3 text-[10px] py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id} className="hover:bg-[rgba(245,166,35,0.025)]">
                  <td className="py-2 px-3 border-b border-border2/60 text-amber font-bold whitespace-nowrap">{m.name}</td>
                  <td className="py-2 px-2 border-b border-border2/60"><Input className="w-[120px] p-1.5" value={m.quality?.origin ?? ''} onChange={e => updateQuality(m, 'origin', e.target.value)} /></td>
                  <td className="py-2 px-2 border-b border-border2/60"><Input className="w-[100px] p-1.5" value={m.quality?.specification ?? ''} onChange={e => updateQuality(m, 'specification', e.target.value)} /></td>
                  <td className="py-2 px-2 border-b border-border2/60"><Input className="w-[100px] p-1.5" value={m.quality?.batchNo ?? ''} onChange={e => updateQuality(m, 'batchNo', e.target.value)} /></td>
                  <td className="py-2 px-2 border-b border-border2/60"><Input className="w-[130px] p-1.5" value={m.quality?.testReportNo ?? ''} onChange={e => updateQuality(m, 'testReportNo', e.target.value)} /></td>
                  <td className="py-2 px-2 border-b border-border2/60"><Input className="w-[76px] text-center p-1.5" type="number" step="0.1" value={m.quality?.flakiness ?? 0} onChange={e => updateQuality(m, 'flakiness', e.target.value)} /></td>
                  <td className="py-2 px-2 border-b border-border2/60"><Input className="w-[76px] text-center p-1.5" type="number" step="0.1" value={m.quality?.crushingValue ?? 0} onChange={e => updateQuality(m, 'crushingValue', e.target.value)} /></td>
                  <td className="py-2 px-2 border-b border-border2/60"><Input className="w-[76px] text-center p-1.5" type="number" step="0.1" value={m.quality?.sandEquivalent ?? 0} onChange={e => updateQuality(m, 'sandEquivalent', e.target.value)} /></td>
                  <td className="py-2 px-2 border-b border-border2/60"><Input className="w-[76px] text-center p-1.5" type="number" step="0.01" value={m.quality?.hydrophilicCoefficient ?? 0} onChange={e => updateQuality(m, 'hydrophilicCoefficient', e.target.value)} /></td>
                  <td className="py-2 px-2 border-b border-border2/60"><Input className="w-[76px] text-center p-1.5" type="number" min="0" max="5" step="1" value={m.quality?.adhesionGrade ?? 0} onChange={e => updateQuality(m, 'adhesionGrade', e.target.value)} disabled={m.type !== 'coarse'} /></td>
                  <td className="py-2 px-2 border-b border-border2/60"><Input className="w-[76px] text-center p-1.5" type="number" min="0" max="5" step="1" value={m.quality?.minimumAdhesionGrade ?? 0} onChange={e => updateQuality(m, 'minimumAdhesionGrade', e.target.value)} disabled={m.type !== 'coarse'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InfoBox>黏附性仅适用于粗集料。项目最低等级留空或为 0 时只记录；设定后，实测等级低于要求会进入问题台账。</InfoBox>
      </Card>

      <Card title="各材料筛分通过率">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr>
                <th className="bg-app-bg text-text3 text-[10px] py-2.5 px-3 text-left border-b border-border font-normal sticky left-0 z-10">材料</th>
                {g.sieves.map(s => (
                  <th key={s} className="bg-app-bg text-text3 text-[10px] py-2.5 px-3 text-center border-b border-border font-normal whitespace-nowrap">{s}mm</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id}>
                  <td className="py-2 px-3 border-b border-border2/60 text-amber font-bold sticky left-0 bg-surface z-10 whitespace-nowrap">{m.name}</td>
                  {g.sieves.map((_, i) => {
                    const value = m.passRates[i] ?? 0;
                    const invalid = value < 0 || value > 100;
                    return (
                    <td key={i} className={cn("py-2 px-2 border-b border-border2/60", invalid && "bg-red/5")}>
                      <Input className={cn("w-[68px] text-center p-1.5", invalid && "border-red text-red")} type="number" step="0.1" value={value} onChange={e => updateMaterialPassRate(m.id, i, parseFloat(e.target.value) || 0)} />
                    </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-between mt-6 pb-2">
        <Button variant="ghost" onClick={() => setStep(1)}>← 返回</Button>
        <Button onClick={() => { markStepDone(2); setStep(3); }}>下一步：级配合成 →</Button>
      </div>
    </div>
  );
}
