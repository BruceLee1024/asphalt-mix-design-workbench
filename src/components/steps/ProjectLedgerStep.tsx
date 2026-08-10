import React from 'react';
import { AlertTriangle, Archive, CheckCircle2, ClipboardList, Copy, FileText, FolderOpen, Layers3, Plus, Trash2 } from 'lucide-react';
import { Button, Card, FormGroup, InfoBox, Input, SLabel } from '../ui';
import { useMixDesign } from '../../store/MixDesignContext';
import { cn } from '../../lib/utils';

export function ProjectLedgerStep() {
  const {
    basicInfo,
    updateBasicInfo,
    projectLedger,
    updateProjectLedger,
    reportVersion,
    projectReadiness,
    reviewIssues,
    markStepDone,
    setStep,
    activeProject,
    activeDesign,
    projectDesigns,
    createDesignForActiveProject,
    duplicateActiveDesign,
    switchDesign,
    deleteDesign,
  } = useMixDesign();
  const blockingCount = reviewIssues.filter(issue => issue.level === 'blocking').length;
  const warningCount = reviewIssues.filter(issue => issue.level === 'warning').length;
  const requiredProjectFields = [
    { label: '工程名称', value: basicInfo.projName },
    { label: '编制单位', value: basicInfo.projUnit },
    { label: '工程编号', value: projectLedger.projectCode },
    { label: '委托单位', value: projectLedger.clientUnit },
    { label: '样品编号', value: projectLedger.sampleCode },
  ];
  const missingProjectFields = requiredProjectFields.filter(field => !field.value.trim());
  const canContinue = missingProjectFields.length === 0;
  const requiredInputClass = (value: string) => !value.trim() ? 'border-red/50 focus:border-red focus:ring-red/10' : '';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SLabel>项目台账</SLabel>

      <Card
        title="当前项目 / 设计台账"
        headerRight={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={createDesignForActiveProject}><Plus className="w-3.5 h-3.5" /> 新建设计</Button>
            <Button variant="ghost" size="sm" onClick={duplicateActiveDesign}><Copy className="w-3.5 h-3.5" /> 复制当前</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <LedgerStat icon={FolderOpen} label="当前项目" value={activeProject.name} />
              <LedgerStat icon={FileText} label="当前设计" value={activeDesign.name} />
              <LedgerStat icon={Layers3} label="混合料类型" value={basicInfo.mixType} />
              <LedgerStat icon={Archive} label="报告状态" value={reportVersion.status === 'frozen' ? `已冻结 ${reportVersion.version}` : `草稿 ${reportVersion.version}`} />
            </div>

            <div className="rounded-sm border border-border bg-app-bg px-4 py-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ContextRow label="工程编号" value={projectLedger.projectCode || '未登记'} />
                <ContextRow label="样品编号" value={projectLedger.sampleCode || '未填写'} />
                <ContextRow label="项目设计数" value={`${projectDesigns.length} 条`} />
              </div>
            </div>

            <InfoBox>
              左侧项目树负责切换项目和配合比设计；本页只编辑当前选中设计台账。每个设计拥有独立的材料、级配、马歇尔、OAC、性能验证和报告记录。
            </InfoBox>
          </div>

          <div className={cn("rounded-sm border px-4 py-3", projectReadiness.canFreeze ? "border-green/25 bg-green/5" : "border-red/25 bg-red/5")}>
            <div className="flex items-center gap-2 text-[10px] text-text3 font-mono tracking-widest uppercase">
              {projectReadiness.canFreeze ? <CheckCircle2 className="w-3.5 h-3.5 text-green" /> : <AlertTriangle className="w-3.5 h-3.5 text-red" />}
              Readiness
            </div>
            <div className={cn("mt-2 font-mono text-[16px] font-bold", projectReadiness.canFreeze ? "text-green" : "text-red")}>{projectReadiness.statusText}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <IssueBadge blocking={blockingCount} warning={warningCount} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_420px] gap-4">
        <Card title="当前设计台账信息">
          {missingProjectFields.length ? (
            <InfoBox className="mb-5 mt-0 border-l-red text-red">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              新建项目需先补全：{missingProjectFields.map(field => field.label).join('、')}。补全后才能进入下一步设计。
            </InfoBox>
          ) : (
            <InfoBox className="mb-5 mt-0 border-l-green text-green">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              项目基本信息已补全，可以进入基本参数设置。
            </InfoBox>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
            <FormGroup label="工程名称">
              <Input className={requiredInputClass(basicInfo.projName)} value={basicInfo.projName} onChange={e => updateBasicInfo({ projName: e.target.value })} placeholder="填写工程名称" />
            </FormGroup>
            <FormGroup label="编制单位">
              <Input className={requiredInputClass(basicInfo.projUnit)} value={basicInfo.projUnit} onChange={e => updateBasicInfo({ projUnit: e.target.value })} placeholder="填写编制单位" />
            </FormGroup>
            <FormGroup label="工程编号">
              <Input className={requiredInputClass(projectLedger.projectCode)} value={projectLedger.projectCode} onChange={e => updateProjectLedger({ projectCode: e.target.value })} placeholder="PRJ-AC-2026-001" />
            </FormGroup>
            <FormGroup label="委托单位">
              <Input className={requiredInputClass(projectLedger.clientUnit)} value={projectLedger.clientUnit} onChange={e => updateProjectLedger({ clientUnit: e.target.value })} placeholder="填写委托单位" />
            </FormGroup>
            <FormGroup label="样品编号">
              <Input className={requiredInputClass(projectLedger.sampleCode)} value={projectLedger.sampleCode} onChange={e => updateProjectLedger({ sampleCode: e.target.value })} placeholder="YP-AC-001" />
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

        <Card
          title="同项目配合比设计"
          headerRight={<span className="font-mono text-[11px] text-text3">{projectDesigns.length} RECORDS</span>}
        >
          <div className="space-y-2">
            {projectDesigns.map(design => {
              const active = design.id === activeDesign.id;
              return (
                <div key={design.id} className={cn("rounded-sm border px-3 py-3", active ? "border-amber/30 bg-amber/10" : "border-border bg-app-bg")}>
                  <div className="flex items-start gap-3">
                    <FileText className={cn("mt-0.5 w-4 h-4 shrink-0", active ? "text-amber" : "text-text3")} />
                    <div className="min-w-0 flex-1">
                      <div className={cn("truncate text-[13px] font-bold", active ? "text-amber" : "text-text1")}>{design.name}</div>
                      <div className="mt-1 font-mono text-[10px] text-text3">
                        {design.mixType} · {design.sampleCode || '未命名样品'} · {design.reportStatus === 'frozen' ? '已冻结' : '草稿'}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-text3">更新 {formatDateTime(design.updatedAt)}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => switchDesign(design.id)} disabled={active}>打开</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteDesign(design.id)} disabled={projectDesigns.length <= 1} aria-label={`删除设计 ${design.name}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="报告归档状态">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <LedgerStat icon={ClipboardList} label="台账状态" value={projectReadiness.canFreeze ? '基础信息可归档' : '存在待处理项'} />
          <LedgerStat icon={Archive} label="报告版本" value={reportVersion.status === 'frozen' ? `已冻结 ${reportVersion.version}` : `草稿 ${reportVersion.version}`} />
          <LedgerStat icon={Archive} label="冻结结论" value={projectReadiness.statusText} />
        </div>
      </Card>

      <div className="flex justify-end mt-6 pb-2">
        <Button disabled={!canContinue} onClick={() => { if (!canContinue) return; markStepDone(0); setStep(1); }}>
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
      <div className="mt-1 font-mono text-[15px] font-bold text-text1 truncate">{value}</div>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] text-text3 tracking-widest uppercase">{label}</div>
      <div className="mt-1 font-mono text-[12px] font-bold text-text1 truncate">{value}</div>
    </div>
  );
}

function IssueBadge({ blocking, warning }: { blocking: number; warning: number }) {
  if (!blocking && !warning) return <span className="rounded-sm border border-green/30 bg-green/5 px-2 py-1 text-[10px] text-green font-bold">0 问题</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      {blocking ? <span className="rounded-sm border border-red/30 bg-red/5 px-2 py-1 text-[10px] text-red font-bold">{blocking} 阻塞</span> : null}
      {warning ? <span className="rounded-sm border border-yellow/30 bg-yellow/5 px-2 py-1 text-[10px] text-yellow font-bold">{warning} 警告</span> : null}
    </span>
  );
}

function formatDateTime(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
