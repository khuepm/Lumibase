import Editor from '@monaco-editor/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getApiClient } from '@/lib/api';

interface RawJsonTabProps {
  collectionName: string;
}

/**
 * Live JSON pane (Monaco) for the collection schema. Two-way sync:
 *  - Loads compiled schema on mount.
 *  - Diff preview + apply via PUT /collections/:name/schema.
 */
export function RawJsonTab({ collectionName }: RawJsonTabProps) {
  const client = getApiClient();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string>('');
  const [diff, setDiff] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const compiledQuery = useQuery({
    queryKey: ['compiled', collectionName],
    queryFn: async () => {
      const res = await client.request<unknown>(
        `/api/v1/collections/${collectionName}/compiled`,
      );
      return res.data;
    },
  });

  // Sync draft when query data changes (replaces removed onSuccess in TanStack Query v5).
  if (compiledQuery.data && !draft) {
    setDraft(JSON.stringify(compiledQuery.data, null, 2));
  }

  const diffMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(draft);
      } catch (e) {
        throw new Error('Invalid JSON: ' + (e as Error).message);
      }
      const res = await client.schema.diff(collectionName, parsed);
      return res.data;
    },
    onSuccess: (data) => setDiff(data),
    onError: (e) => setError((e as Error).message),
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const parsed = JSON.parse(draft);
      const res = await client.schema.apply(collectionName, parsed);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection', collectionName] });
      queryClient.invalidateQueries({ queryKey: ['fields', collectionName] });
      queryClient.invalidateQueries({ queryKey: ['compiled', collectionName] });
      setDiff(null);
    },
    onError: (e) => setError((e as Error).message),
  });

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border">
        <Editor
          height="420px"
          defaultLanguage="json"
          value={draft}
          onChange={(v) => setDraft(v ?? '')}
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => diffMutation.mutate()}
          disabled={diffMutation.isPending}
          className="rounded-md border px-3 py-1.5 text-xs"
        >
          {diffMutation.isPending ? 'Computing…' : 'Preview diff'}
        </button>
        <button
          type="button"
          onClick={() => applyMutation.mutate()}
          disabled={applyMutation.isPending || !diff}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {applyMutation.isPending ? 'Applying…' : 'Apply changes'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {diff !== null && (
        <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">
{JSON.stringify(diff, null, 2)}
        </pre>
      )}
    </div>
  );
}
