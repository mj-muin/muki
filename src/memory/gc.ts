/**
 * Garbage collection for memory management
 * - Importance-based TTL assignment
 * - Periodic cleanup of expired memories
 */

import Database from 'better-sqlite3';
import { GCConfig, DEFAULT_GC_CONFIG } from '../types';

export class MemoryGC {
  private db: Database.Database;
  private config: GCConfig;

  constructor(dbPath: string, config: GCConfig = DEFAULT_GC_CONFIG) {
    this.db = new Database(dbPath);
    this.config = config;
  }

  /**
   * Recalculate TTL for all memories based on importance
   */
  recalculateTTL(): number {
    const now = Date.now();
    let updated = 0;

    const stmt = this.db.prepare('SELECT id, importance, created_at FROM memories');
    const updateStmt = this.db.prepare('UPDATE memories SET expires_at = ? WHERE id = ?');

    for (const row of stmt.all() as any[]) {
      let expiresAt: number | null = null;

      if (row.importance >= this.config.highThreshold) {
        expiresAt = null; // Indefinite
      } else if (row.importance >= this.config.lowThreshold) {
        expiresAt = now + this.config.ttlMediumImportance;
      } else {
        expiresAt = now + this.config.ttlLowImportance;
      }

      updateStmt.run(expiresAt, row.id);
      updated++;
    }

    return updated;
  }

  /**
   * Decay importance scores over time (monthly)
   */
  decayImportance(): number {
    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    const stmt = this.db.prepare('SELECT id, importance, created_at FROM memories');
    const updateStmt = this.db.prepare('UPDATE memories SET importance = ? WHERE id = ?');

    let updated = 0;

    for (const row of stmt.all() as any[]) {
      const ageMonths = (now - row.created_at) / oneMonth;
      const decay = Math.min(row.importance, ageMonths * this.config.importanceDecayPerMonth);
      const newImportance = Math.max(0, row.importance - decay);

      if (newImportance !== row.importance) {
        updateStmt.run(newImportance, row.id);
        updated++;
      }
    }

    return updated;
  }

  /**
   * Delete expired memories
   */
  cleanup(): number {
    const now = Date.now();
    const stmt = this.db.prepare('DELETE FROM memories WHERE expires_at IS NOT NULL AND expires_at < ?');
    const info = stmt.run(now);
    return info.changes;
  }

  /**
   * Full GC run: decay → recalculate TTL → cleanup
   */
  run(): { decayed: number; recalculated: number; deleted: number } {
    const decayed = this.decayImportance();
    const recalculated = this.recalculateTTL();
    const deleted = this.cleanup();

    return { decayed, recalculated, deleted };
  }

  close(): void {
    this.db.close();
  }
}
