import type { DocNode } from 'virtual:docs-registry';
import { SidebarNode } from './SidebarNode';

interface SidebarProps {
  tree: DocNode[];
  activeSlug: string;
  onNavigate: (slug: string) => void;
}

/**
 * Sidebar navigation component.
 * Renders the full Doc Tree as a recursive collapsible tree.
 *
 * - Directories render as collapsible groups
 * - Files render as clickable links
 * - Active doc is highlighted based on current route slug
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export function Sidebar({ tree, activeSlug, onNavigate }: SidebarProps) {
  if (tree.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">No documents found.</p>
      </div>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5 p-2" aria-label="Documentation navigation">
      {tree.map((node) => (
        <SidebarNode
          key={node.type === 'file' ? node.slug : node.name}
          node={node}
          activeSlug={activeSlug}
          onNavigate={onNavigate}
          level={0}
        />
      ))}
    </nav>
  );
}
