import type { ReactNode } from "react";
import type { FieldResource } from "@lumibase/sdk";

/**
 * Display contract — pure cell renderer for list views and inline previews.
 * Unlike Interfaces, displays are read-only and stateless.
 *
 * `row` is the whole `data` payload, optionally provided so templated
 * displays (e.g. `mustache`) can interpolate sibling fields.
 */
export interface DisplayProps<T = unknown> {
  value: T | null | undefined;
  field: FieldResource;
  row?: Record<string, unknown>;
}

export type DisplayComponent<T = unknown> = (
  props: DisplayProps<T>,
) => ReactNode;

/**
 * Pulls the per-field display options.
 *
 * Source of truth (matches BE `fields` table): top-level `displayOptions`
 * column. We also accept the legacy `meta.display.options` shape so older
 * field rows authored before the column existed still render.
 */
export function readDisplayOptions<T>(field: FieldResource): T {
  const top = (field as unknown as { displayOptions?: Record<string, unknown> })
    .displayOptions;
  if (top && Object.keys(top).length > 0) return top as T;
  const meta = (field as unknown as { meta?: Record<string, unknown> }).meta;
  const display = (meta?.display as Record<string, unknown>) ?? {};
  return (display.options as T) ?? ({} as T);
}

/** Resolved display key — top-level `display` column with legacy fallback. */
export function readDisplayKey(field: FieldResource): string | undefined {
  const top = (field as unknown as { display?: string | null }).display;
  if (top) return top;
  const meta = (field as unknown as { meta?: Record<string, unknown> }).meta;
  const name = (meta?.display as Record<string, unknown> | undefined)?.name;
  return typeof name === "string" ? name : undefined;
}
