import { useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { docTree } from 'virtual:docs-registry';
import { Sidebar } from './Sidebar';
import { SearchDialog } from './SearchDialog';
import { TableOfContents } from './TableOfContents';

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
  const contentRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract the active slug from the current route path
  // Route pattern is /docs/:slug* so we strip the /docs/ prefix
  const activeSlug = location.pathname.startsWith('/docs/')
    ? location.pathname.slice('/docs/'.length)
    : '';

  const handleNavigate = (slug: string) => {
    navigate(`/docs/${slug}`);
    // Close sidebar on mobile after navigation
    setSidebarOpen(false);
  };

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

        {/* Sidebar navigation tree */}
        <div className="overflow-y-auto h-full">
          <Sidebar
            tree={docTree}
            activeSlug={activeSlug}
            onNavigate={handleNavigate}
          />
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar with hamburger toggle (mobile) and search (all screens) */}
        <header className="flex h-14 items-center border-b px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 text-sm font-semibold md:hidden">Lumibase Docs</span>
          <span className="hidden text-sm font-semibold md:inline">Lumibase Docs</span>
          <div className="ml-auto">
            <SearchDialog />
          </div>
        </header>

        {/* Content + ToC wrapper */}
        <div className="flex flex-1 overflow-hidden">
          {/* Center column — page content */}
          <main ref={contentRef} className="flex-1 overflow-y-auto">
            <Outlet />
          </main>

          {/* Right column — Table of Contents (visible only >1024px) */}
          <aside className="hidden w-56 shrink-0 overflow-y-auto border-l p-4 lg:block">
            <div className="sticky top-4">
              <TableOfContents contentRef={contentRef} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
