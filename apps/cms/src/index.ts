import { Hono } from 'hono';
import type { AppEnv } from './env';
import { withDb } from './middleware/db';
import { deliverRouter } from './routes/deliver';

const app = new Hono<AppEnv>();

app.get('/health', (c) =>
  c.json({ status: 'ok', env: c.env.LUMIBASE_ENV }),
);

// All delivery routes are scoped by site_id at the URL level and re-checked
// inside each handler (Strict Rule #2: multi-tenancy at the query level).
app.use('/api/v1/deliver/*', withDb());
app.route('/api/v1/deliver', deliverRouter);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error('[lumibase-cms] unhandled error', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
