import { extensions } from '@lumibase/database';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../env';

export const extensionsRouter = new Hono<AppEnv>();

const extensionSchema = z.object({
  name: z.string(),
  version: z.string(),
  type: z.string(),
  enabled: z.boolean().default(false),
  bundleUrl: z.string(),
  manifest: z.record(z.string()).default({}),
  capabilities: z.array(z.string()).default([]),
});

extensionsRouter.get('/', async (c) => {
  const siteId = c.get('siteId');
  const db = c.get('db');
  
  const data = await db.select().from(extensions).where(eq(extensions.siteId, siteId));
  return c.json({ data });
});

extensionsRouter.post('/', async (c) => {
  const siteId = c.get('siteId');
  const db = c.get('db');
  const auth = c.get('auth');
  const input = extensionSchema.parse(await c.req.json());

  const [row] = await db
    .insert(extensions)
    .values({
      ...input,
      siteId,
      installedBy: auth?.userId,
    })
    .returning();

  return c.json({ data: row });
});

extensionsRouter.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const siteId = c.get('siteId');
  const db = c.get('db');
  const input = extensionSchema.partial().parse(await c.req.json());

  const [row] = await db
    .update(extensions)
    .set(input)
    .where(and(eq(extensions.siteId, siteId), eq(extensions.id, id)))
    .returning();

  if (!row) return c.json({ errors: [{ code: 'NOT_FOUND' }] }, 404);
  return c.json({ data: row });
});

extensionsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const siteId = c.get('siteId');
  const db = c.get('db');

  const [row] = await db
    .delete(extensions)
    .where(and(eq(extensions.siteId, siteId), eq(extensions.id, id)))
    .returning();

  if (!row) return c.json({ errors: [{ code: 'NOT_FOUND' }] }, 404);
  return c.json({ data: null });
});
