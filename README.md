# MUKI - Long-term Memory System

**MUKI** (무인기업 Knowledge Infrastructure) is a local-first, cost-free vector database for AI agents, built on SQLite + [sqlite-vec](https://github.com/asg017/sqlite-vec).

## Why MUKI?

- **$0 cost** - No external vector DB fees (Pinecone, Qdrant, etc.)
- **Local-first** - All data stays on your machine
- **Lightweight** - Handles 100K+ vectors effortlessly
- **Smart GC** - Importance-based memory retention

## Architecture

```
┌─────────────────────────────────────────┐
│ MemoryStore (search + store)           │
├─────────────────────────────────────────┤
│ VectorDB (sqlite-vec wrapper)          │
├─────────────────────────────────────────┤
│ SQLite (memories table)                 │
└─────────────────────────────────────────┘
```

### Key Components

- **MemoryStore**: High-level API for storing and searching memories
- **VectorDB**: sqlite-vec wrapper for vector operations
- **MemoryGC**: Automatic garbage collection based on importance + TTL

### Schema

```sql
CREATE TABLE memories (
  id INTEGER PRIMARY KEY,
  content TEXT NOT NULL,
  embedding BLOB NOT NULL,         -- 1536-dim float32
  importance REAL DEFAULT 0.5,     -- 0.0-1.0
  created_at INTEGER NOT NULL,
  expires_at INTEGER,              -- TTL-based expiration
  metadata TEXT                    -- JSON
);

CREATE VIRTUAL TABLE vec_index USING vec0(
  memory_id INTEGER PRIMARY KEY,
  embedding FLOAT[1536]
);
```

## Installation

```bash
npm install
npm run build
```

### Dependencies

- `better-sqlite3` - SQLite driver
- `sqlite-vec` - Vector extension for SQLite

## Usage

### 1. Initialize Database

```bash
npm run migrate
```

This creates `~/.muki/muki.db` with the required schema.

### 2. Store Memories

```typescript
import { MemoryStore } from 'muki';
import { embed } from './embedding'; // Your embedding function

const store = new MemoryStore('~/.muki/muki.db');

const embedding = await embed('Important fact to remember');
const memoryId = store.store({
  content: 'Important fact to remember',
  embedding,
  importance: 0.8,
  created_at: Date.now(),
  metadata: { source: 'conversation' }
});
```

### 3. Search Memories

```typescript
const queryEmbedding = await embed('What was that important fact?');
const results = store.search(queryEmbedding, { limit: 5 });

results.forEach(r => {
  console.log(`[${r.score.toFixed(2)}] ${r.memory.content}`);
});
```

### 4. Garbage Collection

```typescript
import { MemoryGC } from 'muki';

const gc = new MemoryGC('~/.muki/muki.db');
const stats = gc.run();

console.log(`Decayed: ${stats.decayed}, Deleted: ${stats.deleted}`);
```

## GC Strategy

MUKI uses importance-based TTL:

| Importance | TTL        | Description        |
|------------|------------|--------------------|
| > 0.8      | Indefinite | High-value memories|
| 0.3-0.8    | 6 months   | Medium-value       |
| < 0.3      | 1 month    | Low-value          |

- **Decay**: Importance drops by 0.05 per month
- **Reuse Boost**: +0.1 when accessed (max 1.0)
- **Cleanup**: Weekly cron removes expired memories

## Phase 2 Roadmap

- [x] SQLite + sqlite-vec setup
- [x] Basic store/search API
- [x] Importance-based GC
- [ ] OpenAI embedding integration
- [ ] OpenClaw `memory_search` integration
- [ ] Sample dataset testing (10-100 memories)
- [ ] Cron-based GC automation

## Phase 3 (Future)

- Hybrid search (vector + BM25)
- Multi-vector support (text + image)
- Migration to Pinecone if >100K vectors

## License

MIT

---

*Built by [MJ Muin](https://github.com/mj-muin) for [MUIN](https://muin.company) - AI workforce infrastructure*
