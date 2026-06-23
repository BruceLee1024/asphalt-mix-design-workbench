import React from 'react';
import { Card, SLabel, FormGroup, Input, Select, Button, InfoBox } from '../ui';
import { useMixDesign } from '../../store/MixDesignContext';
import { STANDARD_PROFILES } from '../../lib/constants';
import type { DesignMethod, MaterialSystem, ProjectDomain, StandardProfileId, TrafficLevel } from '../../types';

export function BasicInfoStep() {
  const { basicInfo, updateBasicInfo, asphaltQuality, updateAsphaltQuality, markStepDone, setStep, isDenseAc, standardProfile, knowledgeVersion, applicableKnowledge } = useMixDesign();

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
              <option value="HM-20">HM-20（高模量）</option>
              <option value="RAP-AC-20">RAP-AC-20（厂拌热再生）</option>
              <option value="CMA-13">CMA-13（冷拌冷铺）</option>
            </Select>
          </FormGroup>
          <FormGroup label="工程类型">
            <Select value={basicInfo.projectDomain} onChange={e => updateBasicInfo({ projectDomain: e.target.value as ProjectDomain })}>
              <option value="road">公路工程</option>
              <option value="airport">机场道面</option>
            </Select>
          </FormGroup>
          <FormGroup label="设计方法">
            <Select value={basicInfo.designMethod} onChange={e => updateBasicInfo({ designMethod: e.target.value as DesignMethod })}>
              <option value="marshall">马歇尔法</option>
              <option value="patent-oac">改性沥青 OAC 直算</option>
              <option value="superpave">Superpave / SGC</option>
            </Select>
          </FormGroup>
          <FormGroup label="材料体系">
            <Select value={basicInfo.materialSystem} onChange={e => updateBasicInfo({ materialSystem: e.target.value as MaterialSystem })}>
              <option value="base">基质沥青</option>
              <option value="modified">聚合物改性</option>
              <option value="sma">SMA / 纤维稳定</option>
              <option value="high-modulus">高模量</option>
              <option value="rap">厂拌热再生</option>
              <option value="cold-mix">冷拌冷铺</option>
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
          <FormGroup label="交通等级">
            <Select value={basicInfo.trafficLevel} onChange={e => updateBasicInfo({ trafficLevel: e.target.value as TrafficLevel })}>
              <option value="light">轻交通</option>
              <option value="medium">中交通</option>
              <option value="heavy">重交通</option>
              <option value="very-heavy">特重交通</option>
            </Select>
          </FormGroup>
          <FormGroup label="设计 ESALs" hint="当有具体当量轴载数据时填写">
            <Input type="number" step="10000" value={basicInfo.esals} onChange={e => updateBasicInfo({ esals: parseFloat(e.target.value) || 0 })} />
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
            当前混合料为专项设计类型，系统会关闭 AC 通用 OAC 自动判定，并启用对应知识库校核项。
          </InfoBox>
        )}
        {basicInfo.designMethod === 'patent-oac' && (
          <InfoBox className="border-l-yellow text-yellow">
            OAC 直算公式仅作为改性沥青目标配合比提效路径，报告会保留适用性提示；必要时仍需用试验曲线复核。
          </InfoBox>
        )}
        {basicInfo.designMethod === 'superpave' && (
          <InfoBox className="border-l-yellow text-yellow">
            Superpave 内置 SGC 参数：600 kPa、1.16°、30 r/min；需补录 Ndes 与 Nmax 压实度数据。
          </InfoBox>
        )}
        <InfoBox>
          当前采用 {standardProfile.designSpec} 与 {standardProfile.testSpec}。知识库版本：{knowledgeVersion}，当前条件匹配 {applicableKnowledge.length} 条依据。
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
              <option value="SBR">SBR 改性沥青</option>
              <option value="HM">高模量专用沥青</option>
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
