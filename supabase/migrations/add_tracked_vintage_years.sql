-- Migration: Add user-configurable tracked vintage year columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tracked_vintage_year_1 INTEGER,
  ADD COLUMN IF NOT EXISTS tracked_vintage_year_2 INTEGER,
  ADD COLUMN IF NOT EXISTS tracked_vintage_year_3 INTEGER;

COMMENT ON COLUMN profiles.tracked_vintage_year_1 IS 'Year tracked by stat-card slot 1; NULL means use the app default (2016)';
COMMENT ON COLUMN profiles.tracked_vintage_year_2 IS 'Year tracked by stat-card slot 2; NULL means use the app default (2018)';
COMMENT ON COLUMN profiles.tracked_vintage_year_3 IS 'Year tracked by stat-card slot 3; NULL means use the app default (2023)';
