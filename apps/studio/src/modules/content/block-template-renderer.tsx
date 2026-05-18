import type { ReactNode } from 'react';
import type {
  BadgeBlock,
  BlockNode,
  ComponentTemplate,
  ImageBlock,
  RowBlock,
  SpacerBlock,
  StackBlock,
  TemplateBlock,
  TextBlock,
} from './block-template-types';

// ---------------------------------------------------------------------------
// Path interpolation
// ---------------------------------------------------------------------------

/**
 * Resolve a value binding against a sample row.
 *
 * Supports:
 *   `$.fieldName`          → sample['fieldName']
 *   `$.field.nested`       → sample['field']['nested']
 *   literal string         → returned as-is
 *
 * Note: `$status_variant` (legacy spec) is treated as a literal.
 */
function resolveBinding(binding: string, sample: Record<string, unknown>): unknown {
  if (binding.startsWith('$.')) {
    return resolvePath(sample, binding.slice(2));
  }
  // Mustache-style interpolation inside literals: `by {{author.full_name}}`
  return binding.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const v = resolvePath(sample, path.trim());
    return v === null || v === undefined ? '' : String(v);
  });
}

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    if (typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

/**
 * Evaluate a simple `if` condition: `$.fieldName` → truthy when the field
 * value is non-null, non-undefined, non-empty, non-zero.
 */
function evalCondition(condition: string, sample: Record<string, unknown>): boolean {
  const v = resolveBinding(condition, sample);
  if (v === null || v === undefined || v === '' || v === false || v === 0) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Tone palette (matches badge.tsx)
// ---------------------------------------------------------------------------

const TONE_CLASS: Record<string, string> = {
  muted: 'bg-muted text-muted-foreground',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  destructive: 'bg-destructive/10 text-destructive',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

// ---------------------------------------------------------------------------
// Size map for Image
// ---------------------------------------------------------------------------

const IMAGE_SIZE: Record<string, number> = {
  xs: 16,
  sm: 24,
  md: 40,
  lg: 64,
};

function resolveImageSize(size: ImageBlock['size']): number {
  if (typeof size === 'number') return size;
  return IMAGE_SIZE[size ?? 'sm'] ?? 24;
}

// ---------------------------------------------------------------------------
// Individual block renderers
// ---------------------------------------------------------------------------

const VARIANT_CLASS: Record<string, string> = {
  title: 'font-semibold text-sm leading-tight',
  subtitle: 'font-medium text-xs text-muted-foreground',
  body: 'text-sm',
  caption: 'text-[11px] text-muted-foreground',
  mono: 'font-mono text-xs',
};

function renderText(block: TextBlock, sample: Record<string, unknown>): ReactNode {
  const value = resolveBinding(block.value, sample);
  const text = value === null || value === undefined ? '' : String(value);
  const cls = [
    VARIANT_CLASS[block.variant ?? 'body'] ?? VARIANT_CLASS.body,
    block.muted ? 'text-muted-foreground' : '',
  ]
    .filter(Boolean)
    .join(' ');
  if (!text) return <span className="text-muted-foreground italic text-[11px]">—</span>;
  return <span className={cls}>{text}</span>;
}

function renderImage(block: ImageBlock, sample: Record<string, unknown>): ReactNode {
  const src = resolveBinding(block.src, sample);
  const size = resolveImageSize(block.size);
  const altRaw = block.alt ? resolveBinding(block.alt, sample) : '(image)';
  const alt = altRaw === null || altRaw === undefined ? '(image)' : String(altRaw);
  if (!src) return <span className="text-muted-foreground">—</span>;
  return (
    <img
      src={String(src)}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={`inline-block object-cover ${block.rounded ? 'rounded-full' : 'rounded'}`}
      style={{ width: size, height: size }}
    />
  );
}

function renderBadge(block: BadgeBlock, sample: Record<string, unknown>): ReactNode {
  const raw = resolveBinding(block.value, sample);
  if (raw === null || raw === undefined || raw === '')
    return <span className="text-muted-foreground">—</span>;
  const label = String(raw);
  const tone = block.tones?.[label] ?? 'muted';
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${TONE_CLASS[tone] ?? TONE_CLASS.muted}`}
    >
      {label}
    </span>
  );
}

function renderSpacer(block: SpacerBlock): ReactNode {
  return <div style={{ width: block.size ?? 8, height: block.size ?? 8, flexShrink: 0 }} />;
}

const ALIGN_ROW: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  between: 'justify-between items-center',
};

function renderStack(
  block: StackBlock,
  sample: Record<string, unknown>,
  depth: number,
): ReactNode {
  const dir = block.direction === 'row' ? 'flex-row' : 'flex-col';
  const align = ALIGN_ROW[block.align ?? 'start'] ?? '';
  return (
    <div
      className={`flex ${dir} ${align}`}
      style={{ gap: block.gap ?? 4 }}
    >
      {(block.children ?? []).map((child, i) => (
        <span key={i}>{renderTemplateBlock(child, sample, depth + 1)}</span>
      ))}
    </div>
  );
}

function renderRow(block: RowBlock, sample: Record<string, unknown>, depth: number): ReactNode {
  const align = block.align === 'between'
    ? 'justify-between items-center'
    : `items-${block.align ?? 'center'}`;
  return (
    <div className={`flex flex-row ${align}`} style={{ gap: block.gap ?? 8 }}>
      {(block.children ?? []).map((child, i) => (
        <span key={i}>{renderTemplateBlock(child, sample, depth + 1)}</span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Core dispatch
// ---------------------------------------------------------------------------

function renderBlock(
  node: BlockNode,
  sample: Record<string, unknown>,
  depth: number,
): ReactNode {
  switch (node.type) {
    case 'Text':
      return renderText(node, sample);
    case 'Image':
      return renderImage(node, sample);
    case 'Badge':
      return renderBadge(node, sample);
    case 'Spacer':
      return renderSpacer(node);
    case 'Stack':
      return renderStack(node, sample, depth);
    case 'Row':
      return renderRow(node, sample, depth);
    default:
      return null;
  }
}

function renderTemplateBlock(
  entry: TemplateBlock,
  sample: Record<string, unknown>,
  depth: number,
): ReactNode {
  if (entry.if && !evalCondition(entry.if, sample)) return null;
  return renderBlock(entry.render, sample, depth);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

interface BlockTemplateRendererProps {
  template: ComponentTemplate;
  /** Sample row — field names → values. */
  sample?: Record<string, unknown>;
  className?: string;
}

/**
 * Pure client-side renderer for a ComponentTemplate DSL.
 *
 * Used by:
 * 1. `BlockTemplateEditor` preview tab.
 * 2. `displays/component-template.tsx` runtime display in list cells.
 */
export function BlockTemplateRenderer({
  template,
  sample = {},
  className,
}: BlockTemplateRendererProps) {
  if (!template?.template?.length) {
    return <span className="text-muted-foreground italic text-xs">Empty template</span>;
  }
  return (
    <span className={`inline-flex flex-col gap-0.5 ${className ?? ''}`}>
      {template.template.map((entry, i) => (
        <span key={i}>{renderTemplateBlock(entry, sample, 0)}</span>
      ))}
    </span>
  );
}
