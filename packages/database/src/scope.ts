import { eq, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

/**
 * Produce a `WHERE site_id = :siteId` clause for any tenant-scoped table.
 *
 * Usage:
 * ```ts
 * db.select().from(collections).where(scopeSite(collections.siteId, siteId));
 * ```
 *
 * Every Drizzle query that touches a domain table MUST funnel through this
 * helper (Strict Rule #2). Service classes wrap it so individual handlers
 * cannot accidentally forget it.
 */
export function scopeSite(siteColumn: AnyPgColumn, siteId: string): SQL {
  return eq(siteColumn, siteId);
}
