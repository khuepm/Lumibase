import { useEffect, useState } from 'react';
import type { InterfaceComponent } from './types';

/**
 * `json-raw` — JSON textarea fallback.
 * Slice 5 wraps interfaces with a Monaco-backed Raw toggle so this is the
 * universal escape hatch when no smarter editor matches `field.interface`.
 */
export const JsonRawInterface: InterfaceComponent<unknown> = ({
  value,
  disabled,
  onChange,
}) => {
  const [text, setText] = useState(() => stringify(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only re-sync if the parsed JSON differs from current.
    try {
      const parsed = JSON.parse(text);
      if (JSON.stringify(parsed) !== JSON.stringify(value)) setText(stringify(value));
    } catch {
      /* keep editing */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="space-y-1">
      <textarea
        value={text}
        disabled={disabled}
        rows={6}
        onChange={(e) => {
          setText(e.target.value);
          try {
            const parsed = JSON.parse(e.target.value);
            setError(null);
            onChange(parsed);
          } catch (err) {
            setError((err as Error).message);
          }
        }}
        className="w-full rounded-md border bg-background px-2 py-1 font-mono text-xs disabled:opacity-50"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

function stringify(value: unknown): string {
  if (value === undefined || value === null) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}
