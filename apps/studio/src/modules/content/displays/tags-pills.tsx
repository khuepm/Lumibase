import type { DisplayComponent } from './types';

/** `tags-pills` — compact pill row for `string[]` values. */
export const TagsPillsDisplay: DisplayComponent<string[]> = ({ value }) => {
  if (!Array.isArray(value) || value.length === 0)
    return <span className="text-muted-foreground">—</span>;
  const head = value.slice(0, 3);
  const extra = value.length - head.length;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {head.map((t, i) => (
        <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
          {t}
        </span>
      ))}
      {extra > 0 && <span className="text-[10px] text-muted-foreground">+{extra}</span>}
    </span>
  );
};
