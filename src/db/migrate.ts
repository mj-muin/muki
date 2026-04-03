#!/usr/bin/env node
/**
 * Database migration script
 */

import Database from 'better-sqlite3';
import { INIT_SCHEMA } from './schema';
import * as path from 'path';
import * as fs from 'fs';

const DEFAULT_DB_PATH = path.join(process.env.HOME || '.', '.muki', 'muki.db');

function migrate(dbPath: string = DEFAULT_DB_PATH): void {
  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  console.log(`Migrating database: ${dbPath}`);

  const db = new Database(dbPath);
  
  try {
    // Load sqlite-vec extension
    try {
      db.loadExtension('vec0');
      console.log('✓ sqlite-vec extension loaded');
    } catch (err) {
      console.error('✗ Failed to load sqlite-vec extension');
      console.error('  Install: npm install sqlite-vec');
      throw err;
    }

    // Run schema initialization
    db.exec(INIT_SCHEMA);
    console.log('✓ Schema initialized');

    // Check version
    const version = db.prepare('SELECT value FROM schema_metadata WHERE key = ?').get('version') as any;
    console.log(`✓ Schema version: ${version.value}`);

  } finally {
    db.close();
  }

  console.log('Migration complete!');
}

// CLI execution
if (require.main === module) {
  const dbPath = process.argv[2] || DEFAULT_DB_PATH;
  migrate(dbPath);
}

export { migrate };
