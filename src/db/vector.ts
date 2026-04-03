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
   * Insert vector and create mapping to memory_id
   */
  insert(memoryId: number, embedding: Float32Array): void {
    // Insert into vec_index (rowid auto-generated)
    const stmt = this.db.prepare('INSERT INTO vec_index (embedding) VALUES (?)');
    const info = stmt.run(Buffer.from(embedding.buffer));
    const vecRowid = Number(info.lastInsertRowid);
    
    // Create mapping
    const mapStmt = this.db.prepare('INSERT INTO vec_memory_map (vec_rowid, memory_id) VALUES (?, ?)');
    mapStmt.run(vecRowid, memoryId);
  }

  /**
   * Search for similar vectors (cosine similarity)
   */
  search(queryEmbedding: Float32Array, limit: number = 10): VectorSearchResult[] {
    const stmt = this.db.prepare(`
      SELECT m.memory_id, vec_distance_cosine(v.embedding, ?) as distance
      FROM vec_index v
      JOIN vec_memory_map m ON v.rowid = m.vec_rowid
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
    // Find vec_rowid from mapping
    const mapRow = this.db.prepare('SELECT vec_rowid FROM vec_memory_map WHERE memory_id = ?').get(memoryId) as any;
    if (!mapRow) return;
    
    // Delete from vec_index and mapping
    this.db.prepare('DELETE FROM vec_index WHERE rowid = ?').run(mapRow.vec_rowid);
    this.db.prepare('DELETE FROM vec_memory_map WHERE memory_id = ?').run(memoryId);
  }

  /**
   * Convert distance to similarity score (0-1)
   */
  static distanceToSimilarity(distance: number): number {
    // Cosine distance is typically 0-2, convert to similarity 0-1
    return Math.max(0, 1 - distance / 2);
  }
}
