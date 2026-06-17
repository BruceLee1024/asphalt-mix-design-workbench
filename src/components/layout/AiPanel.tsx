import React, { useState, useEffect, useRef } from 'react';
import { ClipboardCheck, Send, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useMixDesign } from '../../store/MixDesignContext';
import type { AiMessage } from '../../types';

export function AiPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { oacResult, basicInfo, inputAudit, workflowStatus, gradingWarnings, reviewIssues, projectReadiness, performanceConclusion } = useMixDesign();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: buildReviewMemo({ basicInfo, oacResult, inputAudit, workflowStatus, gradingWarnings, reviewIssues, projectReadiness, performanceConclusion })
      }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (msgEndRef.current) {
      msgEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    const text = inputVal.trim();
    if (!text) return;
    
    setInputVal('');
    setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'loading', content: '分析中...' }]);

    await new Promise(resolve => setTimeout(resolve, 800));

    const reply = buildReviewMemo({ basicInfo, oacResult, inputAudit, workflowStatus, gradingWarnings, reviewIssues, projectReadiness, performanceConclusion, prompt: text });

    setMessages(prev => {
      const next = [...prev];
      next.pop(); // remove loading
      next.push({ role: 'assistant', content: reply });
      return next;
    });
  };

  return (
    <>
      <div 
        className={cn("fixed inset-0 z-[99] bg-black/40 transition-opacity duration-300", isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}
        onClick={onClose}
      />
      <aside 
        className={cn(
          "fixed right-0 top-0 bottom-0 w-full sm:w-[380px] z-[100] bg-surface border-l border-border flex flex-col shadow-[-8px_0_40px_rgba(0,0,0,0.6)] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] transition-transform",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between">
          <div className="font-mono text-[13px] font-bold text-purple flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 opacity-80" /> 配合比审查备注
          </div>
          <button onClick={onClose} className="p-1 rounded-sm text-text2 hover:text-text1 hover:bg-surface2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={cn(
                "p-3 rounded-sm text-[13px] leading-relaxed font-sans animate-in fade-in slide-in-from-bottom-2 whitespace-pre-wrap",
                msg.role === 'user' && "bg-surface3 border border-border text-text1 self-end max-w-[85%]",
                msg.role === 'assistant' && "bg-[rgba(155,127,255,0.08)] border border-[rgba(155,127,255,0.2)] text-text1",
                msg.role === 'loading' && "bg-surface2 border border-border text-text3 flex items-center gap-2"
              )}
            >
              {msg.role === 'loading' && <span className="w-3 h-3 border-2 border-text3 border-t-purple rounded-full animate-spin" />}
              {msg.content}
            </div>
          ))}
          <div ref={msgEndRef} />
        </div>

        <div className="p-4 border-t border-border flex gap-2 bg-surface">
          <textarea 
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="询问关于配合比设计的问题…"
            className="flex-1 bg-app-bg border border-border rounded-sm text-text1 font-sans text-[13px] p-2.5 resize-none h-16 outline-none transition-colors focus:border-purple focus:ring-1 focus:ring-purple/30"
          />
          <button 
            onClick={handleSend}
            className="bg-purple text-white border-none rounded-sm px-3.5 cursor-pointer font-mono text-xs transition-colors hover:bg-purple/90 flex flex-col items-center justify-center gap-1 w-16"
          >
            <Send className="w-4 h-4" />
            发送
          </button>
        </div>
      </aside>
    </>
  );
}

function buildReviewMemo({
  basicInfo,
  oacResult,
  inputAudit,
  workflowStatus,
  gradingWarnings,
  reviewIssues,
  projectReadiness,
  performanceConclusion,
  prompt,
}: {
  basicInfo: ReturnType<typeof useMixDesign>['basicInfo'];
  oacResult: ReturnType<typeof useMixDesign>['oacResult'];
  inputAudit: ReturnType<typeof useMixDesign>['inputAudit'];
  workflowStatus: ReturnType<typeof useMixDesign>['workflowStatus'];
  gradingWarnings: string[];
  reviewIssues: ReturnType<typeof useMixDesign>['reviewIssues'];
  projectReadiness: ReturnType<typeof useMixDesign>['projectReadiness'];
  performanceConclusion: ReturnType<typeof useMixDesign>['performanceConclusion'];
  prompt?: string;
}) {
  const blockers = workflowStatus.filter(step => step.status === 'blocked');
  const warnings = [
    ...inputAudit.materialWarnings,
    ...gradingWarnings,
    ...inputAudit.marshallWarnings,
    ...inputAudit.oacWarnings,
  ];
  const lines = [
    prompt ? `复核请求：${prompt}` : `当前项目：${basicInfo.projName}`,
    `混合料类型：${basicInfo.mixType}`,
    `报告结论状态：${projectReadiness.statusText}`,
    `性能验证：${performanceConclusion}`,
  ];

  if (oacResult) {
    lines.push(`OAC：${oacResult.oac.toFixed(2)}%，MS：${oacResult.ms.toFixed(1)}kN，VV：${oacResult.vv.toFixed(1)}%，VMA：${oacResult.vma.toFixed(1)}%，VFA：${oacResult.vfa.toFixed(1)}%。`);
  } else {
    lines.push('OAC：尚未形成可出具结果。');
  }

  if (blockers.length) {
    lines.push(`阻塞项：${blockers.map(step => step.label).join('、')}。`);
  }
  if (warnings.length) {
    lines.push('需复核事项：');
    warnings.slice(0, 6).forEach((warning, index) => lines.push(`${index + 1}. ${warning}`));
  } else {
    lines.push('当前未发现材料、级配、马歇尔和 OAC 审查警告。');
  }

  if (reviewIssues.length) {
    lines.push('问题台账：');
    reviewIssues.slice(0, 6).forEach((issue, index) => lines.push(`${index + 1}. [${issue.level === 'blocking' ? '阻塞' : '警告'}] ${issue.source} - ${issue.title}：${issue.action}`));
  }

  lines.push(projectReadiness.canFreeze ? '建议：可冻结报告；若性能验证仍为待补充，应在结论中明确“目标配合比完成，性能验证待补充”。' : '建议：先关闭阻塞项，再冻结正式报告。');
  return lines.join('\n');
}
