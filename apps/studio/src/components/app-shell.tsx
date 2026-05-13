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
}

const MODULES: ModuleDef[] = [
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'files', label: 'Files', icon: Layers },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'access', label: 'Access', icon: ShieldCheck },
  { id: 'data-model', label: 'Data model', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface AppShellProps {
  activeModule: string;
  children: ReactNode;
}

/**
 * Top-level chrome: left module bar + top bar + content slot.
 * Routing + presence land in subsequent tasks.
 */
export function AppShell({ activeModule, children }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen">
      <aside className="flex w-16 flex-col items-center gap-2 border-r bg-muted/30 py-4">
        {MODULES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
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
          </button>
        ))}
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">LumiBase Studio</span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              dev
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Phase 0 skeleton — login &amp; routing land next.
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
