import { readDisplayOptions, type DisplayComponent } from './types';

interface DateDisplayOptions {
  /** `relative` (default), `short`, or `iso`. */
  format?: 'relative' | 'short' | 'iso';
}

const RELATIVE_THRESHOLDS: { ms: number; unit: Intl.RelativeTimeFormatUnit; div: number }[] = [
  { ms: 60_000, unit: 'second', div: 1_000 },
  { ms: 3_600_000, unit: 'minute', div: 60_000 },
  { ms: 86_400_000, unit: 'hour', div: 3_600_000 },
  { ms: 30 * 86_400_000, unit: 'day', div: 86_400_000 },
  { ms: 365 * 86_400_000, unit: 'month', div: 30 * 86_400_000 },
];

/** `formatted-date` — relative ("3h ago"), short ("May 3, 2026"), or ISO. */
export const FormattedDateDisplay: DisplayComponent<string> = ({ value, field }) => {
  const opts = readDisplayOptions<DateDisplayOptions>(field);
  if (!value) return <span className="text-muted-foreground">—</span>;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span className="text-destructive">invalid</span>;
  const fmt = opts.format ?? 'relative';
  if (fmt === 'iso') return <>{date.toISOString()}</>;
  if (fmt === 'short')
    return <>{date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</>;
  return <>{relative(date)}</>;
};

function relative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const sign = diff >= 0 ? -1 : 1;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const t of RELATIVE_THRESHOLDS) {
    if (abs < t.ms) return rtf.format(sign * Math.round(abs / t.div), t.unit);
  }
  return rtf.format(sign * Math.round(abs / (365 * 86_400_000)), 'year');
}
