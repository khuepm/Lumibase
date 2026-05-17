import { settings, scopeSite } from '@lumibase/database';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../env';

export const settingsRouter = new Hono<AppEnv>();

settingsRouter.get('/', async (c) => {
  const siteId = c.get('siteId');
  const db = c.get('db');
  
  const scope = c.req.query('scope');
  
  const q = db.select().from(settings).where(
    and(
      scopeSite(settings.siteId, siteId),
      scope ? eq(settings.scope, scope) : undefined
    )
  );
  const rows = await q;
  return c.json({ data: rows });
});

settingsRouter.get('/:key', async (c) => {
  const key = c.req.param('key');
  const siteId = c.get('siteId');
  const db = c.get('db');

  const [row] = await db
    .select()
    .from(settings)
    .where(and(eq(settings.key, key), scopeSite(settings.siteId, siteId)))
    .limit(1);

  if (!row) {
    return c.json({ errors: [{ code: 'NOT_FOUND' }] }, 404);
  }

  return c.json({ data: row });
});

const settingSchema = z.object({
  key: z.string(),
  value: z.record(z.unknown()),
  scope: z.string().optional(),
});

settingsRouter.post('/', async (c) => {
  const siteId = c.get('siteId');
  const db = c.get('db');
  const body = await c.req.json();
  const input = settingSchema.parse(body);

  const [row] = await db
    .insert(settings)
    .values({
      siteId,
      key: input.key,
      value: input.value,
      scope: input.scope,
    })
    .onConflictDoUpdate({
      target: [settings.siteId, settings.key],
      set: {
        value: input.value,
        scope: input.scope,
        updatedAt: new Date(),
      },
    })
    .returning();

  return c.json({ data: row });
});

settingsRouter.delete('/:key', async (c) => {
  const key = c.req.param('key');
  const siteId = c.get('siteId');
  const db = c.get('db');

  const [row] = await db
    .delete(settings)
    .where(and(eq(settings.key, key), scopeSite(settings.siteId, siteId)))
    .returning({ id: settings.id });

  if (!row) {
    return c.json({ errors: [{ code: 'NOT_FOUND' }] }, 404);
  }

  return c.json({ data: null });
});
