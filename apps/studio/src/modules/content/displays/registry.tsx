import type { FieldResource } from '@lumibase/sdk';
import { BadgeDisplay } from './badge';
import { BooleanIconDisplay } from './boolean-icon';
import { ColorSwatchDisplay } from './color-swatch';
import { FormattedDateDisplay } from './formatted-date';
import { RatingStarsDisplay } from './rating-stars';
import { RelationDisplay } from './relation';
import { TagsPillsDisplay } from './tags-pills';
import { TextDisplay } from './text';
import type { DisplayComponent } from './types';

/**
 * Display registry — name -> read-only renderer for list cells.
 * Resolution order: `field.meta.display.name` → `field.interface` heuristic
 * → underlying `field.type` → text fallback.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<string, DisplayComponent<any>> = {
  text: TextDisplay,
  badge: BadgeDisplay,
  'boolean-icon': BooleanIconDisplay,
  relation: RelationDisplay,
  'formatted-date': FormattedDateDisplay,
  'color-swatch': ColorSwatchDisplay,
  'rating-stars': RatingStarsDisplay,
  'tags-pills': TagsPillsDisplay,
};

const INTERFACE_TO_DISPLAY: Record<string, string> = {
  toggle: 'boolean-icon',
  boolean: 'boolean-icon',
  'select-dropdown': 'badge',
  datetime: 'formatted-date',
  color: 'color-swatch',
  rating: 'rating-stars',
  tags: 'tags-pills',
  'relation-m2o': 'relation',
};

const TYPE_TO_DISPLAY: Record<string, string> = {
  boolean: 'boolean-icon',
  date: 'formatted-date',
  datetime: 'formatted-date',
  timestamp: 'formatted-date',
};

export function resolveDisplay(field: FieldResource): DisplayComponent<unknown> {
  const meta = (field as unknown as { meta?: { display?: { name?: string } } }).meta;
  const explicit = meta?.display?.name;
  const candidate =
    (explicit && REGISTRY[explicit]) ||
    REGISTRY[INTERFACE_TO_DISPLAY[field.interface] ?? ''] ||
    REGISTRY[TYPE_TO_DISPLAY[field.type] ?? ''] ||
    TextDisplay;
  return candidate as DisplayComponent<unknown>;
}

export const DISPLAY_NAMES = Object.keys(REGISTRY);
