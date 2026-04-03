/**
 * MUKI - Long-term memory system types
 */

export interface Memory {
  id?: number;
  content: string;
  embedding: Float32Array;
  importance: number;
  created_at: number;
  expires_at?: number;
  metadata?: Record<string, any>;
}

export interface MemorySearchOptions {
  query: string;
  limit?: number;
  minImportance?: number;
  tags?: string[];
}

export interface MemorySearchResult {
  memory: Memory;
  similarity: number;
  score: number; // Reranked with importance
}

export interface GCConfig {
  importanceDecayPerMonth: number;
  ttlHighImportance: number | null; // null = indefinite
  ttlMediumImportance: number;
  ttlLowImportance: number;
  highThreshold: number;
  lowThreshold: number;
}

export const DEFAULT_GC_CONFIG: GCConfig = {
  importanceDecayPerMonth: 0.05,
  ttlHighImportance: null, // Indefinite
  ttlMediumImportance: 6 * 30 * 24 * 60 * 60 * 1000, // 6 months
  ttlLowImportance: 30 * 24 * 60 * 60 * 1000, // 1 month
  highThreshold: 0.8,
  lowThreshold: 0.3,
};
