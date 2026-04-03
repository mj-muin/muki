#!/usr/bin/env node
/**
 * Basic functionality test
 */

import { MemoryStore } from './src/index';
import * as path from 'path';
import * as os from 'os';

async function testBasic() {
  console.log('=== MUKI Basic Functionality Test ===\n');

  // 1. Create MemoryStore instance
  console.log('1. Creating MemoryStore instance...');
  const dbPath = path.join(os.homedir(), '.muki', 'muki.db');
  const store = new MemoryStore(dbPath);
  console.log(`   ✓ MemoryStore created (${dbPath})\n`);

  // 2. Store a memory (without embeddings for now, just testing structure)
  console.log('2. Storing sample memories...');
  const sampleEmbedding = new Float32Array(1536).fill(0.1); // Dummy 1536-dim vector (OpenAI compatible)
  const now = Date.now();
  
  try {
    const memory1Id = store.store({
      content: 'Test memory: The sky is blue',
      embedding: sampleEmbedding,
      importance: 0.7,
      created_at: now,
    });
    console.log(`   ✓ Memory stored with ID: ${memory1Id}`);

    const memory2Id = store.store({
      content: 'Test memory: Water is wet',
      embedding: new Float32Array(1536).fill(0.2),
      importance: 0.5,
      created_at: now,
      metadata: { category: 'facts' }
    });
    console.log(`   ✓ Memory stored with ID: ${memory2Id}\n`);

    // 3. Query the database directly to verify storage
    console.log('3. Verifying storage...');
    const db = (store as any).db;
    const count = db.prepare('SELECT COUNT(*) as count FROM memories').get() as any;
    console.log(`   ✓ Total memories in database: ${count.count}`);
    
    const rows = db.prepare('SELECT id, content, importance FROM memories').all() as any[];
    rows.forEach(row => {
      console.log(`      - [${row.id}] "${row.content}" (importance: ${row.importance})`);
    });

    console.log('\n=== All basic tests passed! ===');
  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

testBasic().catch(console.error);
