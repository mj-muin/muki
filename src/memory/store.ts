/**
 * Memory store with vector search and importance ranking
 */

import Database from 'better-sqlite3';
import { Memory, MemorySearchOptions, MemorySearchResult } from '../types';
import { VectorDB } from '../db/vector';
import * as sqliteVec from 'sqlite-vec';

export class MemoryStore {
  private db: Database.Database;
  private vectorDB: VectorDB;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    
    // Load sqlite-vec extension
    try {
      sqliteVec.load(this.db);
    } catch (err) {
      console.error('Failed to load sqlite-vec extension:', err);
      throw err;
    }
    
    this.vectorDB = new VectorDB(this.db);
  }

  /**
   * Store a new memory
   */
  store(memory: Omit<Memory, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO memories (content, embedding, importance, created_at, expires_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      memory.content,
      Buffer.from(memory.embedding.buffer),
      memory.importance,
      memory.created_at,
      memory.expires_at ?? null,
      memory.metadata ? JSON.stringify(memory.metadata) : null
    );

    const memoryId = Number(info.lastInsertRowid);
    this.vectorDB.insert(memoryId, memory.embedding);

    return memoryId;
  }

  /**
   * Search memories with vector similarity + importance reranking
   */
  search(queryEmbedding: Float32Array, options: Omit<MemorySearchOptions, 'query'> = {}): MemorySearchResult[] {
    const limit = options.limit ?? 10;
    const minImportance = options.minImportance ?? 0.0;

    // Step 1: Vector search (top-K candidates)
    const vectorResults = this.vectorDB.search(queryEmbedding, limit * 2);

    // Step 2: Fetch memories and filter by importance
    const memories = vectorResults
      .map(vr => {
        const row = this.db.prepare('SELECT * FROM memories WHERE id = ?').get(vr.memory_id) as any;
        if (!row || row.importance < minImportance) return null;

        const memory: Memory = {
          id: row.id,
          content: row.content,
          embedding: new Float32Array(row.embedding),
          importance: row.importance,
          created_at: row.created_at,
          expires_at: row.expires_at,
          metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        };

        const similarity = VectorDB.distanceToSimilarity(vr.distance);
        const score = similarity * 0.7 + memory.importance * 0.3; // Weighted score

        return { memory, similarity, score };
      })
      .filter(Boolean) as MemorySearchResult[];

    // Step 3: Rerank by score and return top-K
    return memories.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Update importance score (e.g., after reuse)
   */
  updateImportance(memoryId: number, delta: number): void {
    const stmt = this.db.prepare(`
      UPDATE memories
      SET importance = MIN(1.0, MAX(0.0, importance + ?))
      WHERE id = ?
    `);
    stmt.run(delta, memoryId);
  }

  /**
   * Delete expired memories
   */
  deleteExpired(): number {
    const now = Date.now();
    const stmt = this.db.prepare('DELETE FROM memories WHERE expires_at IS NOT NULL AND expires_at < ?');
    const info = stmt.run(now);
    return info.changes;
  }

  close(): void {
    this.db.close();
  }
}
