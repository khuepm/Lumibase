import { useQuery } from '@tanstack/react-query';

interface HealthResponse {
  status: string;
  env: string;
  ts: string;
}

/**
 * Smoke-test view that talks to `/api/v1/utils/health`. Confirms the Vite
 * dev proxy + Hono Worker are wired end-to-end during Phase 0 bring-up.
 */
export function ContentPlaceholder() {
  const { data, isLoading, error } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/api/v1/utils/health');
      if (!res.ok) throw new Error(`health ${res.status}`);
      return res.json();
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Welcome to LumiBase</h1>
      <p className="text-sm text-muted-foreground">
        Studio shell renders. Next milestones: Logto login → site switcher →
        Data Model module. See <code>docs/roadmap/tasks.md</code>.
      </p>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 text-sm font-medium">API connectivity</h2>
        {isLoading && <p className="text-sm text-muted-foreground">Pinging /api/v1/utils/health…</p>}
        {error && (
          <p className="text-sm text-destructive">
            Cannot reach the API. Start it with <code>pnpm --filter @lumibase/cms dev</code>.
          </p>
        )}
        {data && (
          <pre className="rounded bg-muted p-3 text-xs">
{JSON.stringify(data, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}
