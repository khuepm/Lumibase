/**
 * Tiny mustache renderer for display templates.
 *
 * Phase B keeps it intentionally small — only `{{path.to.field}}` lookups,
 * no sections or partials. Everything else stays untouched. Server-side use
 * is paired with `POST /utils/render-template`; the same helper can be
 * re-exported via packages/sdk for the Studio preview.
 */

const TOKEN = /\{\{\s*([\w.\[\]]+)\s*\}\}/g;

export function renderTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(TOKEN, (_, path: string) => {
    const value = lookup(path, data);
    return value == null ? '' : String(value);
  });
}

function lookup(path: string, data: unknown): unknown {
  const segments = path.split(/[.\[\]]+/).filter(Boolean);
  let current: unknown = data;
  for (const segment of segments) {
    if (current == null) return undefined;
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}
