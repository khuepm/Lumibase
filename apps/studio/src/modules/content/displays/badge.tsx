import { cn } from '@/lib/cn';
import { readDisplayOptions, type DisplayComponent } from './types';

interface BadgeDisplayOptions {
  /** Map value -> tailwind tone token. Falls back to `muted`. */
  tones?: Record<string, 'muted' | 'emerald' | 'amber' | 'sky' | 'destructive' | 'violet'>;
}

const TONE_CLASS: Record<string, string> = {
  muted: 'bg-muted text-muted-foreground',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  sky: 'bg-sky-100 text-sky-700',
  destructive: 'bg-destructive/10 text-destructive',
  violet: 'bg-violet-100 text-violet-700',
};

/** `badge` — colored pill keyed by `meta.display.options.tones`. */
export const BadgeDisplay: DisplayComponent<string> = ({ value, field }) => {
  if (value === null || value === undefined || value === '')
    return <span className="text-muted-foreground">—</span>;
  const opts = readDisplayOptions<BadgeDisplayOptions>(field);
  const tone = opts.tones?.[String(value)] ?? 'muted';
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[10px] uppercase',
        TONE_CLASS[tone] ?? TONE_CLASS.muted,
      )}
    >
      {String(value)}
    </span>
  );
};
