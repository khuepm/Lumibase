import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './env';
import { withAuth } from './middleware/auth';
import { withDb } from './middleware/db';
import { withLogger } from './middleware/logger';
import { withTenant } from './middleware/tenant';
import { authRouter } from './routes/auth';
import { collectionsRouter } from './routes/collections';
import { deliverRouter } from './routes/deliver';
import { utilsRouter } from './routes/utils';

const app = new Hono<AppEnv>();

// Global middleware. Order matters: logger first so it captures everything;
// CORS before auth so preflight requests succeed.
app.use('*', withLogger());
app.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
    credentials: true,
    allowHeaders: ['Authorization', 'Content-Type', 'X-Lumi-Site', 'X-Request-Id'],
    exposeHeaders: ['X-Request-Id'],
  }),
);

// Public utility endpoints (no tenant, no auth).
app.route('/api/v1/utils', utilsRouter);
// Liveness alias kept for backwards compatibility.
app.get('/health', (c) =>
  c.json({ status: 'ok', env: c.env.LUMIBASE_ENV }),
);

// Authenticated + tenant-scoped surface.
const api = new Hono<AppEnv>();
api.use('*', withTenant(), withAuth(), withDb());
api.route('/auth', authRouter);
api.route('/collections', collectionsRouter);
// Future routers (Phase A+): items, permissions, presets, ...

app.route('/api/v1', api);

// Delivery (public) routes — tenancy is encoded in the URL.
app.use('/api/v1/deliver/*', withDb());
app.route('/api/v1/deliver', deliverRouter);

app.notFound((c) =>
  c.json({ errors: [{ code: 'NOT_FOUND', message: 'Route not found.' }] }, 404),
);
app.onError((err, c) => {
  const requestId = c.get('requestId');
  console.error('[lumibase-cms] unhandled error', { requestId, err });
  return c.json(
    { errors: [{ code: 'INTERNAL', message: 'Internal Server Error', requestId }] },
    500,
  );
});

export default app;
