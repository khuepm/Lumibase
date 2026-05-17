import { files, folders } from '@lumibase/database';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../env';

export const filesRouter = new Hono<AppEnv>();

// --- Folders ---
const folderSchema = z.object({
  name: z.string().min(1).max(255),
  parent: z.string().nullable().optional(),
});

filesRouter.get('/folders', async (c) => {
  const siteId = c.get('siteId');
  const db = c.get('db');
  const data = await db.select().from(folders).where(eq(folders.siteId, siteId));
  return c.json({ data });
});

filesRouter.post('/folders', async (c) => {
  const siteId = c.get('siteId');
  const db = c.get('db');
  const input = folderSchema.parse(await c.req.json());

  const [row] = await db
    .insert(folders)
    .values({ ...input, siteId })
    .returning();

  return c.json({ data: row });
});

filesRouter.patch('/folders/:id', async (c) => {
  const id = c.req.param('id');
  const siteId = c.get('siteId');
  const db = c.get('db');
  const input = folderSchema.partial().parse(await c.req.json());

  const [row] = await db
    .update(folders)
    .set(input)
    .where(and(eq(folders.siteId, siteId), eq(folders.id, id)))
    .returning();

  if (!row) return c.json({ errors: [{ code: 'NOT_FOUND' }] }, 404);
  return c.json({ data: row });
});

filesRouter.delete('/folders/:id', async (c) => {
  const id = c.req.param('id');
  const siteId = c.get('siteId');
  const db = c.get('db');

  const [row] = await db
    .delete(folders)
    .where(and(eq(folders.siteId, siteId), eq(folders.id, id)))
    .returning();

  if (!row) return c.json({ errors: [{ code: 'NOT_FOUND' }] }, 404);
  return c.json({ data: null });
});

// --- Files ---
// In a real implementation, we would issue presigned R2 URLs.
// Here we mock the file entity creation.
const fileCreateSchema = z.object({
  filenameDisk: z.string(),
  filenameDownload: z.string(),
  mime: z.string(),
  filesize: z.number(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  folder: z.string().optional().nullable(),
});

filesRouter.get('/', async (c) => {
  const siteId = c.get('siteId');
  const db = c.get('db');
  const data = await db.select().from(files).where(eq(files.siteId, siteId));
  return c.json({ data });
});

filesRouter.post('/', async (c) => {
  const siteId = c.get('siteId');
  const db = c.get('db');
  const auth = c.get('auth');
  const input = fileCreateSchema.parse(await c.req.json());

  const [row] = await db
    .insert(files)
    .values({
      ...input,
      siteId,
      uploadedBy: auth?.userId,
      storage: 'r2',
    })
    .returning();

  return c.json({ data: row });
});

filesRouter.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const siteId = c.get('siteId');
  const db = c.get('db');
  const input = fileCreateSchema.partial().parse(await c.req.json());

  const [row] = await db
    .update(files)
    .set(input)
    .where(and(eq(files.siteId, siteId), eq(files.id, id)))
    .returning();

  if (!row) return c.json({ errors: [{ code: 'NOT_FOUND' }] }, 404);
  return c.json({ data: row });
});

filesRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const siteId = c.get('siteId');
  const db = c.get('db');

  const [row] = await db
    .delete(files)
    .where(and(eq(files.siteId, siteId), eq(files.id, id)))
    .returning();

  if (!row) return c.json({ errors: [{ code: 'NOT_FOUND' }] }, 404);
  return c.json({ data: null });
});

// Presigned URL mock endpoint
filesRouter.post('/presigned-url', async (c) => {
  const body = await c.req.json();
  const filename = body.filename || 'unknown';
  return c.json({
    data: {
      url: `https://mock-r2-upload-url.local/${filename}?signature=mock`,
      method: 'PUT',
      key: `${Date.now()}_${filename}`,
    }
  });
});
