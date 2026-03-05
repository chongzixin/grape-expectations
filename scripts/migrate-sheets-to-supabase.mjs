/**
 * One-time migration: Google Sheets → Supabase
 *
 * Fetches wines from the deployed Sheets endpoint and bulk-inserts
 * them into the Supabase `wines` table under your user account.
 *
 * Usage:
 *   TARGET_USER_ID=<your-supabase-user-uuid> \
 *   SUPABASE_URL=https://<project>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
 *   SHEETS_ENDPOINT=https://<netlify-site>.netlify.app/.netlify/functions/sheets \
 *   node scripts/migrate-sheets-to-supabase.mjs
 *
 * Notes:
 * - SUPABASE_SERVICE_ROLE_KEY bypasses RLS — keep it secret, run once, delete from shell history.
 * - TARGET_USER_ID is the UUID from Supabase Auth → Users for your account.
 * - SHEETS_ENDPOINT is the live Netlify URL (before the sheets function is removed from prod).
 * - Run this BEFORE removing the Google Sheets env vars from Netlify.
 */

import { createClient } from '@supabase/supabase-js';

const REQUIRED = ['TARGET_USER_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SHEETS_ENDPOINT'];
for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const {
  TARGET_USER_ID,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SHEETS_ENDPOINT,
} = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`Fetching wines from: ${SHEETS_ENDPOINT}`);
const res = await fetch(SHEETS_ENDPOINT);
if (!res.ok) {
  console.error(`Sheets endpoint returned HTTP ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const wines = await res.json();
if (!Array.isArray(wines) || wines.length === 0) {
  console.error('No wines returned from Sheets endpoint. Check the URL and that the sheet is accessible.');
  process.exit(1);
}

console.log(`Fetched ${wines.length} wine(s) from Sheets.`);

// Map from app model (camelCase) to DB schema (snake_case)
const rows = wines.map(w => ({
  user_id:    TARGET_USER_ID,
  name:       w.name       || '',
  winery:     w.winery     || null,
  vintage:    w.vintage    || null,
  price:      w.price      ?? null,
  inventory:  typeof w.inventory === 'number' ? w.inventory : 1,
  style:      w.style      || null,
  country:    w.country    || null,
  region:     w.region     || null,
  sub_region: w.subRegion  || null,
  type:       w.type       || 'Red',
  source:     'import',
}));

console.log(`Inserting ${rows.length} row(s) into Supabase wines table...`);
const { data, error } = await supabase.from('wines').insert(rows).select('id');

if (error) {
  console.error('Insert failed:', error.message);
  process.exit(1);
}

console.log(`✓ Successfully inserted ${data.length} wine(s) for user ${TARGET_USER_ID}.`);
console.log('Migration complete. You can now remove GOOGLE_SERVICE_ACCOUNT_KEY from Netlify env vars.');
