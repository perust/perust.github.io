import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';

const migrationUrl = new URL(
  '../manual-migrations/2026-06-30-add-is-private.sql',
  import.meta.url,
);
const readmeUrl = new URL('../README.md', import.meta.url);

function createLegacyDatabase() {
  const database = new DatabaseSync(':memory:');
  database.exec(`
    CREATE TABLE comments (
      id TEXT PRIMARY KEY,
      post_slug TEXT NOT NULL,
      nickname TEXT NOT NULL,
      body TEXT NOT NULL,
      delete_hash TEXT,
      ip_prefix TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      approved_at TEXT
    );

    INSERT INTO comments (
      id,
      post_slug,
      nickname,
      body,
      delete_hash,
      ip_prefix,
      ip_hash,
      status,
      approved_at
    ) VALUES (
      'existing-comment',
      'existing-post',
      '기존 작성자',
      '보존되어야 할 기존 댓글',
      'existing-delete-hash',
      '192.0.xxx.xxx',
      'existing-ip-hash',
      'approved',
      '2026-06-30 00:00:00'
    );
  `);
  return database;
}

test('private-comments migration adds a public default without losing existing comments', async () => {
  const database = createLegacyDatabase();
  const migration = await readFile(migrationUrl, 'utf8');

  database.exec(migration);

  const columns = database.prepare('PRAGMA table_info(comments)').all();
  const privateColumn = columns.find((column) => column.name === 'is_private');
  assert.deepEqual(privateColumn && {
    type: privateColumn.type,
    notNull: privateColumn.notnull,
    defaultValue: privateColumn.dflt_value,
  }, {
    type: 'INTEGER',
    notNull: 1,
    defaultValue: '0',
  });

  const existingComment = database.prepare(`
    SELECT id, body, is_private AS isPrivate
    FROM comments
    WHERE id = 'existing-comment'
  `).get();
  assert.deepEqual({ ...existingComment }, {
    id: 'existing-comment',
    body: '보존되어야 할 기존 댓글',
    isPrivate: 0,
  });
});

test('the D1 runbook inspects existing columns before applying the one-time migration', async () => {
  const readme = await readFile(readmeUrl, 'utf8');
  const inspectionIndex = readme.indexOf('PRAGMA table_info(comments);');
  const migrationIndex = readme.indexOf('manual-migrations/2026-06-30-add-is-private.sql');

  assert.notEqual(inspectionIndex, -1, 'runbook must inspect the live schema');
  assert.notEqual(migrationIndex, -1, 'runbook must reference the tested migration file');
  assert.ok(inspectionIndex < migrationIndex, 'schema inspection must precede migration');
  assert.match(readme, /is_private.*있으면.*실행하지/u);
  assert.doesNotMatch(
    readme,
    /ALTER TABLE comments ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0;/u,
    'runbook must use the tested migration file instead of duplicated inline SQL',
  );
});
