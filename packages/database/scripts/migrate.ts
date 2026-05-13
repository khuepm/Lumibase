#!/usr/bin/env tsx
/**
 * Drizzle migration runner.
 *
 * - Local: reads `DATABASE_URL` (e.g. `postgres://localhost:5432/lumibase`).
 * - Remote: also reads `DATABASE_URL` but expects the production connection
 *   string (Hyperdrive/Neon/Supabase) injected via secret manager.
 *
 * Usage:
 *   pnpm --filter @lumibase/database migrate
 *   DATABASE_URL=... pnpm --filter @lumibase/database migrate:remote
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Error: DATABASE_URL is required.');
    process.exit(1);
  }

  console.log(`[migrate] Connecting...`);
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  console.log(`[migrate] Applying migrations from ./drizzle ...`);
  await migrate(db, { migrationsFolder: './drizzle' });

  console.log(`[migrate] Done.`);
  await client.end();
}

main().catch((err) => {
  console.error('[migrate] FAILED:', err);
  process.exit(1);
});
