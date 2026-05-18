/**
 * Component DSL types for Display Template block builder.
 *
 * Schema mirrors `docs/features/display-templates.md §1.2`.
 * The `kind: "component-template"` sentinel lets the loader distinguish
 * a block template from a plain mustache string stored in
 * `collections.displayTemplate`.
 *
 * Phase F — FE Display Template Editor block builder.
 */

// ---------------------------------------------------------------------------
// Primitive block nodes
// ---------------------------------------------------------------------------

export interface TextBlock {
  type: 'Text';
  /** Field path `$.fieldName` or a literal string. */
  value: string;
  /** Typography variant. */
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'mono';
  /** Apply muted foreground colour. */
  muted?: boolean;
}

export interface ImageBlock {
  type: 'Image';
  /** Field path `$.fieldName.url` or a literal URL. */
  src: string;
  /** Pixel size for width & height (square). Defaults to 32. */
  size?: number | 'xs' | 'sm' | 'md' | 'lg';
  /** Circular thumbnail. */
  rounded?: boolean;
  /** Alt text or field path. */
  alt?: string;
}

export interface BadgeBlock {
  type: 'Badge';
  /** Field path or literal. */
  value: string;
  /** Value-to-tone map. Same palette as displays/badge.tsx. */
  tones?: Record<string, 'muted' | 'emerald' | 'amber' | 'sky' | 'destructive' | 'violet'>;
}

export interface SpacerBlock {
  type: 'Spacer';
  /** Gap size in px. Defaults to 8. */
  size?: number;
}

// ---------------------------------------------------------------------------
// Container block nodes (may nest children)
// ---------------------------------------------------------------------------

export interface StackBlock {
  type: 'Stack';
  direction?: 'col' | 'row';
  gap?: number;
  align?: 'start' | 'center' | 'end';
  children?: TemplateBlock[];
}

export interface RowBlock {
  type: 'Row';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'between';
  children?: TemplateBlock[];
}

// ---------------------------------------------------------------------------
// Union
// ---------------------------------------------------------------------------

export type BlockNode =
  | TextBlock
  | ImageBlock
  | BadgeBlock
  | SpacerBlock
  | StackBlock
  | RowBlock;

export type BlockType = BlockNode['type'];

/**
 * A single entry in the template array. The optional `if` field is a
 * simple dot-path condition: `$.fieldName` evaluates truthy when the
 * sample row has a non-null value for that field.
 */
export interface TemplateBlock {
  /** JSONata-lite condition: `$.fieldName`. Block is hidden when falsy. */
  if?: string;
  render: BlockNode;
}

/** Root component template document. */
export interface ComponentTemplate {
  kind: 'component-template';
  template: TemplateBlock[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const BLOCK_TYPES: BlockType[] = [
  'Text',
  'Image',
  'Badge',
  'Spacer',
  'Stack',
  'Row',
];

export const CONTAINER_TYPES: BlockType[] = ['Stack', 'Row'];

/** Default empty node for each block type. */
export function defaultBlock(type: BlockType): BlockNode {
  switch (type) {
    case 'Text':
      return { type: 'Text', value: '$.title', variant: 'body' };
    case 'Image':
      return { type: 'Image', src: '$.image.url', size: 'sm', rounded: false };
    case 'Badge':
      return { type: 'Badge', value: '$.status' };
    case 'Spacer':
      return { type: 'Spacer', size: 8 };
    case 'Stack':
      return { type: 'Stack', direction: 'col', gap: 4, children: [] };
    case 'Row':
      return { type: 'Row', gap: 8, align: 'center', children: [] };
  }
}

/** A starter template with a title text block. */
export function emptyComponentTemplate(): ComponentTemplate {
  return {
    kind: 'component-template',
    template: [
      { render: { type: 'Text', value: '$.title', variant: 'title' } },
    ],
  };
}

/**
 * Parse a raw string stored in `collections.displayTemplate`.
 * Returns null when it is a mustache string or unparseable.
 */
export function parseComponentTemplate(raw: string | null | undefined): ComponentTemplate | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as unknown;
    if (
      typeof obj === 'object' &&
      obj !== null &&
      (obj as Record<string, unknown>)['kind'] === 'component-template'
    ) {
      return obj as ComponentTemplate;
    }
  } catch {
    // not JSON — it's a mustache string
  }
  return null;
}

/** Serialise a ComponentTemplate back to the string stored on the server. */
export function serializeComponentTemplate(ct: ComponentTemplate): string {
  return JSON.stringify(ct, null, 2);
}
