import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../env';

/**
 * Resolve the active `site_id` for the request and pin it on the context.
 *
 * Resolution order (highest priority first):
 *   1. Explicit `X-Lumi-Site` header (used by Studio + SDK).
 *   2. Subdomain mapping: `<slug>.api.lumibase.dev` → looked up via KV.
 *   3. Query string `?site=` (only when `LUMIBASE_DEV_AUTH=true`).
 *
 * Once resolved, every downstream service MUST scope queries by this id
 * (Strict Rule #2: multi-tenancy at the ORM/query layer).
 */
export const withTenant = (): MiddlewareHandler<AppEnv> => async (c, next) => {
  const headerSite = c.req.header('x-lumi-site');
  if (headerSite) {
    c.set('siteId', headerSite);
    return next();
  }

  const host = c.req.header('host') ?? '';
  const sub = host.split('.')[0];
  if (sub && sub !== 'api' && sub !== 'localhost' && sub !== '127') {
    // Phase A: resolve via CONFIG_CACHE KV: `site-domain:<subdomain>` -> siteId.
    const kv = c.env.CONFIG_CACHE;
    if (kv) {
      const mapped = await kv.get(`site-domain:${sub}`);
      if (mapped) {
        c.set('siteId', mapped);
        return next();
      }
    }
  }

  if (c.env.LUMIBASE_DEV_AUTH === 'true') {
    const fromQuery = c.req.query('site');
    if (fromQuery) {
      c.set('siteId', fromQuery);
      return next();
    }
  }

  return c.json(
    { errors: [{ code: 'TENANT_REQUIRED', message: 'X-Lumi-Site header is required.' }] },
    400,
  );
};
