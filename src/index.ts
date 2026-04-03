/**
 * MUKI - Long-term memory system for AI agents
 * 
 * SQLite + sqlite-vec based vector database with importance-based GC
 */

export { Memory, MemorySearchOptions, MemorySearchResult, GCConfig, DEFAULT_GC_CONFIG } from './types';
export { MemoryStore } from './memory/store';
export { MemoryGC } from './memory/gc';
export { VectorDB } from './db/vector';
export { migrate } from './db/migrate';
export * from './db/schema';
