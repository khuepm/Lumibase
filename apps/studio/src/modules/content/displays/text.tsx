import { readDisplayOptions, type DisplayComponent } from './types';

interface TextDisplayOptions {
  truncate?: number;
  fallback?: string;
}

/** `text` — default display: stringify + truncate. */
export const TextDisplay: DisplayComponent<unknown> = ({ value, field }) => {
  const opts = readDisplayOptions<TextDisplayOptions>(field);
  const fallback = opts.fallback ?? '—';
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">{fallback}</span>;
  const max = opts.truncate ?? 60;
  let s: string;
  if (typeof value === 'string') s = value;
  else if (typeof value === 'number' || typeof value === 'boolean') s = String(value);
  else {
    try {
      s = JSON.stringify(value);
    } catch {
      s = '[object]';
    }
  }
  return <>{s.length > max ? s.slice(0, max) + '…' : s}</>;
};
