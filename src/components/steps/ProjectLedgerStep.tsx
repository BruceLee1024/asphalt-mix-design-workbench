import React from 'react';
import { Archive, ClipboardList } from 'lucide-react';
import { Button, Card, FormGroup, InfoBox, Input, SLabel } from '../ui';
import { useMixDesign } from '../../store/MixDesignContext';

export function ProjectLedgerStep() {
  const { projectLedger, updateProjectLedger, reportVersion, projectReadiness, markStepDone, setStep } = useMixDesign();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SLabel>项目台账</SLabel>

      <Card
        title="项目与样品台账"
        headerRight={<span className="font-mono text-[11px] text-text3">PROJECT LEDGER</span>}
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
          <FormGroup label="工程编号">
            <Input value={projectLedger.projectCode} onChange={e => updateProjectLedger({ projectCode: e.target.value })} placeholder="PRJ-AC-2026-001" />
          </FormGroup>
          <FormGroup label="委托单位">
            <Input value={projectLedger.clientUnit} onChange={e => updateProjectLedger({ clientUnit: e.target.value })} placeholder="填写委托单位" />
          </FormGroup>
          <FormGroup label="样品编号">
            <Input value={projectLedger.sampleCode} onChange={e => updateProjectLedger({ sampleCode: e.target.value })} placeholder="YP-AC-001" />
          </FormGroup>
          <FormGroup label="取样地点">
            <Input value={projectLedger.sampleLocation} onChange={e => updateProjectLedger({ sampleLocation: e.target.value })} placeholder="料仓/拌合站/现场" />
          </FormGroup>
          <FormGroup label="取样日期">
            <Input type="date" value={projectLedger.samplingDate} onChange={e => updateProjectLedger({ samplingDate: e.target.value })} />
          </FormGroup>
          <FormGroup label="试验日期">
            <Input type="date" value={projectLedger.testDate} onChange={e => updateProjectLedger({ testDate: e.target.value })} />
          </FormGroup>
          <FormGroup label="试验人">
            <Input value={projectLedger.tester} onChange={e => updateProjectLedger({ tester: e.target.value })} />
          </FormGroup>
          <FormGroup label="复核人">
            <Input value={projectLedger.reviewer} onChange={e => updateProjectLedger({ reviewer: e.target.value })} />
          </FormGroup>
          <FormGroup label="批准人">
            <Input value={projectLedger.approver} onChange={e => updateProjectLedger({ approver: e.target.value })} />
          </FormGroup>
          <FormGroup label="报告编号" hint="冻结报告时为空则自动生成">
            <Input value={projectLedger.reportCode} onChange={e => updateProjectLedger({ reportCode: e.target.value })} placeholder="自动或手动填写" />
          </FormGroup>
        </div>
      </Card>

      <Card title="报告归档状态">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <LedgerStat icon={ClipboardList} label="台账状态" value={projectReadiness.canFreeze ? '基础信息可归档' : '存在待处理项'} />
          <LedgerStat icon={Archive} label="报告版本" value={reportVersion.status === 'frozen' ? `已冻结 ${reportVersion.version}` : `草稿 ${reportVersion.version}`} />
          <LedgerStat icon={Archive} label="冻结结论" value={projectReadiness.statusText} />
        </div>
        <InfoBox>项目台账是报告、导出资料包和冻结归档的基础信息源；后续修改核心数据会自动回到草稿状态。</InfoBox>
      </Card>

      <div className="flex justify-end mt-6 pb-2">
        <Button onClick={() => { markStepDone(0); setStep(1); }}>
          下一步：基本参数 →
        </Button>
      </div>
    </div>
  );
}

function LedgerStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-app-bg px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] text-text3 font-mono tracking-widest uppercase">
        <Icon className="w-3.5 h-3.5 text-amber" />
        {label}
      </div>
      <div className="mt-1 font-mono text-[15px] font-bold text-text1">{value}</div>
    </div>
  );
}
