import React, { useState } from 'react';
import { MixDesignProvider, useMixDesign } from './store/MixDesignContext';
import { TopNav } from './components/layout/TopNav';
import { Sidebar } from './components/layout/Sidebar';
import { WorkspaceHeader } from './components/layout/WorkspaceHeader';
import { AiPanel } from './components/layout/AiPanel';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

import { ProjectLedgerStep } from './components/steps/ProjectLedgerStep';
import { BasicInfoStep } from './components/steps/BasicInfoStep';
import { MaterialsStep } from './components/steps/MaterialsStep';
import { GradingStep } from './components/steps/GradingStep';
import { MarshallStep } from './components/steps/MarshallStep';
import { ResultsStep } from './components/steps/ResultsStep';
import { VerificationStep } from './components/steps/VerificationStep';
import { ReportStep } from './components/steps/ReportStep';

function MainContent() {
  const { step, setStep, standardProfile } = useMixDesign();
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col bg-app-bg text-text1 overflow-hidden font-sans relative">
      <TopNav onExport={() => setStep(7)} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        
        <main className="flex-[1] flex flex-col min-w-0 relative z-0">
          <WorkspaceHeader />
          
          <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10 custom-scrollbar relative print:p-0 print:overflow-visible">
            <div className="w-full">
              <StepPanel active={step === 0}>
                <ProjectLedgerStep />
              </StepPanel>
              <StepPanel active={step === 1}>
                <BasicInfoStep />
              </StepPanel>
              <StepPanel active={step === 2}>
                <MaterialsStep />
              </StepPanel>
              <StepPanel active={step === 3}>
                <GradingStep />
              </StepPanel>
              <StepPanel active={step === 4}>
                <MarshallStep />
              </StepPanel>
              <StepPanel active={step === 5}>
                <ResultsStep />
              </StepPanel>
              <StepPanel active={step === 6}>
                <VerificationStep />
              </StepPanel>
              <div style={{ display: step === 7 ? 'block' : 'none' }} className="print:block">
                <ReportStep onOpenAi={() => setAiOpen(true)} />
              </div>
            </div>
            
            <footer className="mt-20 pt-6 border-t border-border font-mono text-[11px] text-text3 text-left print:hidden w-full">
              依据 {standardProfile.designSpec} · {standardProfile.testSpec} &nbsp;|&nbsp; 纯前端目标配合比工作台
            </footer>
          </div>
        </main>
      </div>

      {/* Floating AI Button */}
      {!aiOpen && (
        <motion.button
          onClick={() => setAiOpen(true)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple hover:bg-purple/90 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(155,127,255,0.4)] z-[40] transition-colors print:hidden group"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute right-full mr-4 bg-surface border border-border text-text1 text-[11px] font-mono px-2 py-1 rounded-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            智能助手
          </span>
        </motion.button>
      )}

      <AiPanel isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}

function StepPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: active ? 'block' : 'none' }} className="print:hidden">
      {children}
    </div>
  );
}

export default function App() {
  return (
    <MixDesignProvider>
      <MainContent />
    </MixDesignProvider>
  );
}
