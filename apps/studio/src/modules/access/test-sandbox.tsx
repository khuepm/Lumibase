import { useMutation, useQuery } from '@tanstack/react-query';
import { FlaskConical, Play, ShieldCheck, ShieldX } from 'lucide-react';
import { useState } from 'react';
import type { PermissionAction, PermissionCheckResult, CollectionResource } from '@lumibase/sdk';
import { getApiClient } from '@/lib/api';
import { cn } from '@/lib/cn';
import { AccessLayout } from './index';

const ACTIONS: PermissionAction[] = ['create', 'read', 'update', 'delete', 'share'];

/**
 * Access Control › Test Sandbox
 *
 * POST /permissions/check with selected collection + action + optional item JSON.
 * Displays verdict: allowed / denied, fields, rule, presets.
 */
export function TestSandboxPage() {
  const client = getApiClient();

  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: async () => (await client.schema.listCollections()).data as CollectionResource[],
  });

  const [collection, setCollection] = useState('');
  const [action, setAction] = useState<PermissionAction>('read');
  const [itemJson, setItemJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [result, setResult] = useState<PermissionCheckResult | null>(null);

  const checkMutation = useMutation({
    mutationFn: async () => {
      let item: Record<string, unknown> | undefined;
      if (itemJson.trim()) {
        try {
          item = JSON.parse(itemJson);
        } catch {
          setJsonError('Invalid JSON');
          throw new Error('invalid json');
        }
      }
      setJsonError(null);
      const res = await client.access.permissions.check(collection, action, item);
      return res.data as PermissionCheckResult;
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <AccessLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Permission Sandbox</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Test whether the current user can perform an action on a collection, and optionally supply an
          item snapshot for row-level rule evaluation.
        </p>

        <div className="rounded-xl border bg-background p-6 shadow-sm space-y-4">
          {/* Collection */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Collection</label>
            <select
              id="sandbox-collection"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              className="w-full rounded-md border bg-muted/20 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select collection…</option>
              {(collectionsQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Action</label>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  id={`sandbox-action-${a}`}
                  onClick={() => setAction(a)}
                  className={cn(
                    'rounded-md border px-3 py-1 text-xs font-medium transition',
                    action === a
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Item JSON */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Item snapshot <span className="text-muted-foreground/60">(optional — for row-level rules)</span>
            </label>
            <textarea
              id="sandbox-item-json"
              value={itemJson}
              onChange={(e) => setItemJson(e.target.value)}
              rows={5}
              placeholder={'{\n  "status": "published",\n  "user_created": "abc-123"\n}'}
              className={cn(
                'w-full rounded-md border bg-muted/20 px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-primary',
                jsonError && 'border-destructive',
              )}
            />
            {jsonError && <p className="mt-1 text-xs text-destructive">{jsonError}</p>}
          </div>

          <button
            type="button"
            id="sandbox-run-btn"
            onClick={() => checkMutation.mutate()}
            disabled={!collection || checkMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {checkMutation.isPending ? 'Checking…' : 'Run check'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={cn(
              'rounded-xl border p-5 shadow-sm',
              result.allowed
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-destructive/20 bg-destructive/5',
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              {result.allowed
                ? <ShieldCheck className="h-5 w-5 text-emerald-600" />
                : <ShieldX className="h-5 w-5 text-destructive" />}
              <span
                className={cn(
                  'text-base font-semibold',
                  result.allowed ? 'text-emerald-700' : 'text-destructive',
                )}
              >
                {result.allowed ? 'Access GRANTED' : 'Access DENIED'}
              </span>
              {result.reason && (
                <span className="ml-auto rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  {result.reason}
                </span>
              )}
            </div>

            <dl className="space-y-2 text-sm">
              <ResultRow label="Fields">
                <span className="font-mono text-xs">
                  {result.fields?.length ? result.fields.join(', ') : '—'}
                </span>
              </ResultRow>
              {result.rule && (
                <ResultRow label="Row rule">
                  <pre className="overflow-x-auto rounded bg-muted/40 p-2 text-[11px]">
                    {JSON.stringify(result.rule, null, 2)}
                  </pre>
                </ResultRow>
              )}
              {result.presets && Object.keys(result.presets).length > 0 && (
                <ResultRow label="Presets">
                  <pre className="overflow-x-auto rounded bg-muted/40 p-2 text-[11px]">
                    {JSON.stringify(result.presets, null, 2)}
                  </pre>
                </ResultRow>
              )}
            </dl>
          </div>
        )}

        {checkMutation.error && !(checkMutation.error as Error).message.includes('invalid json') && (
          <p className="text-sm text-destructive">Check failed. Make sure the API is reachable.</p>
        )}
      </div>
    </AccessLayout>
  );
}

function ResultRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-0.5 text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
