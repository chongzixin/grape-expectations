-- ============================================================
-- Grape Expectations — Supabase Schema
-- Run this in the Supabase dashboard → SQL Editor
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────
-- Auto-populated on signup via trigger below
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ── Wine Inventory ──────────────────────────────────────────
-- Each user has their own independent cellar
CREATE TABLE wines (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  winery      TEXT,
  vintage     TEXT,
  price       NUMERIC(10, 2),
  inventory   INTEGER NOT NULL DEFAULT 1,
  style       TEXT,
  country     TEXT,
  region      TEXT,
  sub_region  TEXT,
  type        TEXT    NOT NULL,
  source      TEXT    DEFAULT 'manual', -- 'manual' | 'photo_scan' | 'import'
  drink_from  INTEGER,
  drink_by    INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wines"
  ON wines FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wines"
  ON wines FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wines"
  ON wines FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wines"
  ON wines FOR DELETE USING (auth.uid() = user_id);

-- ── Recommendation Sessions ─────────────────────────────────
-- One session = one chat conversation in the UI
CREATE TABLE recommendation_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recommendation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON recommendation_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON recommendation_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Recommendation Messages ─────────────────────────────────
-- Each user/assistant turn saved for context + future ML
CREATE TABLE recommendation_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES recommendation_sessions(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recommendation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON recommendation_messages FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON recommendation_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Recommendation Feedback ─────────────────────────────────
-- Thumbs up/down on individual wines named in an AI response.
-- Designed for future personalization: feed back into Claude's
-- system prompt to bias recommendations toward liked styles.
--
-- Key fields for ML:
--   in_cellar      — cellar pick vs "buy this" suggestion (different signals)
--   cellar_wine_id — links to inventory row for style/region/type enrichment
--   context_query  — what the user asked (e.g. "light red for zichar")
CREATE TABLE recommendation_feedback (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id     UUID    NOT NULL REFERENCES recommendation_messages(id) ON DELETE CASCADE,
  wine_name      TEXT    NOT NULL,
  winery         TEXT,
  in_cellar      BOOLEAN DEFAULT FALSE,
  cellar_wine_id UUID    REFERENCES wines(id) ON DELETE SET NULL,
  feedback       TEXT    NOT NULL CHECK (feedback IN ('thumbs_up', 'thumbs_down')),
  context_query  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id, wine_name)  -- one vote per wine per message
);

ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON recommendation_feedback FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON recommendation_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
  ON recommendation_feedback FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback"
  ON recommendation_feedback FOR DELETE USING (auth.uid() = user_id);

-- ── Auto-create profile on signup ───────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
