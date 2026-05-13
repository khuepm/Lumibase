import { createDb } from '@lumibase/database';
import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../env';

/**
 * Attach a per-request Drizzle client backed by the Hyperdrive binding.
 *
 * Cloudflare Hyperdrive exposes a pooled connection string via
 * `env.HYPERDRIVE.connectionString`. We instantiate the client per request
 * so the underlying postgres-js client is scoped to the isolate's lifetime.
 */
export const withDb = (): MiddlewareHandler<AppEnv> => async (c, next) => {
  const hyperdrive = c.env.HYPERDRIVE;
  if (!hyperdrive) {
    return c.json(
      { error: 'HYPERDRIVE binding is not configured.' },
      500,
    );
  }
  const db = createDb(hyperdrive.connectionString);
  c.set('db', db);
  await next();
};
