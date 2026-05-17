import { readDisplayOptions, type DisplayComponent } from './types';

interface ImageDisplayOptions {
  /** Square thumbnail size in px. Defaults to 24. */
  size?: number;
  /** When true, renders a circular thumbnail. */
  rounded?: boolean;
  /** Override alt text; falls back to file name or '(image)'. */
  alt?: string;
}

interface FileLike {
  url?: string;
  src?: string;
  name?: string;
}

/**
 * `image` — small thumbnail for file/asset references.
 *
 * Accepts:
 * - a string URL
 * - an object `{ url|src, name? }` (matches the `file` interface payload)
 * - `null/undefined` → em dash
 *
 * Intentionally minimal — no Workers transform pipeline yet (lands in
 * Phase D when `/assets/:id` ships). Direct R2 URLs render as-is.
 */
export const ImageDisplay: DisplayComponent<unknown> = ({ value, field }) => {
  const opts = readDisplayOptions<ImageDisplayOptions>(field);
  const size = opts.size ?? 24;

  const url = resolveUrl(value);
  if (!url) return <span className="text-muted-foreground">—</span>;

  const alt = opts.alt ?? (typeof value === 'object' && value && 'name' in value
    ? String((value as FileLike).name)
    : '(image)');

  return (
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={`inline-block object-cover ${opts.rounded ? 'rounded-full' : 'rounded'}`}
      style={{ width: size, height: size }}
    />
  );
};

function resolveUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const v = value as FileLike;
    return v.url ?? v.src ?? null;
  }
  return null;
}
