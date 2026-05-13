import { Hono } from 'hono';
import type { AppEnv } from '../env';

export const utilsRouter = new Hono<AppEnv>();

utilsRouter.get('/health', (c) =>
  c.json({ status: 'ok', env: c.env.LUMIBASE_ENV, ts: new Date().toISOString() }),
);

utilsRouter.get('/version', (c) =>
  c.json({
    name: 'lumibase-cms',
    version: '0.1.0',
    apiVersion: 1,
    env: c.env.LUMIBASE_ENV,
  }),
);
