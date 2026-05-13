import { AppShell } from './components/app-shell';
import { ContentPlaceholder } from './modules/content/placeholder';

/**
 * Root component. Routing (TanStack Router) will land in Phase 0.B once the
 * Logto login flow is wired; for now we render the static module shell so
 * `pnpm dev` produces something visible.
 */
export function App() {
  return (
    <AppShell activeModule="content">
      <ContentPlaceholder />
    </AppShell>
  );
}
