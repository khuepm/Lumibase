import {
  activity,
  collections,
  items,
  revisions,
  scopeSite,
  type Database,
} from '@lumibase/database';
import { and, asc, desc, eq, isNull, sql, type SQL } from 'drizzle-orm';

/**
 * ItemService — generic CRUD over the `items` JSONB store, driven by the
 * SchemaService manifest. Handles list/detail/create/update/delete + bulk
 * with multi-tenant scoping and pluggable filter/sort/paginate. Permissions
 * (Phase C) wrap this service with row/field masks.
 */

export interface ListItemsParams {
  fields?: string[];
  filter?: ItemFilter;
  sort?: string[];
  limit?: number;
  offset?: number;
  status?: string | null;
  search?: string;
}

export type ItemFilterOp =
  | '_eq'
  | '_neq'
  | '_in'
  | '_nin'
  | '_gt'
  | '_gte'
  | '_lt'
  | '_lte'
  | '_contains'
  | '_starts_with'
  | '_ends_with'
  | '_null'
  | '_nnull';

/** Recursive tree-shaped filter, e.g. `{ _and: [ { status: { _eq: 'published' } } ] }`. */
export interface ItemFilter {
  _and?: ItemFilter[];
  _or?: ItemFilter[];
  [key: string]:
    | { [op in ItemFilterOp]?: unknown }
    | ItemFilter[]
    | undefined;
}

export interface ItemRow {
  id: string;
  siteId: string;
  collectionId: string;
  status: string;
  data: Record<string, unknown>;
  sort: number;
  userCreated: string | null;
  userUpdated: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class ItemServiceError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
    this.name = 'ItemServiceError';
  }
}

export interface ItemServiceDeps {
  db: Database;
  siteId: string;
  /** Caller user id; written to revisions/activity for audit. */
  userId?: string | null;
}

const STRUCTURAL_FIELDS = new Set([
  'id',
  'status',
  'sort',
  'user_created',
  'user_updated',
  'created_at',
  'updated_at',
]);

/** Reserved data keys that map to structural columns rather than JSONB. */
function fieldExpression(name: string): SQL {
  switch (name) {
    case 'id':
      return items.id as unknown as SQL;
    case 'status':
      return items.status as unknown as SQL;
    case 'sort':
      return items.sort as unknown as SQL;
    case 'user_created':
      return items.userCreated as unknown as SQL;
    case 'user_updated':
      return items.userUpdated as unknown as SQL;
    case 'created_at':
      return items.createdAt as unknown as SQL;
    case 'updated_at':
      return items.updatedAt as unknown as SQL;
    default:
      // JSONB path access. Drizzle's `sql` keeps the binding parameterized.
      return sql`${items.data}->>${name}`;
  }
}

function buildFilter(filter?: ItemFilter): SQL | undefined {
  if (!filter) return undefined;
  const clauses: SQL[] = [];

  if (filter._and?.length) {
    const sub = filter._and
      .map(buildFilter)
      .filter((c): c is SQL => c !== undefined);
    if (sub.length) clauses.push(sql.join(sub, sql` and `));
  }

  if (filter._or?.length) {
    const sub = filter._or
      .map(buildFilter)
      .filter((c): c is SQL => c !== undefined);
    if (sub.length) clauses.push(sql`(${sql.join(sub, sql` or `)})`);
  }

  for (const [key, value] of Object.entries(filter)) {
    if (key === '_and' || key === '_or') continue;
    if (!value || typeof value !== 'object') continue;
    const expr = fieldExpression(key);
    for (const [op, raw] of Object.entries(value as Record<string, unknown>)) {
      switch (op as ItemFilterOp) {
        case '_eq':
          clauses.push(sql`${expr} = ${raw}`);
          break;
        case '_neq':
          clauses.push(sql`${expr} <> ${raw}`);
          break;
        case '_in':
          clauses.push(sql`${expr} = any(${raw as unknown[]})`);
          break;
        case '_nin':
          clauses.push(sql`${expr} <> all(${raw as unknown[]})`);
          break;
        case '_gt':
          clauses.push(sql`${expr} > ${raw}`);
          break;
        case '_gte':
          clauses.push(sql`${expr} >= ${raw}`);
          break;
        case '_lt':
          clauses.push(sql`${expr} < ${raw}`);
          break;
        case '_lte':
          clauses.push(sql`${expr} <= ${raw}`);
          break;
        case '_contains':
          clauses.push(sql`${expr} ilike ${'%' + String(raw) + '%'}`);
          break;
        case '_starts_with':
          clauses.push(sql`${expr} ilike ${String(raw) + '%'}`);
          break;
        case '_ends_with':
          clauses.push(sql`${expr} ilike ${'%' + String(raw)}`);
          break;
        case '_null':
          clauses.push(raw ? sql`${expr} is null` : sql`${expr} is not null`);
          break;
        case '_nnull':
          clauses.push(raw ? sql`${expr} is not null` : sql`${expr} is null`);
          break;
        default:
          throw new ItemServiceError('INVALID_FILTER', `Unknown operator "${op}".`);
      }
    }
  }

  if (!clauses.length) return undefined;
  return sql.join(clauses, sql` and `);
}

