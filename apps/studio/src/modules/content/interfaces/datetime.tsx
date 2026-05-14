import { readOptions, type InterfaceComponent } from './types';

interface DateOptions {
  /** `date` (YYYY-MM-DD), `datetime-local` (default), or `time`. */
  variant?: 'date' | 'datetime-local' | 'time';
}

/**
 * `datetime` — wraps a native HTML date/time input.
 * Stores values as ISO strings (datetime-local without seconds is fine for now).
 */
export const DatetimeInterface: InterfaceComponent<string> = ({
  value,
  field,
  disabled,
  onChange,
}) => {
  const opts = readOptions<DateOptions>(field);
  const variant = opts.variant ?? 'datetime-local';
  return (
    <input
      type={variant}
      value={toInputValue(value, variant)}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
      className="w-full rounded-md border bg-background px-2 py-1 text-sm disabled:opacity-50"
    />
  );
};

function toInputValue(raw: string | null | undefined, variant: DateOptions['variant']): string {
  if (!raw) return '';
  // Accept either ISO with timezone (server) or already a local form (client).
  if (variant === 'datetime-local') {
    // Strip seconds + Z so HTML input accepts the value.
    return raw.length >= 16 ? raw.slice(0, 16) : raw;
  }
  return raw;
}
