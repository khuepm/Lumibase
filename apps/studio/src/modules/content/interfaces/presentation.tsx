import { Info, Minus } from 'lucide-react';
import { readOptions, type InterfaceComponent } from './types';

interface PresentationOptions {
  variant?: 'divider' | 'notice';
  title?: string;
  text?: string;
  /** Tailwind color token, e.g. `amber`, `emerald`. */
  tone?: 'muted' | 'amber' | 'emerald' | 'destructive';
}

/**
 * `presentation-divider` / `presentation-notice` — read-only layout helpers.
 * No value is stored; the interface ignores `value` and `onChange`.
 */
export const PresentationInterface: InterfaceComponent<unknown> = ({ field }) => {
  const opts = readOptions<PresentationOptions>(field);
  const variant = opts.variant ?? 'divider';

  if (variant === 'divider') {
    return (
      <div className="flex items-center gap-2 py-2 text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span className="text-xs uppercase">{opts.title ?? field.name}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }

  const tones: Record<NonNullable<PresentationOptions['tone']>, string> = {
    muted: 'border-border bg-muted/30 text-muted-foreground',
    amber: 'border-amber-300 bg-amber-50 text-amber-800',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
  };
  const tone = tones[opts.tone ?? 'muted'];

  return (
    <div className={`flex items-start gap-2 rounded-md border p-3 text-sm ${tone}`}>
      <Info className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        {opts.title && <p className="mb-0.5 font-medium">{opts.title}</p>}
        {opts.text && <p className="text-xs leading-relaxed">{opts.text}</p>}
      </div>
    </div>
  );
};
