import type { SQL } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { items } from '@lumibase/database';
import type { PolicyRule } from '@lumibase/shared';

/**
 * Permission rule DSL → SQL where-clause + in-memory predicate.
 *
 * The same AST is evaluated twice:
 *   - `compileWhere(rule)` injects a clause into ItemService SELECT/UPDATE so
 *     forbidden rows never come back.
 *   - `evaluate(rule, item)` is a JS mirror used for create/update post-checks
 *     and unit tests so we don't need to round-trip to Postgres.
 *
 * Magic vars (`$CURRENT_USER`, `$NOW`, `$HEADERS.*`, ...) resolve through
 * `MagicContext` so requests can plug in their auth + IP + headers without
 * hard-coding env access into the evaluator.
 */

export interface MagicContext {
  userId: string | null;
  siteId: string;
  roleId: string | null;
  ip: string | null;
  headers: Record<string, string>;
  /** Override for `$NOW`; defaults to `new Date()`. Useful for tests. */
  now?: Date;
}

const STRUCTURAL_FIELDS: Record<string, string> = {
  id: 'id',
  status: 'status',
  sort: 'sort',
  user_created: 'user_created',
  user_updated: 'user_updated',
  created_at: 'created_at',
  updated_at: 'updated_at',
};

/** Resolve a single PolicyValue, expanding magic vars to a concrete value. */
export function resolveMagic(value: unknown, ctx: MagicContext): unknown {
  if (typeof value !== 'string') return value;
  if (!value.startsWith('$')) return value;

  if (value === '$CURRENT_USER') return ctx.userId;
  if (value === '$CURRENT_SITE') return ctx.siteId;
  if (value === '$CURRENT_ROLE') return ctx.roleId;
  if (value === '$IP') return ctx.ip;
  if (value === '$NOW') return (ctx.now ?? new Date()).toISOString();
  if (value.startsWith('$HEADERS.')) {
    return ctx.headers[value.slice('$HEADERS.'.length).toLowerCase()] ?? null;
  }
  // Unknown — leave as literal so SQL comparisons still produce a defined
  // result (Postgres simply never matches the placeholder).
  return value;
}

/** ---------- SQL compilation ---------- */

function fieldExpr(field: string): SQL {
  switch (STRUCTURAL_FIELDS[field]) {
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
      return sql`${items.data}->>${field}`;
  }
}

/**
 * Compile a PolicyRule subtree to a SQL clause. Empty rule (`{}`) returns
 * `undefined` so callers can short-circuit composition.
 */
export function compileWhere(rule: PolicyRule | null | undefined, ctx: MagicContext): SQL | undefined {
  if (!rule) return undefined;
  const r = rule as Record<string, unknown>;
  if (Array.isArray(r._and)) {
    const sub = (r._and as PolicyRule[])
      .map((x) => compileWhere(x, ctx))
      .filter((c): c is SQL => !!c);
    if (!sub.length) return undefined;
    return sql.join(sub, sql` and `);
  }
  if (Array.isArray(r._or)) {
    const sub = (r._or as PolicyRule[])
      .map((x) => compileWhere(x, ctx))
      .filter((c): c is SQL => !!c);
    if (!sub.length) return undefined;
    return sql`(${sql.join(sub, sql` or `)})`;
  }
  if (r._not && typeof r._not === 'object') {
    const inner = compileWhere(r._not as PolicyRule, ctx);
    if (!inner) return undefined;
    return sql`(not (${inner}))`;
  }
  const clauses: SQL[] = [];
  for (const [field, op] of Object.entries(rule as Record<string, Record<string, unknown>>)) {
    const expr = fieldExpr(field);
    for (const [opKey, raw] of Object.entries(op)) {
      const v = Array.isArray(raw) ? raw.map((x) => resolveMagic(x, ctx)) : resolveMagic(raw, ctx);
      switch (opKey) {
        case '_eq':
          clauses.push(sql`${expr} = ${v}`);
          break;
        case '_neq':
          clauses.push(sql`${expr} <> ${v}`);
          break;
        case '_in':
          clauses.push(sql`${expr} = any(${v as unknown[]})`);
          break;
        case '_nin':
          clauses.push(sql`${expr} <> all(${v as unknown[]})`);
          break;
        case '_gt':
          clauses.push(sql`${expr} > ${v}`);
          break;
        case '_gte':
          clauses.push(sql`${expr} >= ${v}`);
          break;
        case '_lt':
          clauses.push(sql`${expr} < ${v}`);
          break;
        case '_lte':
          clauses.push(sql`${expr} <= ${v}`);
          break;
        case '_contains':
          clauses.push(sql`${expr} ilike ${'%' + String(v) + '%'}`);
          break;
        case '_starts_with':
          clauses.push(sql`${expr} ilike ${String(v) + '%'}`);
          break;
        case '_ends_with':
          clauses.push(sql`${expr} ilike ${'%' + String(v)}`);
          break;
        case '_between': {
          const [lo, hi] = v as [unknown, unknown];
          clauses.push(sql`${expr} between ${lo} and ${hi}`);
          break;
        }
        default:
          // Unknown operators are treated as `false` to fail closed.
          clauses.push(sql`false`);
      }
    }
  }
  if (!clauses.length) return undefined;
  return sql.join(clauses, sql` and `);
}

