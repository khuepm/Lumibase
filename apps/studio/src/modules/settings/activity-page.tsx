import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Activity, Clock } from 'lucide-react';
import { getApiClient } from '@/lib/api';

export function ActivityPage() {
  const { t } = useTranslation();
  const client = getApiClient();

  const activityQuery = useQuery({
    queryKey: ['activity'],
    queryFn: async () => (await client.activity.list({ limit: 100 })).data,
  });

  const activityList = activityQuery.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t('activity_log', 'Activity Log')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View a chronological record of all system events.
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground border-b">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">IP / Agent</th>
            </tr>
          </thead>
          <tbody>
            {activityQuery.isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!activityQuery.isLoading && activityList.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No activity recorded yet.</td></tr>
            )}
            {activityList.map((row) => (
              <tr key={row.id} className="border-b hover:bg-muted/10 last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {new Date(row.createdAt).toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">
                  {row.userId || 'System'}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded bg-muted px-2 py-0.5 text-xs text-foreground">
                    {row.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.collection ? (
                    <span className="text-muted-foreground">
                      {row.collection} {row.itemId ? `/ ${row.itemId}` : ''}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {row.ip || '-'}
                  <br />
                  <span className="truncate max-w-[150px] inline-block" title={row.userAgent ?? ''}>
                    {row.userAgent || ''}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
