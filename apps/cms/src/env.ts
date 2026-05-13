import type { Database } from '@lumibase/database';

/**
 * Cloudflare Worker bindings. Configure in `wrangler.toml`.
 *
 * - HYPERDRIVE: pooled Postgres connection string via Cloudflare Hyperdrive.
 * - CONFIG_CACHE: KV namespace for config + permission caches (Strict Rule #4).
 * - MEDIA: R2 bucket for asset storage.
 */
export interface Bindings {
  HYPERDRIVE?: Hyperdrive;
  CONFIG_CACHE?: KVNamespace;
  MEDIA?: R2Bucket;
  LUMIBASE_ENV: string;
}

/**
 * Per-request variables hung off Hono's context.
 */
export interface Variables {
  db: Database;
}

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