/** ---------- In-memory evaluation ---------- */

function getValue(item: Record<string, unknown>, field: string): unknown {
  if (field in STRUCTURAL_FIELDS) return item[field];
  // For nested data/jsonb access we only support top-level keys at the moment.
  return (item.data as Record<string, unknown> | undefined)?.[field] ?? item[field];
}

/**
 * Evaluate a rule against an in-memory item snapshot. Used by post-write
 * hooks (e.g. enforce that a created row matches the user's `create` rule).
 */
export function evaluate(
  rule: PolicyRule | null | undefined,
  item: Record<string, unknown>,
  ctx: MagicContext,
): boolean {
  if (!rule) return true;
  const r = rule as Record<string, unknown>;
  if (Array.isArray(r._and)) return (r._and as PolicyRule[]).every((x) => evaluate(x, item, ctx));
  if (Array.isArray(r._or)) return (r._or as PolicyRule[]).some((x) => evaluate(x, item, ctx));
  if (r._not && typeof r._not === 'object') return !evaluate(r._not as PolicyRule, item, ctx);

  for (const [field, op] of Object.entries(rule as Record<string, Record<string, unknown>>)) {
    const lhs = getValue(item, field);
    for (const [opKey, raw] of Object.entries(op)) {
      const v = Array.isArray(raw) ? raw.map((x) => resolveMagic(x, ctx)) : resolveMagic(raw, ctx);
      if (!matchOp(opKey, lhs, v)) return false;
    }
  }
  return true;
}

function matchOp(op: string, lhs: unknown, rhs: unknown): boolean {
  switch (op) {
    case '_eq':
      return lhs === rhs;
    case '_neq':
      return lhs !== rhs;
    case '_in':
      return Array.isArray(rhs) && rhs.includes(lhs);
    case '_nin':
      return Array.isArray(rhs) && !rhs.includes(lhs);
    case '_gt':
      return typeof lhs === 'number' && typeof rhs === 'number' ? lhs > rhs : String(lhs) > String(rhs);
    case '_gte':
      return typeof lhs === 'number' && typeof rhs === 'number' ? lhs >= rhs : String(lhs) >= String(rhs);
    case '_lt':
      return typeof lhs === 'number' && typeof rhs === 'number' ? lhs < rhs : String(lhs) < String(rhs);
    case '_lte':
      return typeof lhs === 'number' && typeof rhs === 'number' ? lhs <= rhs : String(lhs) <= String(rhs);
    case '_contains':
      return typeof lhs === 'string' && typeof rhs === 'string' && lhs.toLowerCase().includes(rhs.toLowerCase());
    case '_starts_with':
      return typeof lhs === 'string' && typeof rhs === 'string' && lhs.toLowerCase().startsWith(rhs.toLowerCase());
    case '_ends_with':
      return typeof lhs === 'string' && typeof rhs === 'string' && lhs.toLowerCase().endsWith(rhs.toLowerCase());
    case '_between': {
      if (!Array.isArray(rhs) || rhs.length !== 2) return false;
      const [lo, hi] = rhs as [number, number];
      return typeof lhs === 'number' && lhs >= lo && lhs <= hi;
    }
    default:
      return false;
  }
}

/** ---------- Field mask helpers ---------- */

/**
 * Resolve the effective field whitelist from a permissions row's `fields`
 * array. Supports `["*"]` (all) and `-prefix` exclusions.
 */
export function applyFieldMask(allFieldNames: string[], whitelist: string[]): string[] {
  if (whitelist.length === 0) return [];
  const excludes = whitelist.filter((f) => f.startsWith('-')).map((f) => f.slice(1));
  const includes = whitelist.filter((f) => !f.startsWith('-'));
  const base = includes.includes('*') ? allFieldNames : includes;
  return base.filter((f) => !excludes.includes(f));
}

/** Apply a whitelist to an item by mutating `data` in place. */
export function maskItemData<T extends { data?: Record<string, unknown> }>(
  item: T,
  effectiveFields: string[],
): T {
  if (!item.data) return item;
  const allowed = new Set(effectiveFields);
  const next: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(item.data)) {
    if (allowed.has(k)) next[k] = v;
  }
  item.data = next;
  return item;
}
