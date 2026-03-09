-- Migration: Add drinking window columns to wines table
ALTER TABLE wines
  ADD COLUMN IF NOT EXISTS drink_from INTEGER,
  ADD COLUMN IF NOT EXISTS drink_by   INTEGER;

COMMENT ON COLUMN wines.drink_from IS 'First year the wine is recommended to drink';
COMMENT ON COLUMN wines.drink_by   IS 'Last year the wine is recommended to drink';
