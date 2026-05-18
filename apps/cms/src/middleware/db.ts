import { createDb, schema } from '@lumibase/database';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../env';

/**
 * Attach a per-request Drizzle client to the Hono context.
 *
 * Resolution order:
 * 1. If a RuntimeContext is available (`c.get('runtime')`), use its
 *    DatabaseProvider — this works for both Cloudflare and Docker modes
 *    since the runtime middleware already selected the correct adapter.
 * 2. Fallback: use the Hyperdrive binding directly (e.g. during migrations
 *    or if the runtime middleware hasn't been registered yet).
 */
export const withDb = (): MiddlewareHandler<AppEnv> => async (c, next) => {
  // Prefer RuntimeContext if available (set by withRuntime middleware).
  const runtime = c.get('runtime');
  if (runtime) {
    // DatabaseProvider.getConnection() returns a postgres.Sql instance
    // (from both Cloudflare and Docker adapters). Cast required because
    // the interface types it as `unknown` to avoid coupling to postgres-js.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sql = runtime.database.getConnection() as any;
    const db = drizzle(sql, { schema });
    c.set('db', db);
    await next();
    return;
  }

  // Fallback: direct Hyperdrive binding (backward compatibility).
  const hyperdrive = c.env.HYPERDRIVE;
  if (!hyperdrive) {
    return c.json(
      { error: 'Database connection is not configured. Ensure runtime or HYPERDRIVE binding is available.' },
      500,
    );
  }
  const db = createDb(hyperdrive.connectionString);
  c.set('db', db);
  await next();
};
