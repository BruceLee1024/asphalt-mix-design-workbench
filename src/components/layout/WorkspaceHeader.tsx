import React from 'react';
import { useMixDesign } from '../../store/MixDesignContext';
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileWarning, Network, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export function WorkspaceHeader() {
  const { oacResult, basicInfo, step, standardProfile, workflowStatus, projectReadiness, reportVersion } = useMixDesign();
  const totalSteps = 9;
  const progressPercent = ((step + 1) / totalSteps) * 100;
  const activeFlow = workflowStatus[step];
  const gradationStatus = workflowStatus[2]?.status ?? 'idle';
  const oacStatus = workflowStatus[4]?.status ?? 'idle';

  return (
    <div className="bg-surface/30 border-b border-border shrink-0 px-3 py-3 sm:px-8 sm:py-4 print:hidden relative overflow-hidden backdrop-blur-sm z-10">
      {/* Subtle Background Pattern */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden opacity-5 pointer-events-none flex items-center justify-end pr-10">
        <Network className="w-32 h-32 text-amber" strokeWidth={0.5} />
      </div>
      
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-start gap-5 overflow-x-auto custom-scrollbar pb-1">
          <div className="min-w-[210px] sm:min-w-[260px] shrink-0">
            <div className="text-[10px] text-text3 font-mono tracking-widest uppercase">Project Ledger</div>
            <div className="mt-1 text-[16px] text-text1 font-bold truncate">{basicInfo.projName || '未命名项目'}</div>
            <div className="mt-1 text-[11px] text-text3 font-mono truncate">{basicInfo.projUnit || '未填写编制单位'} · {standardProfile.label}</div>
          </div>
          <StatusPill label="当前阶段" value={activeFlow?.label ?? '未知'} status={activeFlow?.status ?? 'idle'} />
          <StatusPill label="级配状态" value={statusLabel(gradationStatus)} status={gradationStatus} />
          <StatusPill label="OAC 状态" value={oacResult ? `${oacResult.oac.toFixed(2)}%` : statusLabel(oacStatus)} status={oacStatus} />
          <StatusPill label="报告状态" value={reportVersion.status === 'frozen' ? `已冻结 ${reportVersion.version}` : projectReadiness.statusText} status={projectReadiness.canFreeze ? (reportVersion.status === 'frozen' ? 'passed' : 'warning') : 'blocked'} />
          <Stat label="混合料类型" value={basicInfo.mixType} unit="" />
          <Stat label="气候分区" value={basicInfo.climate.split('（')[0]} unit="" />
        
          <div className="ml-auto self-center shrink-0 flex flex-col items-end gap-1.5 h-full pt-1">
            <div className="text-[10px] text-text3 font-mono tracking-widest uppercase">
              STEP {step + 1} OF {totalSteps}
            </div>
            <div className="font-mono text-[11px] text-amber tracking-widest uppercase">
              {step === 0 && 'Project Ledger'}
              {step === 1 && 'Basic Info'}
              {step === 2 && 'Materials'}
              {step === 3 && 'Grading'}
              {step === 4 && 'Marshall'}
              {step === 5 && 'Analysis'}
              {step === 6 && 'Verification'}
              {step === 7 && 'Report'}
              {step === 8 && 'Knowledge'}
            </div>
          </div>
        </div>

        {activeFlow?.reasons.length ? (
          <div className="flex items-start gap-2 rounded-sm border border-yellow/20 bg-yellow/5 px-3 py-2 text-[12px] text-yellow font-mono">
            <FileWarning className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{activeFlow.reasons[0]}{activeFlow.reasons.length > 1 ? ` 另有 ${activeFlow.reasons.length - 1} 项待处理。` : ''}</span>
          </div>
        ) : null}
      </div>

      {/* Progress Bar Line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/50">
        <motion.div 
          className="h-full bg-amber shadow-[0_0_8px_rgba(245,166,35,0.8)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1 shrink-0">
      <div className="text-[10px] text-text3 font-mono tracking-widest uppercase">{label}</div>
      <div className="font-mono text-[22px] font-bold text-text1 flex items-baseline gap-1.5 min-w-[60px]">
        <span className={highlight ? "text-amber" : ""}>{value}</span>
        {unit && <span className="text-text3 text-[12px] font-normal tracking-tight">{unit}</span>}
      </div>
    </div>
  );
}

function StatusPill({ label, value, status }: { label: string; value: string; status: 'idle' | 'editing' | 'warning' | 'passed' | 'blocked' }) {
  const Icon = status === 'passed' ? CheckCircle2 : status === 'warning' ? AlertTriangle : status === 'blocked' ? ShieldAlert : ClipboardCheck;
  return (
    <div className={cn(
      "min-w-[128px] shrink-0 rounded-sm border px-3 py-2 bg-app-bg/70",
      status === 'passed' && "border-green/25",
      status === 'warning' && "border-yellow/25",
      status === 'blocked' && "border-red/25",
      (status === 'idle' || status === 'editing') && "border-border"
    )}>
      <div className="flex items-center gap-1.5 text-[10px] text-text3 font-mono tracking-widest uppercase">
        <Icon className={cn(
          "w-3.5 h-3.5",
          status === 'passed' && "text-green",
          status === 'warning' && "text-yellow",
          status === 'blocked' && "text-red",
          (status === 'idle' || status === 'editing') && "text-text3"
        )} />
        {label}
      </div>
      <div className="mt-1 font-mono text-[14px] font-bold text-text1 truncate">{value}</div>
    </div>
  );
}

function statusLabel(status: 'idle' | 'editing' | 'warning' | 'passed' | 'blocked') {
  if (status === 'passed') return '已通过';
  if (status === 'warning') return '有警告';
  if (status === 'blocked') return '阻塞';
  if (status === 'editing') return '录入中';
  return '未开始';
}
