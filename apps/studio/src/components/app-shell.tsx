import { Link, useRouterState } from '@tanstack/react-router';
import {
  Database,
  FileText,
  Layers,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ModuleDef {
  id: string;
  label: string;
  icon: typeof FileText;
  to: string;
  /** Path prefix used to detect the active module. Defaults to `to`. */
  prefix?: string;
}

const MODULES: ModuleDef[] = [
  { id: 'content',    label: 'Content',    icon: FileText,    to: '/' },
  { id: 'files',      label: 'Files',      icon: Layers,      to: '/' },
  { id: 'users',      label: 'Users',      icon: Users,       to: '/' },
  { id: 'access',     label: 'Access',     icon: ShieldCheck, to: '/access/roles', prefix: '/access' },
  { id: 'data-model', label: 'Data model', icon: Database,    to: '/data-model',   prefix: '/data-model' },
  { id: 'settings',   label: 'Settings',   icon: Settings,    to: '/' },
];

interface AppShellProps {
  children: ReactNode;
}

/**
 * Top-level chrome: left module bar + top bar + content slot.
 * Active module is derived from the current router location.
 */
export function AppShell({ children }: AppShellProps) {
  const { location } = useRouterState();

  const activeModule = (() => {
    for (const m of MODULES) {
      const prefix = m.prefix ?? m.to;
      if (prefix !== '/' && location.pathname.startsWith(prefix)) return m.id;
    }
    return 'content';
  })();

  return (
    <div className="flex h-screen w-screen">
      <aside className="flex w-16 flex-col items-center gap-2 border-r bg-muted/30 py-4">
        {MODULES.map(({ id, label, icon: Icon, to }) => (
          <Link
            key={id}
            to={to}
            title={label}
            aria-label={label}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-md transition',
              activeModule === id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            <Icon className="h-5 w-5" />
          </Link>
        ))}
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">LumiBase Studio</span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              dev
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Phase C — Permissions &amp; Access
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
