import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { History, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { RevisionRow } from '@lumibase/sdk';
import { getApiClient } from '@/lib/api';
import { cn } from '@/lib/cn';

interface RevisionsPanelProps {
  collection: string;
  itemId: string;
  /** Called after a successful revert so the parent can re-hydrate the form. */
  onRevert?: () => void;
}

/**
 * Lists revisions for an item and lets the user revert.
 * The diff viewer (per-field before/after) lands in slice 6; this panel exposes
 * the raw `delta` JSON for now so the user can inspect change history.
 */
export function RevisionsPanel({ collection, itemId, onRevert }: RevisionsPanelProps) {
  const client = getApiClient();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['revisions', collection, itemId],
    queryFn: async () => (await client.items(collection as never).listRevisions(itemId)).data as RevisionRow[],
  });

  const revertMutation = useMutation({
    mutationFn: async (revisionId: string) =>
      (await client.items(collection as never).revertRevision(itemId, revisionId)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', collection, itemId] });
      queryClient.invalidateQueries({ queryKey: ['revisions', collection, itemId] });
      onRevert?.();
    },
  });

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading revisions…</p>;
  }
  if (query.error) {
    return <p className="text-sm text-destructive">Failed to load revisions.</p>;
  }
  const revisions = query.data ?? [];

  if (revisions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
        <History className="h-5 w-5" />
        <p className="text-sm">No revisions yet.</p>
      </div>
    );
  }

  const active = revisions.find((r) => r.id === selected);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[16rem_1fr]">
      <ul className="space-y-1 overflow-y-auto md:max-h-[60vh]">
        {revisions.map((rev) => (
          <li key={rev.id}>
            <button
              type="button"
              onClick={() => setSelected(rev.id)}
              className={cn(
                'w-full rounded-md border px-2 py-1.5 text-left text-xs',
                selected === rev.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono">{rev.id.slice(0, 8)}…</span>
                <span className="text-muted-foreground">
                  {new Date(rev.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                by {rev.userId ? rev.userId.slice(0, 8) + '…' : 'system'}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        {!active ? (
          <p className="text-sm text-muted-foreground">Select a revision to inspect.</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Revision {active.id.slice(0, 8)}…</h3>
              <button
                type="button"
                onClick={() => revertMutation.mutate(active.id)}
                disabled={revertMutation.isPending}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {revertMutation.isPending ? 'Reverting…' : 'Revert to this'}
              </button>
            </div>
            {revertMutation.error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                Revert failed.
              </div>
            )}
            <pre className="max-h-[50vh] overflow-auto rounded-md border bg-muted/20 p-3 text-xs">
{JSON.stringify(active.delta, null, 2)}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
