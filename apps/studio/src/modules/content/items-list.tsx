import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Filter, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FieldResource } from '@lumibase/sdk';
import { getApiClient } from '@/lib/api';
import { cn } from '@/lib/cn';
import { FilterBuilder, compileFilter, type FilterCondition } from './filter-builder';

const PAGE_SIZE = 25;

interface SortState {
  field: string;
  dir: 'asc' | 'desc';
}

/**
 * Content module: tabular items list for a single collection.
 * Wires filter builder + column-header sort + offset paginate against the
 * Phase B `/api/v1/items/:collection` endpoints via the typed SDK.
 */
export function ItemsListPage() {
  const { collection } = useParams({ from: '/content/$collection' });
  const client = getApiClient();

  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<SortState>({ field: 'updated_at', dir: 'desc' });
  const [page, setPage] = useState(0);

  const fieldsQuery = useQuery({
    queryKey: ['fields', collection],
    queryFn: async () => (await client.schema.listFields(collection)).data,
  });

  const filterPayload = useMemo(() => compileFilter(filters), [filters]);

  const itemsQuery = useQuery({
    queryKey: ['items', collection, filterPayload, sort, page],
    queryFn: () =>
      client.items(collection as never).list({
        filter: filterPayload,
        sort: [`${sort.dir === 'desc' ? '-' : ''}${sort.field}`],
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
  });

  const fields = fieldsQuery.data ?? [];
  // Pick at most 5 visible non-hidden fields for the table preview.
  const visibleFields: FieldResource[] = useMemo(
    () => fields.filter((f) => !f.hidden).slice(0, 5),
    [fields],
  );

  const total = itemsQuery.data?.meta?.total ?? 0;
  const rows = itemsQuery.data?.data ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleSort = (field: string) => {
    setPage(0);
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'asc' },
    );
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">
            <Link to="/" className="hover:underline">Content</Link>
            <span className="mx-1">/</span>
            <span>{collection}</span>
          </p>
          <h1 className="text-2xl font-semibold">{collection}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs',
              showFilters && 'bg-accent',
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters {filters.length > 0 && <span className="text-primary">({filters.length})</span>}
          </button>
          <button
            type="button"
            onClick={() => itemsQuery.refetch()}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', itemsQuery.isFetching && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </header>

      {showFilters && (
        <div className="rounded-lg border bg-muted/20 p-3">
          <FilterBuilder
            fields={fields}
            value={filters}
            onChange={(next) => {
              setFilters(next);
              setPage(0);
            }}
          />
        </div>
      )}

      {itemsQuery.error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load items.
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <SortableTh label="id" field="id" sort={sort} onClick={toggleSort} />
              <SortableTh label="status" field="status" sort={sort} onClick={toggleSort} />
              {visibleFields.map((f) => (
                <SortableTh
                  key={f.id}
                  label={f.name}
                  field={f.name}
                  sort={sort}
                  onClick={toggleSort}
                />
              ))}
              <SortableTh label="updated" field="updated_at" sort={sort} onClick={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {itemsQuery.isLoading && (
              <tr><td colSpan={visibleFields.length + 3} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!itemsQuery.isLoading && rows.length === 0 && (
              <tr><td colSpan={visibleFields.length + 3} className="px-4 py-6 text-center text-muted-foreground">No items match.</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-2 font-mono text-xs">
                  <Link
                    to="/content/$collection/$id"
                    params={{ collection, id: row.id }}
                    className="text-primary hover:underline"
                  >
                    {row.id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-4 py-2"><StatusBadge status={row.status} /></td>
                {visibleFields.map((f) => (
                  <td key={f.id} className="px-4 py-2 text-muted-foreground">
                    {renderCell(row.data?.[f.name])}
                  </td>
                ))}
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {new Date(row.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {rows.length > 0
            ? `Showing ${page * PAGE_SIZE + 1}-${page * PAGE_SIZE + rows.length} of ${total}`
            : `0 of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-md border px-2 py-1 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span>{page + 1} / {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= totalPages}
            className="rounded-md border px-2 py-1 disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}

function SortableTh({
  label,
  field,
  sort,
  onClick,
}: {
  label: string;
  field: string;
  sort: SortState;
  onClick: (field: string) => void;
}) {
  const active = sort.field === field;
  return (
    <th className="px-4 py-2 font-medium">
      <button
        type="button"
        onClick={() => onClick(field)}
        className={cn(
          'inline-flex items-center gap-1 hover:text-foreground',
          active && 'text-foreground',
        )}
      >
        {label}
        {active && (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'published'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'archived'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-muted text-muted-foreground';
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-[10px] uppercase', tone)}>
      {status}
    </span>
  );
}

function renderCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value.length > 60 ? value.slice(0, 60) + '…' : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value).slice(0, 60);
  } catch {
    return '[object]';
  }
}
