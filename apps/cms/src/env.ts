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
  /** Logto OIDC issuer, e.g. https://auth.lumibase.dev/oidc */
  LOGTO_ISSUER?: string;
  /** Expected `aud` claim, e.g. https://api.lumibase.dev */
  LOGTO_AUDIENCE?: string;
  /** When set to `"true"`, withAuth allows dev tokens (skip JWKS verify). */
  LUMIBASE_DEV_AUTH?: string;
  /** Secret key for AES-GCM per-field encryption (base64 encoded). */
  ENCRYPTION_KEY?: string;
}

/**
 * Authenticated principal resolved by `withAuth`.
 */
export interface AuthPrincipal {
  /** `sub` claim from Logto (== users.logto_id). */
  logtoId: string;
  /** Internal users.id, resolved lazily. May be undefined on first login. */
  userId?: string;
  email?: string;
  roles?: string[];
  raw: Record<string, unknown>;
}

/**
 * Per-request variables hung off Hono's context.
 */
export interface Variables {
  db: Database;
  /** Active site id (Strict Rule #2). Set by `withTenant`. */
  siteId: string;
  /** Authenticated principal. Set by `withAuth`. */
  auth: AuthPrincipal;
  /** Correlation id for log lines. */
  requestId: string;
}

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
