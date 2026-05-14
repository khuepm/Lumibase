import { useState } from 'react';

const NAME_PATTERN = /^[a-z][a-z0-9_]{0,62}$/;

/**
 * Phase A inspector: only the basic interfaces from the roadmap.
 * Extended interfaces (relations, m2a, translations) land in Phase B.
 */
const INTERFACES: Array<{ id: string; label: string; type: string }> = [
  { id: 'input', label: 'Input (single line)', type: 'string' },
  { id: 'input-multiline', label: 'Input (multiline)', type: 'text' },
  { id: 'toggle', label: 'Toggle', type: 'boolean' },
  { id: 'select-dropdown', label: 'Dropdown', type: 'string' },
  { id: 'datetime', label: 'Date/time', type: 'datetime' },
  { id: 'json-raw', label: 'JSON (raw)', type: 'json' },
];

export interface FieldFormState {
  name: string;
  type: string;
  interface: string;
  required: boolean;
  sortOrder: number;
}

interface FieldInspectorProps {
  state: FieldFormState;
  onCancel: () => void;
  onSubmit: (state: FieldFormState) => void;
  isSubmitting: boolean;
}

export function FieldInspector({ state, onCancel, onSubmit, isSubmitting }: FieldInspectorProps) {
  const [form, setForm] = useState<FieldFormState>(state);
  const valid = NAME_PATTERN.test(form.name);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end bg-black/30">
      <div className="h-full w-full max-w-md overflow-y-auto bg-background p-6 shadow-xl">
        <h3 className="text-lg font-semibold">Field</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure the field's machine name, interface, and behaviour.
        </p>

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Machine name</span>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value.toLowerCase() })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              autoFocus
            />
            {form.name && !valid && (
              <p className="mt-1 text-xs text-destructive">
                Invalid format.
              </p>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Interface</span>
            <select
              value={form.interface}
              onChange={(e) => {
                const iface = INTERFACES.find((i) => i.id === e.target.value);
                setForm({
                  ...form,
                  interface: e.target.value,
                  type: iface?.type ?? form.type,
                });
              }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {INTERFACES.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.required}
              onChange={(e) => setForm({ ...form, required: e.target.checked })}
            />
            <span className="text-sm">Required</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid || isSubmitting}
            onClick={() => onSubmit(form)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
