import { parseComponentTemplate } from '../block-template-types';
import { BlockTemplateRenderer } from '../block-template-renderer';
import { type DisplayComponent } from './types';

/**
 * `component-template` — runtime list-cell display.
 *
 * Reads `collections.displayTemplate` (stored on the `row` object as
 * `__template` hint or falls back to reading the stringified template from
 * displayOptions) and renders it via `BlockTemplateRenderer`.
 *
 * Phase F: the template JSON is passed through `field.displayOptions.template`
 * (set when a collection uses a component-template as its displayTemplate).
 * The `row` is the full item payload — all field values are available for
 * path binding.
 */
export const ComponentTemplateDisplay: DisplayComponent<unknown> = ({ field, row }) => {
  // Attempt to read a pre-parsed or raw template from displayOptions
  const opts = (field as unknown as { displayOptions?: Record<string, unknown> }).displayOptions ?? {};
  const rawTemplate = opts['template'] as string | undefined;

  if (!rawTemplate) {
    return <span className="text-muted-foreground italic text-[11px]">No template</span>;
  }

  const ct = parseComponentTemplate(rawTemplate);
  if (!ct) {
    return <span className="text-muted-foreground italic text-[11px]">Invalid template</span>;
  }

  return (
    <BlockTemplateRenderer
      template={ct}
      sample={row ?? {}}
      className="max-w-full"
    />
  );
};
