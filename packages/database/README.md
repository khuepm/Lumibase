# @lumibase/database

Drizzle ORM schema and migration tooling for Lumibase.

## Layout

- `src/schema.ts` — Single source of truth for all tables. Follows the strict architectural rules in `.cursorrules` (nanoid PKs, `site_id` on every domain table, JSONB for dynamic config).
- `src/client.ts` — `createDb(connectionString)` factory using `drizzle-orm/postgres-js`. Intended to be called from the CMS Worker with `env.HYPERDRIVE.connectionString`.
- `drizzle.config.ts` — drizzle-kit config; reads `DATABASE_URL` from the environment.

## Commands

Run from the repo root:

```bash
pnpm db:generate   # Generate SQL migrations from schema.ts
pnpm db:migrate    # Apply migrations to DATABASE_URL
pnpm db:studio     # Open Drizzle Studio
```

## Environment

Copy `.env.example` to `.env` and set `DATABASE_URL` for local development.
