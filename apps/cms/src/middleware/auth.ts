import type { MiddlewareHandler } from 'hono';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AppEnv, AuthPrincipal } from '../env';

const JWKS_CACHE = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

const getJwks = (issuer: string) => {
  let jwks = JWKS_CACHE.get(issuer);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer.replace(/\/$/, '')}/jwks`));
    JWKS_CACHE.set(issuer, jwks);
  }
  return jwks;
};

/**
 * Verify the request's bearer token against Logto JWKS.
 *
 * Dev mode (`LUMIBASE_DEV_AUTH=true`): accepts any token shaped
 * `dev:<logtoId>` and trusts the claim. Never enable in production.
 */
export const withAuth = (): MiddlewareHandler<AppEnv> => async (c, next) => {
  const header = c.req.header('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return c.json(
      { errors: [{ code: 'UNAUTHENTICATED', message: 'Missing bearer token.' }] },
      401,
    );
  }

  if (c.env.LUMIBASE_DEV_AUTH === 'true' && token.startsWith('dev:')) {
    const logtoId = token.slice(4);
    const principal: AuthPrincipal = { logtoId, raw: { dev: true } };
    c.set('auth', principal);
    return next();
  }

  const issuer = c.env.LOGTO_ISSUER;
  const audience = c.env.LOGTO_AUDIENCE;
  if (!issuer || !audience) {
    return c.json(
      { errors: [{ code: 'AUTH_NOT_CONFIGURED', message: 'LOGTO_ISSUER/AUDIENCE missing.' }] },
      500,
    );
  }

  try {
    const { payload } = await jwtVerify(token, getJwks(issuer), {
      issuer,
      audience,
    });
    const principal: AuthPrincipal = {
      logtoId: String(payload.sub),
      email: typeof payload.email === 'string' ? payload.email : undefined,
      roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : undefined,
      raw: payload as Record<string, unknown>,
    };
    c.set('auth', principal);
    await next();
  } catch (err) {
    console.warn('[withAuth] verify failed', err);
    return c.json(
      { errors: [{ code: 'UNAUTHENTICATED', message: 'Invalid token.' }] },
      401,
    );
  }
};
