import React from 'react';
import { Card, SLabel, FormGroup, Input, Select, Button, InfoBox } from '../ui';
import { useMixDesign } from '../../store/MixDesignContext';
import { STANDARD_PROFILES } from '../../lib/constants';
import type { StandardProfileId } from '../../types';

export function BasicInfoStep() {
  const { basicInfo, updateBasicInfo, asphaltQuality, updateAsphaltQuality, markStepDone, setStep, isDenseAc, standardProfile } = useMixDesign();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SLabel>基本参数设置</SLabel>
      
      <Card title="混合料类型 & 工程信息">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          <FormGroup label="混合料类型">
            <Select 
              value={basicInfo.mixType} 
              onChange={e => updateBasicInfo({ mixType: e.target.value as any })}
            >
              <option value="AC-13">AC-13（细粒式）</option>
              <option value="AC-16">AC-16（中粒式）</option>
              <option value="AC-20">AC-20（中粒式）</option>
              <option value="AC-25">AC-25（粗粒式）</option>
              <option value="SMA-13">SMA-13（骨架密实）</option>
              <option value="OGFC-13">OGFC-13（开级配排水）</option>
            </Select>
          </FormGroup>
          <FormGroup label="规范版本">
            <Select
              value={basicInfo.standardProfileId}
              onChange={e => updateBasicInfo({ standardProfileId: e.target.value as StandardProfileId })}
            >
              {Object.values(STANDARD_PROFILES).map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label="道路等级">
            <Select value={basicInfo.roadGrade} onChange={e => updateBasicInfo({ roadGrade: e.target.value as any })}>
              <option value="hw">高速公路 / 一级公路</option>
              <option value="2nd">二级公路</option>
              <option value="3rd">三级及以下公路</option>
            </Select>
          </FormGroup>
          <FormGroup label="面层位置">
            <Select value={basicInfo.layerPos} onChange={e => updateBasicInfo({ layerPos: e.target.value as any })}>
              <option value="top">上面层</option>
              <option value="mid">中面层</option>
              <option value="bot">下面层</option>
            </Select>
          </FormGroup>
          <FormGroup label="气候分区">
            <Select value={basicInfo.climate} onChange={e => updateBasicInfo({ climate: e.target.value })}>
              <option>1区（夏炎热冬严寒）</option>
              <option>2区（夏热冬冷）</option>
              <option>3区（夏热冬温）</option>
              <option>4区（夏凉冬寒）</option>
            </Select>
          </FormGroup>
          <FormGroup label="工程名称（报告用）">
            <Input value={basicInfo.projName} onChange={e => updateBasicInfo({ projName: e.target.value })} placeholder="填写工程名称" />
          </FormGroup>
          <FormGroup label="设计单位">
            <Input value={basicInfo.projUnit} onChange={e => updateBasicInfo({ projUnit: e.target.value })} placeholder="填写设计单位" />
          </FormGroup>
        </div>
        {!isDenseAc && (
          <InfoBox className="border-l-yellow text-yellow">
            SMA/OGFC 已保留为专项类型入口，本轮通用 OAC 自动判定仅适用于 AC 密级配混合料。
          </InfoBox>
        )}
        <InfoBox>
          当前采用 {standardProfile.designSpec} 与 {standardProfile.testSpec}。历史项目可切换到 JTG E20-2011。
        </InfoBox>
      </Card>

      <Card title="原材料密度参数">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          <FormGroup label="沥青品种 / 标号">
            <Select value={basicInfo.asphaltGrade} onChange={e => updateBasicInfo({ asphaltGrade: e.target.value })}>
              <option value="70A">70号 A级道路石油沥青</option>
              <option value="90A">90号 A级道路石油沥青</option>
              <option value="110A">110号 A级道路石油沥青</option>
              <option value="SBS-ID">SBS改性沥青 I-D</option>
              <option value="SBS-IC">SBS改性沥青 I-C</option>
            </Select>
          </FormGroup>
          <FormGroup label="沥青密度 ρb (g/cm³)" hint="实测值，70号参考值 1.020~1.040">
            <Input type="number" step="0.001" value={basicInfo.denB} onChange={e => updateBasicInfo({ denB: parseFloat(e.target.value) || 0 })} />
          </FormGroup>
          <FormGroup label="矿料合成毛体积密度 γsb" hint="用于 VMA 等体积指标计算, 建议 2.650~2.750">
            <Input type="number" step="0.001" value={basicInfo.gammaSb} onChange={e => updateBasicInfo({ gammaSb: parseFloat(e.target.value) || 0 })} />
          </FormGroup>
          <FormGroup label="矿料合成表观密度 γsa" hint="计算法理论最大密度的重要参数">
            <Input type="number" step="0.001" value={basicInfo.gammaSa} onChange={e => updateBasicInfo({ gammaSa: parseFloat(e.target.value) || 0 })} />
          </FormGroup>
          <FormGroup label="粗集料吸水率 w (%)" hint="> 2% 需修正有效沥青量">
            <Input type="number" step="0.01" value={basicInfo.wa} onChange={e => updateBasicInfo({ wa: parseFloat(e.target.value) || 0 })} />
          </FormGroup>
        </div>
        <InfoBox>
          📌 所有密度参数应使用实验室实测值。理论最大密度 γt 按 T0711 真空法测定，也可用计算法求得。吸水率 &gt; 2% 时须按 JTG E20 T0711 修正有效沥青用量。
        </InfoBox>
      </Card>

      <Card title="沥青质量台账">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
          <FormGroup label="供应商">
            <Input value={asphaltQuality.supplier} onChange={e => updateAsphaltQuality({ supplier: e.target.value })} />
          </FormGroup>
          <FormGroup label="批号">
            <Input value={asphaltQuality.batchNo} onChange={e => updateAsphaltQuality({ batchNo: e.target.value })} />
          </FormGroup>
          <FormGroup label="检测报告编号">
            <Input value={asphaltQuality.testReportNo} onChange={e => updateAsphaltQuality({ testReportNo: e.target.value })} />
          </FormGroup>
          <FormGroup label="针入度 (0.1mm)">
            <Input type="number" step="0.1" value={asphaltQuality.penetration} onChange={e => updateAsphaltQuality({ penetration: parseFloat(e.target.value) || 0 })} />
          </FormGroup>
          <FormGroup label="软化点 (°C)">
            <Input type="number" step="0.1" value={asphaltQuality.softeningPoint} onChange={e => updateAsphaltQuality({ softeningPoint: parseFloat(e.target.value) || 0 })} />
          </FormGroup>
          <FormGroup label="延度 (cm)">
            <Input type="number" step="0.1" value={asphaltQuality.ductility} onChange={e => updateAsphaltQuality({ ductility: parseFloat(e.target.value) || 0 })} />
          </FormGroup>
        </div>
      </Card>

      <div className="flex justify-between mt-6 pb-2">
        <Button variant="ghost" onClick={() => setStep(0)}>← 返回项目台账</Button>
        <Button onClick={() => { markStepDone(1); setStep(2); }}>
          下一步：原材料组成 →
        </Button>
      </div>
    </div>
  );
}
