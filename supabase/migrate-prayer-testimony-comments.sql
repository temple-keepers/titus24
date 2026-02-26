-- ─── Prayer & Testimony Comments ──────────────────────────────
-- Comments on prayer requests
CREATE TABLE IF NOT EXISTS prayer_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comments on testimonies
CREATE TABLE IF NOT EXISTS testimony_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id UUID NOT NULL REFERENCES testimonies(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prayer_comments_request ON prayer_comments(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_author ON prayer_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_testimony_comments_testimony ON testimony_comments(testimony_id);
CREATE INDEX IF NOT EXISTS idx_testimony_comments_author ON testimony_comments(author_id);

-- RLS
ALTER TABLE prayer_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimony_comments ENABLE ROW LEVEL SECURITY;

-- Prayer comments policies
CREATE POLICY "prayer_comments_select" ON prayer_comments FOR SELECT USING (true);
CREATE POLICY "prayer_comments_insert" ON prayer_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "prayer_comments_delete" ON prayer_comments FOR DELETE USING (auth.uid() = author_id);

-- Testimony comments policies
CREATE POLICY "testimony_comments_select" ON testimony_comments FOR SELECT USING (true);
CREATE POLICY "testimony_comments_insert" ON testimony_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "testimony_comments_delete" ON testimony_comments FOR DELETE USING (auth.uid() = author_id);
