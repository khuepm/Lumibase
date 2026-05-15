import type { DisplayComponent } from './types';

const HEX_RE = /^#?[0-9a-fA-F]{3,8}$/;

/** `color-swatch` — small color square + hex label. */
export const ColorSwatchDisplay: DisplayComponent<string> = ({ value }) => {
  if (!value || !HEX_RE.test(value)) return <span className="text-muted-foreground">—</span>;
  const hex = value.startsWith('#') ? value : `#${value}`;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3.5 w-3.5 rounded border"
        style={{ backgroundColor: hex }}
      />
      <span className="font-mono text-xs">{hex}</span>
    </span>
  );
};
