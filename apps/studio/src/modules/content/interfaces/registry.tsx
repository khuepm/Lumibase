import type { FieldResource } from '@lumibase/sdk';
import { ColorInterface } from './color';
import { DatetimeInterface } from './datetime';
import { JsonRawInterface } from './json-raw';
import { NumberInterface } from './number';
import { RatingInterface } from './rating';
import { SelectDropdownInterface } from './select';
import { SlugInterface } from './slug';
import { TagsInterface } from './tags';
import { TextInterface, TextMultilineInterface } from './text';
import { ToggleInterface } from './toggle';
import type { InterfaceComponent } from './types';

/**
 * Maps the schema engine's `field.interface` string to a Studio component.
 * Slice 4 adds relation/file/code/wysiwyg/markdown/repeater/presentation.
 *
 * The registry is typed as `InterfaceComponent<any>` because each entry
 * binds its own value type; the public `resolveInterface` exposes a generic
 * `unknown`-valued surface so the parent form can pass through any cell value.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<string, InterfaceComponent<any>> = {
  // Phase A starter set.
  input: TextInterface,
  'input-multiline': TextMultilineInterface,
  toggle: ToggleInterface,
  'select-dropdown': SelectDropdownInterface,
  datetime: DatetimeInterface,
  'json-raw': JsonRawInterface,

  // Phase B FE slice 3 additions.
  'input-number': NumberInterface,
  slug: SlugInterface,
  color: ColorInterface,
  rating: RatingInterface,
  tags: TagsInterface,

  // Aliases by underlying type so collections without an explicit interface
  // still get a sensible editor.
  boolean: ToggleInterface,
  number: NumberInterface,
  string: TextInterface,
};

export function resolveInterface(field: FieldResource): InterfaceComponent<unknown> {
  // Prefer explicit `interface`, then fall back to type, then JSON.
  return (
    REGISTRY[field.interface] ??
    REGISTRY[field.type] ??
    JsonRawInterface
  ) as InterfaceComponent<unknown>;
}

export const INTERFACE_NAMES = Object.keys(REGISTRY);
