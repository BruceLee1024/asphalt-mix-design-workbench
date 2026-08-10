import React from 'react';
import { BookOpen, CheckCircle2, ChevronDown, Info, RotateCcw, Search } from 'lucide-react';
import { Button, Card, Input, SLabel } from '../ui';
import { useMixDesign } from '../../store/MixDesignContext';
import { ALL_KNOWLEDGE_RECORDS, formatRequirement, KNOWLEDGE_VERSION } from '../../lib/knowledge';
import type { GradationKnowledgeRecord, KnowledgeRecord, MarshallSpecKnowledgeRecord, PerformanceKnowledgeRecord } from '../../lib/knowledge/types';
import { cn } from '../../lib/utils';

const CATEGORY_LABELS = [
  { key: 'all', label: '全部' },
  { key: 'std', label: '基础规范' },
  { key: 'term', label: '术语公式' },
  { key: 'mat', label: '材料指标' },
  { key: 'gradation', label: '级配范围' },
  { key: 'marshall', label: '马歇尔指标' },
  { key: 'perf', label: '性能阈值' },
  { key: 'const', label: '施工工艺' },
] as const;

type CategoryKey = typeof CATEGORY_LABELS[number]['key'];
type ScopeKey = 'matched' | 'all';

export function KnowledgeStep() {
  const { basicInfo, applicableKnowledge, constructionGuidance, knowledgeVersion } = useMixDesign();
  const [category, setCategory] = React.useState<CategoryKey>('all');
  const [scope, setScope] = React.useState<ScopeKey>('matched');
  const [query, setQuery] = React.useState('');

  const matchedRecords = uniqueById([...applicableKnowledge, ...constructionGuidance]);
  const matchedIds = new Set(matchedRecords.map(record => record.id));
  const sourceRecords = scope === 'matched' ? matchedRecords : ALL_KNOWLEDGE_RECORDS;
  const categoryCounts = CATEGORY_LABELS.reduce<Record<CategoryKey, number>>((acc, item) => {
    acc[item.key] = item.key === 'all' ? sourceRecords.length : sourceRecords.filter(record => record.id.startsWith(item.key)).length;
    return acc;
  }, {} as Record<CategoryKey, number>);
  const records = filterRecords(sourceRecords, category, query);
  const hardRules = matchedRecords.filter(record => record.severity === 'blocking').length;
  const warningRules = matchedRecords.filter(record => record.severity === 'warning').length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <SLabel>应用内知识库</SLabel>

      <Card title="知识库概览">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <SummaryTile label="版本" value={knowledgeVersion || KNOWLEDGE_VERSION} />
          <SummaryTile label="混合料" value={basicInfo.mixType} />
          <SummaryTile label="匹配依据" value={`${matchedRecords.length} 条`} />
          <SummaryTile label="硬性依据" value={`${hardRules} 条`} tone={hardRules ? 'bad' : 'default'} />
          <SummaryTile label="提示依据" value={`${warningRules} 条`} tone={warningRules ? 'warn' : 'default'} />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 border-t border-border pt-4 font-mono text-[11px]">
          <ContextItem label="工程类型" value={basicInfo.projectDomain === 'airport' ? '机场道面' : '公路工程'} />
          <ContextItem label="设计方法" value={basicInfo.designMethod} />
          <ContextItem label="材料体系" value={basicInfo.materialSystem} />
          <ContextItem label="交通等级" value={`${basicInfo.trafficLevel} / ESALs ${basicInfo.esals || '-'}`} />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-4">
        <Card title="筛选" className="xl:sticky xl:top-20 xl:self-start">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setScope('matched')}
              className={cn("rounded-sm border px-3 py-2 font-mono text-[11px]", scope === 'matched' ? "border-amber/40 bg-amber/10 text-amber" : "border-border text-text2 hover:text-text1")}
            >
              当前适用
            </button>
            <button
              onClick={() => setScope('all')}
              className={cn("rounded-sm border px-3 py-2 font-mono text-[11px]", scope === 'all' ? "border-amber/40 bg-amber/10 text-amber" : "border-border text-text2 hover:text-text1")}
            >
              全部内置
            </button>
          </div>
          <div className="mt-4 space-y-1.5">
            {CATEGORY_LABELS.map(item => (
              <button
                key={item.key}
                onClick={() => setCategory(item.key)}
                className={cn(
                  "flex w-full items-center justify-between rounded-sm border px-3 py-2 text-left font-mono text-[11px] transition-colors",
                  category === item.key ? "border-amber/40 bg-amber/10 text-amber" : "border-transparent text-text2 hover:border-border hover:bg-app-bg hover:text-text1"
                )}
              >
                <span>{item.label}</span>
                <span className={cn("rounded-sm border px-1.5 py-0.5 text-[10px]", category === item.key ? "border-amber/30" : "border-border text-text3")}>
                  {categoryCounts[item.key]}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card
          title={scope === 'matched' ? '当前项目适用依据' : '全部内置知识条目'}
          headerRight={
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-text3">{records.length} 条</span>
              <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setCategory('all'); }}>
                <RotateCcw className="w-3.5 h-3.5" /> 重置
              </Button>
            </div>
          }
        >
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
            <Input className="w-full pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索规范、术语、材料、性能或施工建议" />
          </div>

          {records.length ? (
            <div className="overflow-hidden rounded-sm border border-border">
              {records.map(record => (
                <React.Fragment key={record.id}>
                  <KnowledgeRow record={record} matched={matchedIds.has(record.id)} />
                </React.Fragment>
              ))}
            </div>
          ) : (
            <EmptyState text="没有找到符合条件的知识库条目。" />
          )}
        </Card>
      </div>
    </div>
  );
}

