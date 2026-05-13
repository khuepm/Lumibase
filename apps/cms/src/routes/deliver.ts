import { schema } from '@lumibase/database';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AppEnv } from '../env';

/**
 * Delivery API — implements the "1-Roundtrip Rule" (Strict Rule #3).
 *
 * GET /api/v1/deliver/page/:site_id/:slug
 *   1. Fetch the `pages` record scoped by site_id + slug (multi-tenancy).
 *   2. Read `layoutConfig.sections` and resolve declared data dependencies.
 *   3. (TODO) Parallel-fetch each section's collection data via Drizzle.
 *   4. Merge layout + data into a single JSON payload.
 */
export const deliverRouter = new Hono<AppEnv>();

interface SectionConfig {
  id: string;
  component: string;
  styleConfig?: Record<string, unknown>;
  data?: Record<string, unknown>;
  /** Optional declarative data binding the resolver will hydrate. */
  source?: {
    collection: string;
    limit?: number;
    orderBy?: string;
  };
}

interface LayoutConfig {
  sections?: SectionConfig[];
}

deliverRouter.get('/page/:site_id/:slug', async (c) => {
  const { site_id: siteId, slug } = c.req.param();
  const db = c.get('db');

  const [page] = await db
    .select()
    .from(schema.pages)
    .where(and(eq(schema.pages.siteId, siteId), eq(schema.pages.slug, slug)))
    .limit(1);

  if (!page) {
    return c.json({ error: 'Page not found.' }, 404);
  }

  const layout = (page.layoutConfig ?? {}) as LayoutConfig;
  const sections = layout.sections ?? [];

  // Placeholder: collection-data resolution will land in a follow-up commit.
  // Sections without a `source` simply pass through their static `data`.
  const resolved = sections.map((section) => ({
    id: section.id,
    component: section.component,
    styleConfig: section.styleConfig ?? {},
    data: section.data ?? {},
  }));

  return c.json({
    page: {
      title: page.title,
      slug: page.slug,
    },
    sections: resolved,
  });
});