function buildSort(sort?: string[]): SQL[] {
  if (!sort?.length) return [desc(items.updatedAt)];
  return sort.map((token) => {
    const dir = token.startsWith('-') ? desc : asc;
    const name = token.replace(/^[-+]/, '');
    return dir(fieldExpression(name) as never);
  });
}

export class ItemService {
  constructor(private readonly deps: ItemServiceDeps) {}

  private async resolveCollection(name: string) {
    const [coll] = await this.deps.db
      .select()
      .from(collections)
      .where(and(scopeSite(collections.siteId, this.deps.siteId), eq(collections.name, name)))
      .limit(1);
    if (!coll) {
      throw new ItemServiceError('NOT_FOUND', `Collection "${name}" not found.`, 404);
    }
    return coll;
  }

  async list(collectionName: string, params: ListItemsParams = {}) {
    const coll = await this.resolveCollection(collectionName);
    const where = and(
      scopeSite(items.siteId, this.deps.siteId),
      eq(items.collectionId, coll.id),
      isNull(items.deletedAt),
      params.status ? eq(items.status, params.status) : undefined,
      buildFilter(params.filter),
    );

    const limit = Math.min(params.limit ?? 25, 200);
    const offset = params.offset ?? 0;

    const rows = await this.deps.db
      .select()
      .from(items)
      .where(where)
      .orderBy(...buildSort(params.sort))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await this.deps.db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(where);

    return {
      data: params.fields ? rows.map((r) => projectFields(r as ItemRow, params.fields!)) : rows,
      meta: { total: count, limit, offset },
    };
  }

  async detail(collectionName: string, id: string, fields?: string[]) {
    const coll = await this.resolveCollection(collectionName);
    const [row] = await this.deps.db
      .select()
      .from(items)
      .where(
        and(
          scopeSite(items.siteId, this.deps.siteId),
          eq(items.collectionId, coll.id),
          eq(items.id, id),
          isNull(items.deletedAt),
        ),
      )
      .limit(1);
    if (!row) throw new ItemServiceError('NOT_FOUND', `Item "${id}" not found.`, 404);
    return fields ? projectFields(row as ItemRow, fields) : row;
  }

  async create(collectionName: string, payload: { data: Record<string, unknown>; status?: string; sort?: number }) {
    const coll = await this.resolveCollection(collectionName);
    const [row] = await this.deps.db
      .insert(items)
      .values({
        siteId: this.deps.siteId,
        collectionId: coll.id,
        data: payload.data ?? {},
        status: payload.status ?? 'draft',
        sort: payload.sort ?? 0,
        userCreated: this.deps.userId ?? null,
        userUpdated: this.deps.userId ?? null,
      })
      .returning();
    await this.writeRevision(coll.id, row.id, payload.data ?? {}, null);
    await this.writeActivity('create', coll.name, row.id, { data: payload.data });
    return row;
  }

