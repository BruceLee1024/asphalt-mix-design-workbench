import React from 'react';
import { cn } from '../../lib/utils';
import { useMixDesign } from '../../store/MixDesignContext';
import { AlertTriangle, Ban, Check, ChevronLeft, ChevronRight, Circle, FileText, Folder, FolderOpen, PanelLeftOpen, PencilLine, Plus } from 'lucide-react';
import type { StepStatus } from '../../types';

const STEPS = [
  { num: '01', name: '项目台账', eng: 'Project Ledger' },
  { num: '02', name: '基本参数设置', eng: 'Basic Parameters' },
  { num: '03', name: '原材料台账', eng: 'Material Ledger' },
  { num: '04', name: '矿料级配合成', eng: 'Blend Gradation' },
  { num: '05', name: '马歇尔原始记录', eng: 'Marshall Records' },
  { num: '06', name: 'OAC 分析', eng: 'OAC Analysis' },
  { num: '07', name: '性能验证台账', eng: 'Performance Ledger' },
  { num: '08', name: '报告归档与问题台账', eng: 'Report Archive' },
  { num: '09', name: '应用内知识库', eng: 'Knowledge Base' },
];

export function Sidebar() {
  const {
    step,
    setStep,
    workflowStatus,
    portfolio,
    activeProject,
    activeDesign,
    createProject,
    createDesignForActiveProject,
    switchProject,
    switchDesign,
  } = useMixDesign();
  const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(() => new Set([activeProject.id]));
  const [projectTreeCollapsed, setProjectTreeCollapsed] = React.useState(false);

  React.useEffect(() => {
    setExpandedProjects(prev => new Set(prev).add(activeProject.id));
  }, [activeProject.id]);

  const activeFlow = workflowStatus[step];
  const activeStepMeta = STEPS[step] ?? STEPS[0];

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  return (
    <div className="shrink-0 flex print:hidden">
    {projectTreeCollapsed ? (
      <aside className="w-11 bg-surface/50 border-r border-border shrink-0 flex flex-col items-center">
        <button
          onClick={() => setProjectTreeCollapsed(false)}
          className="mt-4 h-8 w-8 rounded-sm border border-border text-text3 hover:text-text1 hover:border-border2 hover:bg-surface2 inline-flex items-center justify-center"
          title="展开项目结构"
          aria-label="展开项目结构"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <div className="mt-4 h-px w-6 bg-border" />
        <div className="mt-4 flex flex-col items-center gap-3">
          <Folder className="w-4 h-4 text-amber" />
          <div className="font-mono text-[9px] text-text3 [writing-mode:vertical-rl] tracking-[3px]">PROJECT</div>
        </div>
      </aside>
    ) : (
    <aside className="w-[280px] bg-surface/50 border-r border-border shrink-0 flex flex-col">
      <div className="px-4 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] font-bold tracking-[3px] text-text3 uppercase">Project Tree</span>
            <div className="mt-1 font-mono text-[9px] text-text3/70">项目 / 设计台账</div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setProjectTreeCollapsed(true)}
              className="h-7 w-7 rounded-sm border border-border text-text3 hover:text-text1 hover:border-border2 hover:bg-surface2 inline-flex items-center justify-center"
              title="隐藏项目结构"
              aria-label="隐藏项目结构"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={createProject}
              className="h-7 w-7 rounded-sm border border-border text-text3 hover:text-text1 hover:border-border2 hover:bg-surface2 inline-flex items-center justify-center"
              title="新建项目"
              aria-label="新建项目"
            >
              <Folder className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={createDesignForActiveProject}
              className="h-7 w-7 rounded-sm border border-border text-text3 hover:text-text1 hover:border-border2 hover:bg-surface2 inline-flex items-center justify-center"
              title="为当前项目新建配合比设计"
              aria-label="新建配合比设计"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <div className="space-y-1.5">
          {portfolio.projects.map(project => {
            const active = project.id === activeProject.id;
            const expanded = expandedProjects.has(project.id);
            const designs = portfolio.designs.filter(design => design.projectId === project.id);
            return (
              <div key={project.id} className={cn("rounded-md border", active ? "border-amber/20 bg-amber/[0.035]" : "border-transparent")}>
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="h-6 w-6 shrink-0 rounded-sm text-text3 hover:bg-surface2 hover:text-text1 inline-flex items-center justify-center"
                    aria-label={expanded ? '收起项目' : '展开项目'}
                  >
                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-90")} />
                  </button>
                  <button
                    onClick={() => switchProject(project.id)}
                    className="min-w-0 flex-1 text-left"
                    title={`${project.projectCode} · ${project.name}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {expanded ? <FolderOpen className="w-3.5 h-3.5 shrink-0 text-amber" /> : <Folder className="w-3.5 h-3.5 shrink-0 text-text3" />}
                      <span className={cn("truncate text-[12px] font-bold", active ? "text-amber" : "text-text2")}>{project.name}</span>
                    </div>
                    <div className="ml-5 mt-0.5 truncate font-mono text-[9px] text-text3">{project.projectCode || '未登记'} · {designs.length} 个设计</div>
                  </button>
                </div>
                {expanded && (
                  <div className="ml-7 border-l border-border/60 pb-1 pl-2">
                    {designs.map(design => {
                      const designActive = design.id === activeDesign.id;
                      const state = design.state;
                      return (
                        <div key={design.id}>
                          <button
                            onClick={() => switchDesign(design.id)}
                            className={cn(
                              "group my-0.5 flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left transition-colors",
                              designActive ? "bg-amber/10 text-amber" : "text-text2 hover:bg-surface2 hover:text-text1"
                            )}
                            title={design.name}
                          >
                            <FileText className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", designActive ? "text-amber" : "text-text3 group-hover:text-text2")} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[11px] font-bold">{design.name}</span>
                              <span className="mt-0.5 block truncate font-mono text-[9px] text-text3">
                                {state.basicInfo.mixType} · {state.projectLedger.sampleCode || '未命名样品'} · {state.reportVersion.status === 'frozen' ? '已冻结' : '草稿'}
                              </span>
                            </span>
                          </button>
                        </div>
                      );
                    })}
                    {!designs.length && (
                      <div className="px-2 py-2 font-mono text-[10px] text-text3">暂无配合比设计</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
      
      <div className="p-4 border-t border-border/50 bg-app-bg text-center">
         <span className="font-mono text-[10px] text-text3/60 tracking-widest uppercase">Target Mix Design</span>
      </div>
    </aside>
    )}

    <aside className="w-[176px] bg-app-bg/80 border-r border-border shrink-0 flex flex-col">
      <div className="px-3 py-3 border-b border-border/50">
        <div className="font-mono text-[9px] font-bold tracking-[2px] text-text3 uppercase">Workflow</div>
        <div className="mt-1 truncate text-[11px] font-bold text-text1" title={activeDesign.name}>{activeDesign.name}</div>
        <div className="mt-0.5 truncate font-mono text-[8px] text-text3" title={activeProject.name}>{activeProject.projectCode || activeProject.name}</div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
        <div className="space-y-0.5">
          {STEPS.map((s, i) => renderStep(s, i))}
        </div>
      </nav>
      <div className="border-t border-border/50 bg-surface/40 p-2">
        <div className="rounded-sm border border-border/70 bg-app-bg/55 px-2 py-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-amber text-[9px] font-bold text-black font-mono">
              {activeStepMeta.num}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[10px] font-bold text-text1">{activeStepMeta.name}</div>
              <div className={cn("mt-0.5 font-mono text-[8px]", statusTextClass(activeFlow?.status ?? 'idle'))}>
                {statusLabel(activeFlow?.status ?? 'idle')}
                {activeFlow?.warningCount ? ` · ${activeFlow.warningCount} 项` : ''}
              </div>
            </div>
          </div>
          {activeFlow?.reasons[0] ? (
            <div className="mt-2 line-clamp-2 border-t border-border/50 pt-1.5 text-[9px] leading-snug text-text3">
              {activeFlow.reasons[0]}
            </div>
          ) : null}
        </div>
        <button
          onClick={() => setStep(0)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-sm border border-border px-2 py-1.5 font-mono text-[9px] text-text3 hover:border-border2 hover:bg-surface2 hover:text-text1"
        >
          <FileText className="h-3.5 w-3.5" />
          设计台账
        </button>
      </div>
    </aside>
    </div>
  );

  function renderStep(s: typeof STEPS[number], i: number) {
    const active = step === i;
    const flow = workflowStatus[i];
    const status = flow?.status ?? 'idle';
    return (
      <button
        key={s.num}
        onClick={() => setStep(i)}
        title={flow?.reasons.length ? `${s.name} · ${s.eng}\n${flow.reasons.join('\n')}` : `${s.name} · ${s.eng} · ${statusLabel(status)}`}
        className={cn(
          "group grid w-full grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-1.5 rounded-sm border px-1.5 py-1.5 text-left transition-all outline-none",
          active ? "border-amber/25 bg-amber/10" : "border-transparent hover:border-border/60 hover:bg-surface2/70",
          status === 'blocked' && !active && "border-red/10",
          status === 'warning' && !active && "border-yellow/10"
        )}
      >
        <div className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border",
          active ? "border-amber bg-amber text-black" : statusClass(status)
        )}>
          {active ? <span className="font-mono text-[9px] font-bold">{s.num}</span> : <StatusIcon status={status} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn("truncate text-[10px] font-bold leading-tight", active ? "text-amber" : "text-text2 group-hover:text-text1")}>{shortStepName(s.name)}</div>
          <div className={cn("mt-0.5 truncate font-mono text-[8px] uppercase tracking-wide", active ? statusTextClass(status) : "text-text3")}>
            {statusLabel(status)}
          </div>
        </div>
        {flow?.warningCount ? (
          <span className={cn("min-w-4 h-5 px-1 rounded-sm border text-[9px] font-mono flex items-center justify-center", status === 'blocked' ? "border-red/30 text-red bg-red/5" : "border-yellow/30 text-yellow bg-yellow/5")}>
            {flow.warningCount}
          </span>
        ) : (
          <span className={cn("h-1.5 w-1.5 rounded-full", statusDotClass(status))} aria-hidden="true" />
        )}
      </button>
    );
  }
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'passed') return <Check className="w-3.5 h-3.5" strokeWidth={3} />;
  if (status === 'warning') return <AlertTriangle className="w-3.5 h-3.5" />;
  if (status === 'blocked') return <Ban className="w-3.5 h-3.5" />;
  if (status === 'editing') return <PencilLine className="w-3.5 h-3.5" />;
  return <Circle className="w-3 h-3" />;
}

function statusClass(status: StepStatus) {
  if (status === 'passed') return "bg-green/10 text-green border-green/30";
  if (status === 'warning') return "bg-yellow/10 text-yellow border-yellow/30";
  if (status === 'blocked') return "bg-red/10 text-red border-red/30";
  if (status === 'editing') return "bg-blue/10 text-blue border-blue/30";
  return "bg-surface3 text-text3 font-medium border-border/50 group-hover:border-border group-hover:text-text2";
}

function statusTextClass(status: StepStatus) {
  if (status === 'passed') return "text-green";
  if (status === 'warning') return "text-yellow";
  if (status === 'blocked') return "text-red";
  if (status === 'editing') return "text-blue";
  return "text-text3";
}

function statusDotClass(status: StepStatus) {
  if (status === 'passed') return "bg-green";
  if (status === 'warning') return "bg-yellow";
  if (status === 'blocked') return "bg-red";
  if (status === 'editing') return "bg-blue";
  return "bg-text3/50";
}

function shortStepName(name: string) {
  return name
    .replace('基本参数设置', '基本参数')
    .replace('马歇尔原始记录', '马歇尔记录')
    .replace('性能验证台账', '性能验证')
    .replace('报告归档与问题台账', '报告归档')
    .replace('应用内知识库', '知识库');
}

function statusLabel(status: StepStatus) {
  if (status === 'passed') return '已通过';
  if (status === 'warning') return '有警告';
  if (status === 'blocked') return '阻塞';
  if (status === 'editing') return '录入中';
  return '未开始';
}
