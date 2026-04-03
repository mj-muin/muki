/**
 * MemoryStore tests
 */

import { MemoryStore } from '../src/memory/store';
import { migrate } from '../src/db/migrate';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DB = path.join(__dirname, 'test.db');

describe('MemoryStore', () => {
  beforeAll(() => {
    // Initialize test database
    migrate(TEST_DB);
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    if (fs.existsSync(TEST_DB + '-shm')) fs.unlinkSync(TEST_DB + '-shm');
    if (fs.existsSync(TEST_DB + '-wal')) fs.unlinkSync(TEST_DB + '-wal');
  });

  test('store and search memory', () => {
    const store = new MemoryStore(TEST_DB);

    // Store a test memory
    const embedding = new Float32Array(1536).fill(0.5);
    const memoryId = store.store({
      content: 'Test memory',
      embedding,
      importance: 0.7,
      created_at: Date.now(),
    });

    expect(memoryId).toBeGreaterThan(0);

    // Search
    const results = store.search(embedding, { limit: 1 });
    expect(results.length).toBe(1);
    expect(results[0].memory.content).toBe('Test memory');

    store.close();
  });
});
