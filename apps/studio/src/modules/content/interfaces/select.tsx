import { readOptions, type InterfaceComponent } from './types';

interface Choice {
  value: string;
  text?: string;
}

interface SelectOptions {
  choices?: Choice[];
  allowOther?: boolean;
  placeholder?: string;
}

/** `select-dropdown` — single-choice select bound to `meta.options.choices`. */
export const SelectDropdownInterface: InterfaceComponent<string> = ({
  value,
  field,
  disabled,
  onChange,
}) => {
  const opts = readOptions<SelectOptions>(field);
  const choices = opts.choices ?? [];
  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
      className="w-full rounded-md border bg-background px-2 py-1 text-sm disabled:opacity-50"
    >
      <option value="">{opts.placeholder ?? '— select —'}</option>
      {choices.map((c) => (
        <option key={c.value} value={c.value}>
          {c.text ?? c.value}
        </option>
      ))}
    </select>
  );
};
