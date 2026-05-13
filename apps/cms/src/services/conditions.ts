/**
 * Lightweight conditions evaluator used to drive field visibility/hide/disable
 * based on other field values. Mirrors the Directus-style condition format:
 *
 *   { rule: { status: { _eq: 'published' } }, hidden: false, readonly: true }
 *
 * The evaluator is deliberately small so it can also run in the Studio
 * (re-exported via packages/sdk in Phase B.1).
 */

export type ConditionOp =
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

export interface ConditionRule {
  _and?: ConditionRule[];
  _or?: ConditionRule[];
  [field: string]: { [op in ConditionOp]?: unknown } | ConditionRule[] | undefined;
}

export interface FieldCondition {
  rule: ConditionRule;
  hidden?: boolean;
  readonly?: boolean;
  required?: boolean;
}

export function evaluateRule(rule: ConditionRule, data: Record<string, unknown>): boolean {
  if (rule._and) return rule._and.every((r) => evaluateRule(r, data));
  if (rule._or) return rule._or.some((r) => evaluateRule(r, data));

  for (const [field, expr] of Object.entries(rule)) {
    if (field === '_and' || field === '_or' || !expr || typeof expr !== 'object') continue;
    const value = data[field];
    for (const [op, raw] of Object.entries(expr as Record<string, unknown>)) {
      if (!compareOp(op as ConditionOp, value, raw)) return false;
    }
  }
  return true;
}

function compareOp(op: ConditionOp, value: unknown, raw: unknown): boolean {
  switch (op) {
    case '_eq':
      return value === raw;
    case '_neq':
      return value !== raw;
    case '_in':
      return Array.isArray(raw) && raw.includes(value);
    case '_nin':
      return Array.isArray(raw) && !raw.includes(value);
    case '_gt':
      return (value as number) > (raw as number);
    case '_gte':
      return (value as number) >= (raw as number);
    case '_lt':
      return (value as number) < (raw as number);
    case '_lte':
      return (value as number) <= (raw as number);
    case '_contains':
      return typeof value === 'string' && value.includes(String(raw));
    case '_starts_with':
      return typeof value === 'string' && value.startsWith(String(raw));
    case '_ends_with':
      return typeof value === 'string' && value.endsWith(String(raw));
    case '_null':
      return raw ? value == null : value != null;
    case '_nnull':
      return raw ? value != null : value == null;
    default:
      return false;
  }
}

/**
 * Returns the merged effect map for a list of field conditions, given the
 * current item data. Later rules override earlier ones.
 */
export function applyConditions(
  conditions: FieldCondition[],
  data: Record<string, unknown>,
): { hidden?: boolean; readonly?: boolean; required?: boolean } {
  const out: { hidden?: boolean; readonly?: boolean; required?: boolean } = {};
  for (const cond of conditions) {
    if (!evaluateRule(cond.rule, data)) continue;
    if (cond.hidden !== undefined) out.hidden = cond.hidden;
    if (cond.readonly !== undefined) out.readonly = cond.readonly;
    if (cond.required !== undefined) out.required = cond.required;
  }
  return out;
}
