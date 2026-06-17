import React from 'react';
import { cn } from '../../lib/utils';
import { useMixDesign } from '../../store/MixDesignContext';
import { AlertTriangle, Ban, Check, Circle, PencilLine } from 'lucide-react';
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
];

export function Sidebar() {
  const { step, setStep, workflowStatus } = useMixDesign();

  return (
    <aside className="w-[260px] bg-surface/50 border-r border-border shrink-0 flex flex-col print:hidden">
      <div className="px-5 py-5 border-b border-border/50">
        <span className="font-mono text-[10px] font-bold tracking-[3px] text-text3 uppercase">Design Workflow</span>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 custom-scrollbar">
        {STEPS.map((s, i) => {
          const active = step === i;
          const flow = workflowStatus[i];
          const status = flow?.status ?? 'idle';
          return (
            <button
              key={s.num}
              onClick={() => setStep(i)}
              title={flow?.reasons.length ? flow.reasons.join('\n') : `${s.name} · ${statusLabel(status)}`}
              className={cn(
                "group flex items-start gap-3.5 w-full text-left px-3.5 py-3.5 rounded-lg transition-all border outline-none",
                active ? "bg-amber/10 border-amber/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" : "border-transparent hover:bg-surface hover:border-border/60",
                status === 'blocked' && !active && "border-red/10",
                status === 'warning' && !active && "border-yellow/10"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-sm flex items-center justify-center shrink-0 border transition-all duration-300",
                active ? "bg-amber text-black font-bold border-amber shadow-[0_0_12px_rgba(245,166,35,0.4)]"
                       : statusClass(status)
              )}>
                {active ? <span className="font-mono text-[11px]">{s.num}</span> : <StatusIcon status={status} />}
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className={cn(
                  "font-sans text-[13px] tracking-wide transition-colors duration-200",
                  active ? "text-amber font-bold" : "text-text2 group-hover:text-text1"
                )}>
                  {s.name}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "font-mono text-[9px] uppercase tracking-wider transition-colors duration-200",
                    active ? "text-amber/70" : "text-text3 group-hover:text-text3/80"
                  )}>
                    {s.eng}
                  </span>
                  <span className={cn("font-mono text-[9px]", statusTextClass(status))}>{statusLabel(status)}</span>
                </div>
                {flow?.reasons[0] && (
                  <span className="mt-1 text-[10px] text-text3 leading-snug line-clamp-2">{flow.reasons[0]}</span>
                )}
              </div>
              {flow?.warningCount ? (
                <span className={cn("ml-auto min-w-5 h-5 px-1 rounded-sm border text-[10px] font-mono flex items-center justify-center", status === 'blocked' ? "border-red/30 text-red bg-red/5" : "border-yellow/30 text-yellow bg-yellow/5")}>
                  {flow.warningCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border/50 bg-app-bg text-center">
         <span className="font-mono text-[10px] text-text3/60 tracking-widest uppercase">Target Mix Design</span>
      </div>
    </aside>
  );
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'passed') return <Check className="w-4 h-4" strokeWidth={3} />;
  if (status === 'warning') return <AlertTriangle className="w-4 h-4" />;
  if (status === 'blocked') return <Ban className="w-4 h-4" />;
  if (status === 'editing') return <PencilLine className="w-4 h-4" />;
  return <Circle className="w-3.5 h-3.5" />;
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

function statusLabel(status: StepStatus) {
  if (status === 'passed') return '已通过';
  if (status === 'warning') return '有警告';
  if (status === 'blocked') return '阻塞';
  if (status === 'editing') return '录入中';
  return '未开始';
}