function KnowledgeRow({ record, matched }: { record: KnowledgeRecord; matched: boolean }) {
  const [open, setOpen] = React.useState(false);

  return (
    <article className="border-b border-border2/60 bg-app-bg last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-3 text-left hover:bg-surface2/60"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-text3">{categoryLabel(record.id)}</span>
            <SeverityBadge severity={record.severity} />
            {matched && <span className="rounded-sm border border-amber/30 bg-amber/10 px-2 py-0.5 font-mono text-[10px] text-amber">当前适用</span>}
          </div>
          <div className="mt-1 text-[14px] font-bold leading-snug text-text1">{record.label}</div>
          <div className="mt-1 line-clamp-1 text-[12px] leading-relaxed text-text3">{record.message}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden min-w-[150px] text-right font-mono text-[11px] text-text3 md:block">{formatRequirement(record)}</div>
          <ChevronDown className={cn("w-4 h-4 text-text3 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="border-t border-border2/60 px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
            <div>
              <p className="text-[13px] leading-relaxed text-text2">{record.message}</p>
              <div className="mt-3 flex items-start gap-2 rounded-sm border border-border/60 bg-surface2 px-3 py-2 text-[11px] leading-relaxed text-text3">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green" />
                {record.condition}
              </div>
              <StructuredRecordView record={record} />
            </div>
            <div className="grid grid-cols-1 gap-2 font-mono text-[11px]">
              <Meta label="依据" value={`${record.source} ${record.sourceVersion}`} />
              <Meta label="要求" value={formatRequirement(record)} />
              <Meta label="适用类型" value={Array.isArray(record.applicableMixTypes) ? record.applicableMixTypes.join(', ') : '全部'} />
              <Meta label="适用方法" value={Array.isArray(record.applicableMethods) ? record.applicableMethods.join(', ') : '全部'} />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function SeverityBadge({ severity }: { severity: KnowledgeRecord['severity'] }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[10px]",
      severity === 'blocking' ? "border-red/30 bg-red/5 text-red" : severity === 'warning' ? "border-yellow/30 bg-yellow/5 text-yellow" : "border-green/30 bg-green/5 text-green"
    )}>
      {severity === 'info' ? <Info className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
      {severity === 'blocking' ? '硬性' : severity === 'warning' ? '提示' : '参考'}
    </span>
  );
}

function SummaryTile({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'warn' | 'bad' }) {
  return (
    <div className={cn("rounded-sm border bg-app-bg px-4 py-3", tone === 'warn' ? "border-yellow/25" : tone === 'bad' ? "border-red/25" : "border-border")}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-text3">{label}</div>
      <div className={cn("mt-1 font-mono text-[15px] font-bold", tone === 'warn' ? "text-yellow" : tone === 'bad' ? "text-red" : "text-text1")}>{value}</div>
    </div>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-text3">{label}</div>
      <div className="mt-1 text-text1">{value}</div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border/60 bg-surface2 px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-text3">{label}</div>
      <div className="mt-1 leading-snug text-text1">{value || '-'}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-sm border border-border bg-app-bg px-4 py-8 text-center font-mono text-[12px] text-text3">{text}</div>;
}

function StructuredRecordView({ record }: { record: KnowledgeRecord }) {
  if (isGradationRecord(record)) {
    return (
      <div className="mt-3 overflow-x-auto rounded-sm border border-border/70">
        <table className="w-full border-collapse font-mono text-[10px]">
          <tbody>
            <TableRow label="筛孔(mm)" values={record.sieves.map(String)} />
            <TableRow label="下限(%)" values={record.lo.map(String)} />
            <TableRow label="上限(%)" values={record.hi.map(String)} />
          </tbody>
        </table>
      </div>
    );
  }
  if (isMarshallRecord(record)) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        <MiniSpec label="MS" value={formatRange(record.ms)} />
        <MiniSpec label="FL" value={formatRange(record.fl)} />
        <MiniSpec label="VV" value={formatRange(record.vv)} />
        <MiniSpec label="VMA" value={formatRange(record.vma)} />
        <MiniSpec label="VFA" value={formatRange(record.vfa)} />
      </div>
    );
  }
  if (isPerformanceRecord(record)) {
    return (
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <MiniSpec label="指标键" value={record.key} />
        <MiniSpec label="判定方向" value={record.comparator === 'gte' ? '不小于' : '不大于'} />
        <MiniSpec label="材料体系" value={Array.isArray(record.materialSystems) ? record.materialSystems.join(', ') : '全部'} />
      </div>
    );
  }
  return null;
}

function TableRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <td className="sticky left-0 whitespace-nowrap border-b border-border2/50 bg-surface2 px-2 py-2 text-text3">{label}</td>
      {values.map((value, index) => (
        <td key={`${label}-${index}`} className="whitespace-nowrap border-b border-border2/50 px-2 py-2 text-center text-text1">{value}</td>
      ))}
    </tr>
  );
}

function MiniSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border/60 bg-surface2 px-3 py-2 font-mono">
      <div className="text-[9px] uppercase tracking-widest text-text3">{label}</div>
      <div className="mt-1 text-[11px] text-text1">{value}</div>
    </div>
  );
}

function filterRecords(records: KnowledgeRecord[], category: CategoryKey, query: string) {
  const q = query.trim().toLowerCase();
  return records.filter(record => {
    const categoryOk = category === 'all' || record.id.startsWith(category);
    if (!categoryOk) return false;
    if (!q) return true;
    return [record.id, record.label, record.source, record.condition, record.message].join(' ').toLowerCase().includes(q);
  });
}

function uniqueById(records: KnowledgeRecord[]) {
  return records.filter((record, index, all) => all.findIndex(item => item.id === record.id) === index);
}

function categoryLabel(id: string) {
  if (id.startsWith('std')) return '基础规范';
  if (id.startsWith('term')) return '术语公式';
  if (id.startsWith('mat')) return '材料指标';
  if (id.startsWith('gradation')) return '级配范围';
  if (id.startsWith('marshall')) return '马歇尔指标';
  if (id.startsWith('perf')) return '性能阈值';
  if (id.startsWith('const')) return '施工工艺';
  return '知识条目';
}

function formatRange(range: { lo: number; hi: number | null }) {
  return range.hi === null ? `>= ${range.lo}` : `${range.lo}~${range.hi}`;
}

function isGradationRecord(record: KnowledgeRecord): record is GradationKnowledgeRecord {
  return 'sieves' in record && Array.isArray((record as GradationKnowledgeRecord).sieves);
}

function isMarshallRecord(record: KnowledgeRecord): record is MarshallSpecKnowledgeRecord {
  return 'roadGrade' in record && 'ms' in record;
}

function isPerformanceRecord(record: KnowledgeRecord): record is PerformanceKnowledgeRecord {
  return 'comparator' in record && 'key' in record;
}
