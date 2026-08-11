-- AppForge Backend: Builds Table
-- Run this in Supabase SQL Editor (Database > SQL Editor)

CREATE TABLE IF NOT EXISTS builds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  website_url TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  r2_file_path TEXT,
  local_file_path TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_builds_user_email ON builds(user_email);
CREATE INDEX IF NOT EXISTS idx_builds_status ON builds(status);
CREATE INDEX IF NOT EXISTS idx_builds_expires_at ON builds(expires_at);

-- Optional: Row Level Security (RLS) - uncomment if needed
-- ALTER TABLE builds ENABLE ROW LEVEL SECURITY;

-- Optional: Policy to allow public read (for download checking)
-- CREATE POLICY "Allow public read for completed builds" ON builds
--   FOR SELECT USING (status = 'completed');