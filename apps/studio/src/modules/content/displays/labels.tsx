import { cn } from '@/lib/cn';
import { readDisplayOptions, type DisplayComponent } from './types';

interface LabelsDisplayOptions {
  /**
   * Map raw value -> tailwind tone token. Same palette as `badge`, but
   * applied to *each* element of the array independently.
   */
  tones?: Record<string, 'muted' | 'emerald' | 'amber' | 'sky' | 'destructive' | 'violet'>;
  /** Soft cap: render at most N pills + "+N more". Defaults to 4. */
  max?: number;
}

const TONE_CLASS: Record<string, string> = {
  muted: 'bg-muted text-muted-foreground',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  sky: 'bg-sky-100 text-sky-700',
  destructive: 'bg-destructive/10 text-destructive',
  violet: 'bg-violet-100 text-violet-700',
};

/**
 * `labels` — colored pill row for enum-like array values.
 *
 * Like `tags-pills`, but each element maps to a tone via the same `tones`
 * config used by `badge`. Use `tags-pills` for free-form user tags and
 * `labels` for controlled vocabularies (status, severity, …).
 */
export const LabelsDisplay: DisplayComponent<unknown> = ({ value, field }) => {
  const opts = readDisplayOptions<LabelsDisplayOptions>(field);
  const items = normalize(value);
  if (items.length === 0) return <span className="text-muted-foreground">—</span>;
  const max = opts.max ?? 4;
  const head = items.slice(0, max);
  const extra = items.length - head.length;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {head.map((label, i) => {
        const tone = opts.tones?.[label] ?? 'muted';
        return (
          <span
            key={`${label}-${i}`}
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] uppercase',
              TONE_CLASS[tone] ?? TONE_CLASS.muted,
            )}
          >
            {label}
          </span>
        );
      })}
      {extra > 0 && <span className="text-[10px] text-muted-foreground">+{extra}</span>}
    </span>
  );
};

function normalize(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
}