  async patch(collectionName: string, id: string, patch: Partial<{ data: Record<string, unknown>; status: string; sort: number }>) {
    const coll = await this.resolveCollection(collectionName);
    const current = (await this.detail(collectionName, id)) as ItemRow;

    const merged: ItemRow['data'] = patch.data
      ? { ...(current.data as Record<string, unknown>), ...patch.data }
      : current.data;

    const [row] = await this.deps.db
      .update(items)
      .set({
        data: merged,
        status: patch.status ?? current.status,
        sort: patch.sort ?? current.sort,
        userUpdated: this.deps.userId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(items.id, id))
      .returning();

    await this.writeRevision(coll.id, id, merged, current.data as Record<string, unknown>);
    await this.writeActivity('update', coll.name, id, { patch });
    return row;
  }

  async replace(collectionName: string, id: string, body: { data: Record<string, unknown>; status?: string; sort?: number }) {
    return this.patch(collectionName, id, { data: body.data, status: body.status, sort: body.sort });
  }

  async softDelete(collectionName: string, id: string) {
    const coll = await this.resolveCollection(collectionName);
    await this.deps.db
      .update(items)
      .set({ deletedAt: new Date(), userUpdated: this.deps.userId ?? null })
      .where(
        and(
          scopeSite(items.siteId, this.deps.siteId),
          eq(items.collectionId, coll.id),
          eq(items.id, id),
        ),
      );
    await this.writeActivity('delete', coll.name, id, {});
    return { ok: true } as const;
  }

  async bulk(
    collectionName: string,
    op: 'create' | 'update' | 'delete',
    payload: Array<Record<string, unknown>>,
  ) {
    const out: unknown[] = [];
    for (const entry of payload) {
      if (op === 'create') {
        out.push(await this.create(collectionName, { data: entry as Record<string, unknown> }));
      } else if (op === 'update') {
        const id = entry.id as string;
        out.push(await this.patch(collectionName, id, { data: entry as Record<string, unknown> }));
      } else {
        const id = entry.id as string;
        out.push(await this.softDelete(collectionName, id));
      }
    }
    return out;
  }

  async revertRevision(collectionName: string, itemId: string, revisionId: string) {
    const [rev] = await this.deps.db
      .select()
      .from(revisions)
      .where(
        and(
          scopeSite(revisions.siteId, this.deps.siteId),
          eq(revisions.id, revisionId),
          eq(revisions.itemId, itemId),
        ),
      )
      .limit(1);
    if (!rev) throw new ItemServiceError('NOT_FOUND', 'Revision not found.', 404);

    const snapshot = (rev.delta as { after?: Record<string, unknown> }).after ?? {};
    return this.replace(collectionName, itemId, { data: snapshot });
  }

  // ---------- internals ----------

  private async writeRevision(
    collectionId: string,
    itemId: string,
    after: Record<string, unknown>,
    before: Record<string, unknown> | null,
  ) {
    await this.deps.db.insert(revisions).values({
      siteId: this.deps.siteId,
      collectionId,
      itemId,
      delta: { before, after },
      userId: this.deps.userId ?? null,
    });
  }

  private async writeActivity(
    action: string,
    collectionName: string,
    itemId: string | null,
    payload: Record<string, unknown>,
  ) {
    await this.deps.db.insert(activity).values({
      siteId: this.deps.siteId,
      action,
      userId: this.deps.userId ?? null,
      collection: collectionName,
      itemId,
      payload,
    });
  }
}

function projectFields(row: ItemRow, fields: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (STRUCTURAL_FIELDS.has(f)) {
      const map: Record<string, unknown> = {
        id: row.id,
        status: row.status,
        sort: row.sort,
        user_created: row.userCreated,
        user_updated: row.userUpdated,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
      };
      out[f] = map[f];
    } else {
      out[f] = row.data?.[f];
    }
  }
  return out;
}
