import { readOptions, type InterfaceComponent } from './types';

interface NumberOptions {
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

/** `input-number` — numeric input. Empty string maps to `null`. */
export const NumberInterface: InterfaceComponent<number> = ({
  value,
  field,
  disabled,
  onChange,
}) => {
  const opts = readOptions<NumberOptions>(field);
  return (
    <input
      type="number"
      value={value === null || value === undefined ? '' : String(value)}
      min={opts.min}
      max={opts.max}
      step={opts.step ?? 'any'}
      placeholder={opts.placeholder}
      disabled={disabled}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') return onChange(null);
        const n = Number(raw);
        if (!Number.isNaN(n)) onChange(n);
      }}
      className="w-full rounded-md border bg-background px-2 py-1 text-sm disabled:opacity-50"
    />
  );
};
