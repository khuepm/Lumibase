import { presets, scopeSite } from '@lumibase/database';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../env';

export const presetsRouter = new Hono<AppEnv>();

// List presets for a given collection and active site
// Support filtering by collection
presetsRouter.get('/', async (c) => {
  const siteId = c.get('siteId');
  const db = c.get('db');
  
  const collection = c.req.query('collection');
  
  const q = db.select().from(presets).where(
    and(
      scopeSite(presets.siteId, siteId),
      collection ? eq(presets.collection, collection) : undefined
    )
  );
  const rows = await q;
  return c.json({ data: rows });
});

// Get a single preset
presetsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const siteId = c.get('siteId');
  const db = c.get('db');

  const [row] = await db
    .select()
    .from(presets)
    .where(and(eq(presets.id, id), scopeSite(presets.siteId, siteId)))
    .limit(1);

  if (!row) {
    return c.json({ errors: [{ code: 'NOT_FOUND' }] }, 404);
  }

  return c.json({ data: row });
});

const presetSchema = z.object({
  bookmark: z.string().nullable().optional(),
  collection: z.string(),
  userId: z.string().nullable().optional(),
  roleId: z.string().nullable().optional(),
  layout: z.string().optional(),
  layoutQuery: z.record(z.unknown()).optional(),
  layoutOptions: z.record(z.unknown()).optional(),
  search: z.string().nullable().optional(),
  filter: z.record(z.unknown()).optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  refreshInterval: z.number().int().min(0).optional(),
});

// Create preset
presetsRouter.post('/', async (c) => {
  const siteId = c.get('siteId');
  const db = c.get('db');
  const body = await c.req.json();
  const input = presetSchema.parse(body);

  const [row] = await db
    .insert(presets)
    .values({
      siteId,
      collection: input.collection,
      bookmark: input.bookmark,
      userId: input.userId,
      roleId: input.roleId,
      layout: input.layout,
      layoutQuery: input.layoutQuery,
      layoutOptions: input.layoutOptions,
      search: input.search,
      filter: input.filter,
      icon: input.icon,
      color: input.color,
      refreshInterval: input.refreshInterval,
    })
    .returning();

  return c.json({ data: row });
});

// Update preset
presetsRouter.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const siteId = c.get('siteId');
  const db = c.get('db');
  const body = await c.req.json();
  const input = presetSchema.partial().parse(body);

  const [row] = await db
    .update(presets)
    .set({
      bookmark: input.bookmark,
      collection: input.collection,
      userId: input.userId,
      roleId: input.roleId,
      layout: input.layout,
      layoutQuery: input.layoutQuery,
      layoutOptions: input.layoutOptions,
      search: input.search,
      filter: input.filter,
      icon: input.icon,
      color: input.color,
      refreshInterval: input.refreshInterval,
    })
    .where(and(eq(presets.id, id), scopeSite(presets.siteId, siteId)))
    .returning();

  if (!row) {
    return c.json({ errors: [{ code: 'NOT_FOUND' }] }, 404);
  }

  return c.json({ data: row });
});

// Delete preset
presetsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const siteId = c.get('siteId');
  const db = c.get('db');

  const [row] = await db
    .delete(presets)
    .where(and(eq(presets.id, id), scopeSite(presets.siteId, siteId)))
    .returning({ id: presets.id });

  if (!row) {
    return c.json({ errors: [{ code: 'NOT_FOUND' }] }, 404);
  }

  return c.json({ data: null });
});
