import { Link, useRouterState } from '@tanstack/react-router';
import { ShieldCheck, Users, BookLock, FlaskConical } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const ACCESS_TABS = [
  { id: 'roles', label: 'Roles', icon: Users, to: '/access/roles' },
  { id: 'policies', label: 'Policies', icon: BookLock, to: '/access/policies' },
  { id: 'sandbox', label: 'Sandbox', icon: FlaskConical, to: '/access/sandbox' },
] as const;

export function AccessLayout({ children }: { children: ReactNode }) {
  const { location } = useRouterState();

  const activeTab = ACCESS_TABS.find((t) => location.pathname.startsWith(t.to))?.id ?? 'roles';

  return (
    <div className="flex h-full gap-0">
      {/* Sub-sidebar */}
      <nav className="flex w-52 shrink-0 flex-col border-r bg-muted/20 p-2 pt-4">
        <div className="mb-4 flex items-center gap-2 px-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Access Control</span>
        </div>
        <ul className="space-y-0.5">
          {ACCESS_TABS.map(({ id, label, icon: Icon, to }) => (
            <li key={id}>
              <Link
                to={to}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition',
                  activeTab === id
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
