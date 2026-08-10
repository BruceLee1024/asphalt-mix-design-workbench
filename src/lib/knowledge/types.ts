import type { MixType, DesignMethod, MaterialSystem } from '../../types';

export type KnowledgeSeverity = 'info' | 'warning' | 'blocking';

export interface KnowledgeRecord {
  id: string;
  label: string;
  source: string;
  sourceVersion: string;
  applicableMixTypes: MixType[] | 'all';
  applicableMethods: DesignMethod[] | 'all';
  condition: string;
  value?: number | string;
  range?: { lo: number; hi: number | null };
  unit?: string;
  severity: KnowledgeSeverity;
  message: string;
}

export interface GradationKnowledgeRecord extends KnowledgeRecord {
  sieves: readonly number[];
  lo: readonly number[];
  hi: readonly number[];
}

export interface MarshallSpecKnowledgeRecord extends KnowledgeRecord {
  roadGrade: string;
  ms: { lo: number; hi: number | null };
  fl: { lo: number; hi: number | null };
  vv: { lo: number; hi: number | null };
  vma: { lo: number; hi: number | null };
  vfa: { lo: number; hi: number | null };
}

export interface PerformanceKnowledgeRecord extends KnowledgeRecord {
  key: string;
  materialSystems: MaterialSystem[] | 'all';
  comparator: 'gte' | 'lte';
}

export interface ConstructionKnowledgeRecord extends KnowledgeRecord {
  key: string;
  materialSystems: MaterialSystem[] | 'all';
}
