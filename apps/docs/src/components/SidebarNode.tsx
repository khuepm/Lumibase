import { useState } from 'react';
import { ChevronRight, FileText, Folder } from 'lucide-react';
import type { DocNode } from 'virtual:docs-registry';

interface SidebarNodeProps {
  node: DocNode;
  activeSlug: string;
  onNavigate: (slug: string) => void;
  level: number;
}

/**
 * Recursive tree node for the sidebar navigation.
 * Renders directories as collapsible groups and files as clickable links.
 *
 * Requirements: 3.1, 3.4
 */
export function SidebarNode({ node, activeSlug, onNavigate, level }: SidebarNodeProps) {
  const [expanded, setExpanded] = useState(true);

  if (node.type === 'directory') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          aria-expanded={expanded}
        >
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ${expanded ? 'rotate-90' : ''
              }`}
          />
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{node.name}</span>
        </button>

        {expanded && node.children && (
          <div>
            {node.children.map((child) => (
              <SidebarNode
                key={child.type === 'file' ? child.slug : child.name}
                node={child}
                activeSlug={activeSlug}
                onNavigate={onNavigate}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  const isActive = node.slug === activeSlug;

  return (
    <button
      type="button"
      onClick={() => node.slug && onNavigate(node.slug)}
      className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors ${isActive
          ? 'bg-accent font-medium text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }`}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
      aria-current={isActive ? 'page' : undefined}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}
