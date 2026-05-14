import { useQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { getApiClient } from '@/lib/api';
import { readOptions, type InterfaceComponent } from './types';

interface RelationManyOptions {
  collection?: string;
  displayField?: string;
}

/**
 * `relation-o2m` / `relation-m2m` — multi-id picker.
 * Stores an array of related ids. Junction-table writes for m2m are handled
 * server-side once the BE relation engine resolves the field.
 */
export const RelationManyInterface: InterfaceComponent<string[]> = ({
  value,
  field,
  disabled,
  onChange,
}) => {
  const opts = readOptions<RelationManyOptions>(field);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const client = getApiClient();
  const collection = opts.collection;
  const display = opts.displayField ?? 'id';
  const ids = Array.isArray(value) ? value : [];

  // Fetch display labels for already-selected ids.
  const labelsQuery = useQuery({
    enabled: !!collection && ids.length > 0,
    queryKey: ['relation-many-labels', collection, ids, display],
    queryFn: async () =>
      client.items(collection as never).list({
        filter: { id: { _in: ids } },
        limit: ids.length,
      }),
  });

  const pickerQuery = useQuery({
    enabled: !!collection && adding,
    queryKey: ['relation-many-picker', collection, search, display],
    queryFn: async () =>
      client.items(collection as never).list({
        limit: 25,
        filter: search
          ? { [display]: { _contains: search } }
          : undefined,
      }),
  });

  if (!collection) {
    return (
      <p className="text-xs text-destructive">
        Missing `meta.options.collection` for relation field.
      </p>
    );
  }

  const labelFor = (id: string) => {
    const row = labelsQuery.data?.data.find((r) => r.id === id);
    return row ? String(row.data?.[display] ?? id) : `${id.slice(0, 6)}…`;
  };

  const add = (id: string) => {
    if (ids.includes(id)) return;
    onChange([...ids, id]);
  };

  const remove = (id: string) => {
    onChange(ids.filter((i) => i !== id));
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1 rounded-md border bg-background px-2 py-1">
        {ids.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs"
          >
            {labelFor(id)}
            {!disabled && (
              <button type="button" onClick={() => remove(id)} aria-label={`Remove ${id}`}>
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </span>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1 rounded border-dashed px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      {adding && (
        <div className="rounded-md border bg-background shadow-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search by ${display}…`}
            className="w-full border-b bg-transparent px-2 py-1 text-xs focus:outline-none"
          />
          <ul className="max-h-48 overflow-y-auto py-1">
            {pickerQuery.isLoading && (
              <li className="px-2 py-1 text-xs text-muted-foreground">Loading…</li>
            )}
            {pickerQuery.data?.data
              .filter((r) => !ids.includes(r.id))
              .map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => add(row.id)}
                    className="w-full px-2 py-1 text-left text-xs hover:bg-accent"
                  >
                    <span className="font-mono text-muted-foreground">
                      {row.id.slice(0, 6)}…
                    </span>
                    <span className="ml-2">{String(row.data?.[display] ?? '—')}</span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};
