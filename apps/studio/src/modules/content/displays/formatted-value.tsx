import { readDisplayOptions, type DisplayComponent } from './types';

interface FormattedValueOptions {
  /** Optional prefix prepended to the rendered value. */
  prefix?: string;
  /** Optional suffix appended to the rendered value. */
  suffix?: string;
  /** Truncate the final string at N characters; appends an ellipsis. */
  truncate?: number;
  /** Force-cast: 'lower', 'upper', 'title'. */
  caseStyle?: 'lower' | 'upper' | 'title';
  /** Shown when value is null/undefined/''. */
  fallback?: string;
  /** When true, formats numbers via `toLocaleString()`. */
  formatNumber?: boolean;
}

/**
 * `formatted-value` — generic, format-aware string renderer.
 *
 * Phase B default for plain text fields. Wraps the underlying value with
 * optional prefix/suffix, applies a case transform, and truncates. Numbers
 * can opt into locale formatting (e.g. `1,234.5`).
 */
export const FormattedValueDisplay: DisplayComponent<unknown> = ({ value, field }) => {
  const opts = readDisplayOptions<FormattedValueOptions>(field);
  const fallback = opts.fallback ?? '—';
  if (value === null || value === undefined || value === '')
    return <span className="text-muted-foreground">{fallback}</span>;

  let s: string;
  if (typeof value === 'number') {
    s = opts.formatNumber ? value.toLocaleString() : String(value);
  } else if (typeof value === 'string' || typeof value === 'boolean') {
    s = String(value);
  } else {
    try {
      s = JSON.stringify(value);
    } catch {
      s = '[object]';
    }
  }

  if (opts.caseStyle === 'lower') s = s.toLowerCase();
  else if (opts.caseStyle === 'upper') s = s.toUpperCase();
  else if (opts.caseStyle === 'title')
    s = s.replace(/\b\w/g, (c) => c.toUpperCase());

  s = `${opts.prefix ?? ''}${s}${opts.suffix ?? ''}`;
  if (opts.truncate && s.length > opts.truncate) s = s.slice(0, opts.truncate) + '…';
  return <>{s}</>;
};
