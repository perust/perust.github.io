CREATE TABLE IF NOT EXISTS comments (
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

CREATE INDEX IF NOT EXISTS idx_comments_post_status_created
  ON comments (post_slug, status, created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip_hash TEXT PRIMARY KEY,
  last_comment_at INTEGER NOT NULL,
  comment_count INTEGER NOT NULL DEFAULT 1
);
