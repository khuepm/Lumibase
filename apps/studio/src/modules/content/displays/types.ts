import type { ReactNode } from 'react';
import type { FieldResource } from '@lumibase/sdk';

/**
 * Display contract — pure cell renderer for list views and inline previews.
 * Unlike Interfaces, displays are read-only and stateless.
 */
export interface DisplayProps<T = unknown> {
  value: T | null | undefined;
  field: FieldResource;
}

export type DisplayComponent<T = unknown> = (props: DisplayProps<T>) => ReactNode;

/** Same helper shape as the interface registry; pulls `meta.display.options`. */
export function readDisplayOptions<T>(field: FieldResource): T {
  const meta = (field as unknown as { meta?: Record<string, unknown> }).meta;
  const display = (meta?.display as Record<string, unknown>) ?? {};
  return ((display.options as T) ?? ({} as T));
}
