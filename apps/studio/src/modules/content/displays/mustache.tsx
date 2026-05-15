import { readDisplayOptions, type DisplayComponent } from './types';

interface MustacheOptions {
  /** Template string with `{{field}}` placeholders; dotted paths supported. */
  template?: string;
  /** Shown when template is missing or every placeholder is empty. */
  fallback?: string;
  /** Truncate the final rendered string to N chars. */
  truncate?: number;
}

const PLACEHOLDER = /\{\{\s*([\w.-]+)\s*\}\}/g;

/**
 * `mustache` — renders a small template over the current row.
 *
 * Intentionally minimal: only `{{path.to.value}}` substitution, no helpers,
 * sections, or partials. Authors who need richer templating can register a
 * custom display later without changing the registry shape.
 *
 * Falls back to the bare `value` when no template is configured so the
 * display is safe to assign even before a template has been authored.
 */
export const MustacheDisplay: DisplayComponent<unknown> = ({ value, field, row }) => {
  const opts = readDisplayOptions<MustacheOptions>(field);
  const source = row ?? {};

  if (!opts.template) {
    if (value === null || value === undefined || value === '')
      return <span className="text-muted-foreground">{opts.fallback ?? '—'}</span>;
    return <>{String(value)}</>;
  }

  let hadValue = false;
  const rendered = opts.template.replace(PLACEHOLDER, (_m, path) => {
    const resolved = resolvePath(source, path);
    if (resolved === null || resolved === undefined || resolved === '') return '';
    hadValue = true;
    return String(resolved);
  });

  if (!hadValue) return <span className="text-muted-foreground">{opts.fallback ?? '—'}</span>;
  const out = opts.truncate && rendered.length > opts.truncate
    ? rendered.slice(0, opts.truncate) + '…'
    : rendered;
  return <>{out}</>;
};

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    if (typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}
