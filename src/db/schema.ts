/**
 * SQLite schema for MUKI
 */

export const SCHEMA_VERSION = 1;

export const CREATE_MEMORIES_TABLE = `
CREATE TABLE IF NOT EXISTS memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  embedding BLOB NOT NULL,
  importance REAL DEFAULT 0.5,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  metadata TEXT
);
`;

export const CREATE_INDICES = `
CREATE INDEX IF NOT EXISTS idx_importance ON memories(importance);
CREATE INDEX IF NOT EXISTS idx_created_at ON memories(created_at);
CREATE INDEX IF NOT EXISTS idx_expires_at ON memories(expires_at);
`;

export const CREATE_VEC_TABLE = `
CREATE VIRTUAL TABLE IF NOT EXISTS vec_index USING vec0(
  embedding FLOAT[1536]
);

CREATE TABLE IF NOT EXISTS vec_memory_map (
  vec_rowid INTEGER PRIMARY KEY,
  memory_id INTEGER UNIQUE NOT NULL
);
`;

export const CREATE_METADATA_TABLE = `
CREATE TABLE IF NOT EXISTS schema_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export const INIT_SCHEMA = [
  CREATE_METADATA_TABLE,
  CREATE_MEMORIES_TABLE,
  CREATE_INDICES,
  CREATE_VEC_TABLE,
  `INSERT OR IGNORE INTO schema_metadata (key, value) VALUES ('version', '${SCHEMA_VERSION}')`,
].join('\n');
