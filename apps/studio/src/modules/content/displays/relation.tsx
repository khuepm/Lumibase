import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { readDisplayOptions, type DisplayComponent } from './types';

interface RelationDisplayOptions {
  collection?: string;
  displayField?: string;
}

/**
 * `relation` — resolves a single id to its `displayField`.
 * Lazy fetch: only triggers when there's a value, with 30s stale time so
 * scrolling a list doesn't refetch every cell.
 */
export const RelationDisplay: DisplayComponent<string> = ({ value, field }) => {
  const opts = readDisplayOptions<RelationDisplayOptions>(field);
  const client = getApiClient();
  const display = opts.displayField ?? 'id';

  const query = useQuery({
    enabled: !!value && !!opts.collection,
    queryKey: ['relation-display', opts.collection, value, display],
    staleTime: 30_000,
    queryFn: async () => {
      const res = await client.items(opts.collection as never).detail(value as string);
      return res.data;
    },
  });

  if (!value) return <span className="text-muted-foreground">—</span>;
  if (!opts.collection) {
    return (
      <span className="font-mono text-xs text-muted-foreground">
        {String(value).slice(0, 8)}…
      </span>
    );
  }
  if (query.isLoading) {
    return <span className="text-xs text-muted-foreground">Loading…</span>;
  }
  const label = query.data?.data?.[display];
  return (
    <span title={String(value)}>
      {label !== undefined ? String(label) : `${String(value).slice(0, 8)}…`}
    </span>
  );
};
