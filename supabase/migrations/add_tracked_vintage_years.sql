-- Migration: Let each user choose which 3 vintage years the stats header tracks
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tracked_vintage_years INTEGER[] NOT NULL DEFAULT '{2016,2018,2023}';

UPDATE profiles
  SET tracked_vintage_years = '{2016,2018,2023}'
  WHERE tracked_vintage_years IS NULL;

COMMENT ON COLUMN profiles.tracked_vintage_years IS 'The 3 vintage years shown on the stats header, in card order';
