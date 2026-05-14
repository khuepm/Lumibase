import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

/**
 * App layout shell with three-column responsive structure.
 *
 * - Left: Sidebar (hidden on mobile <768px, togglable via hamburger)
 * - Center: Content area (renders child routes via Outlet)
 * - Right: Table of Contents panel (visible only on screens >1024px)
 *
 * Requirements: 3.6, 6.2
 */
export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — left column */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Close button for mobile */}
        <div className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <span className="text-sm font-semibold">Navigation</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar content placeholder — will be replaced by Sidebar component in task 5.1 */}
        <nav className="overflow-y-auto p-4">
          <p className="text-sm text-muted-foreground">
            Sidebar navigation will appear here.
          </p>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar with hamburger toggle (mobile only) */}
        <header className="flex h-14 items-center border-b px-4 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 text-sm font-semibold">Lumibase Docs</span>
        </header>

        {/* Content + ToC wrapper */}
        <div className="flex flex-1 overflow-hidden">
          {/* Center column — page content */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>

          {/* Right column — Table of Contents (visible only >1024px) */}
          <aside className="hidden w-56 shrink-0 overflow-y-auto border-l p-4 lg:block">
            {/* ToC placeholder — will be replaced by TableOfContents component in task 8.1 */}
            <p className="text-sm text-muted-foreground">
              Table of Contents will appear here.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
