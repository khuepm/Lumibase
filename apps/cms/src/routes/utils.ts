import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { renderTemplate } from '../services/template';

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

const renderTemplateSchema = z.object({
  template: z.string(),
  data: z.record(z.unknown()),
});

utilsRouter.post('/render-template', async (c) => {
  const parsed = renderTemplateSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json(
      { errors: parsed.error.issues.map((i) => ({ code: 'VALIDATION', message: i.message })) },
      400,
    );
  }
  return c.json({ data: { rendered: renderTemplate(parsed.data.template, parsed.data.data) } });
});
