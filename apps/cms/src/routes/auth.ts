import { Hono } from 'hono';
import type { AppEnv } from '../env';

/**
 * Auth routes (Phase 0 — read-only profile).
 *
 * Login/refresh are delegated to Logto's hosted endpoints; the Studio SPA
 * uses PKCE and exchanges the code there. This router only exposes
 * `/auth/me` so clients can pull the current principal + permissions.
 */
export const authRouter = new Hono<AppEnv>();

authRouter.get('/me', async (c) => {
  const auth = c.get('auth');
  const siteId = c.get('siteId');

  // Phase D will resolve internal users.id + roles by joining
  // user_sites scoped by siteId. For now we surface the raw principal.
  return c.json({
    data: {
      logtoId: auth.logtoId,
      email: auth.email,
      roles: auth.roles ?? [],
      siteId,
      // Permissions matrix lands in Phase C (see docs/features/permissions-rbac.md).
      permissions: null,
    },
  });
});
