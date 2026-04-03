/**
 * sqlite-vec wrapper for vector operations
 */

import Database from 'better-sqlite3';

export interface VectorSearchResult {
  memory_id: number;
  distance: number;
}

export class VectorDB {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Insert vector into vec_index
   */
  insert(memoryId: number, embedding: Float32Array): void {
    const stmt = this.db.prepare(`
      INSERT INTO vec_index (memory_id, embedding)
      VALUES (?, ?)
    `);
    stmt.run(memoryId, Buffer.from(embedding.buffer));
  }

  /**
   * Search for similar vectors (cosine similarity)
   */
  search(queryEmbedding: Float32Array, limit: number = 10): VectorSearchResult[] {
    const stmt = this.db.prepare(`
      SELECT memory_id, vec_distance_cosine(embedding, ?) as distance
      FROM vec_index
      ORDER BY distance ASC
      LIMIT ?
    `);
    
    const results = stmt.all(Buffer.from(queryEmbedding.buffer), limit) as VectorSearchResult[];
    return results;
  }

  /**
   * Delete vector by memory_id
   */
  delete(memoryId: number): void {
    const stmt = this.db.prepare('DELETE FROM vec_index WHERE memory_id = ?');
    stmt.run(memoryId);
  }

  /**
   * Convert distance to similarity score (0-1)
   */
  static distanceToSimilarity(distance: number): number {
    // Cosine distance is typically 0-2, convert to similarity 0-1
    return Math.max(0, 1 - distance / 2);
  }
}
