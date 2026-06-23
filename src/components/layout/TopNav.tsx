import React, { useRef } from 'react';
import { ArrowUpRight, Beaker, BookOpen, Download, RotateCcw, Upload } from 'lucide-react';
import { Button } from '../ui';
import { useMixDesign } from '../../store/MixDesignContext';

export function TopNav({ onExport, onKnowledge }: { onOpenAi?: () => void; onExport: () => void; onKnowledge: () => void }) {
  const { exportJson, importJson, resetProject } = useMixDesign();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    const blob = new Blob([exportJson()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'asphalt-mix-design.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    importJson(await file.text());
  };

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 shrink-0 z-20 sticky top-0 print:hidden mt-[10px]">
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-md shrink-0 bg-gradient-to-br from-amber-dim to-amber flex items-center justify-center text-black">
          <Beaker className="w-5 h-5" />
        </div>
        <div className="flex flex-col justify-center">
          <span className="font-mono font-bold text-[15px] text-text1 leading-none tracking-tight">AC·MIX</span>
          <span className="font-sans text-[11px] text-text3 leading-none uppercase tracking-wider mt-1.5">Asphalt Mix Design Workbench</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={e => handleImport(e.target.files?.[0])} />
        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="h-9 px-3">
          <Upload className="w-4 h-4" /> 导入
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExportJson} className="h-9 px-3">
          <Download className="w-4 h-4" /> JSON
        </Button>
        <Button variant="ghost" size="sm" onClick={resetProject} className="h-9 px-3">
          <RotateCcw className="w-4 h-4" /> 新建
        </Button>
        <Button variant="ghost" size="sm" onClick={onKnowledge} className="h-9 px-3">
          <BookOpen className="w-4 h-4" /> 知识库
        </Button>
        <Button variant="ghost" size="sm" onClick={onExport} className="h-9 px-4">
          <ArrowUpRight className="w-4 h-4" /> 导出报告
        </Button>
      </div>
    </header>
  );
}
