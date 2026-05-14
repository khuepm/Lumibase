import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import ReactMarkdown from 'react-markdown';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';

/**
 * Feature: lumibase-docs-viewer, Property 3: Front matter stripping
 *
 * For any Markdown content containing a YAML front matter block (delimited by `---`),
 * the rendered HTML output SHALL NOT contain the front matter delimiters or any raw
 * YAML key-value pairs from the front matter block.
 *
 * **Validates: Requirements 4.7**
 *
 * We test the core remark pipeline (remark-gfm + remark-frontmatter) which is the
 * same stripping logic used by MarkdownRenderer. We exclude rehype-shiki since it's
 * async and not relevant to front matter stripping.
 */
describe('Feature: lumibase-docs-viewer, Property 3: Front matter stripping', () => {
  /**
   * Arbitrary for generating YAML-safe keys (simple alphanumeric identifiers).
   */
  const yamlKeyArb = fc
    .stringMatching(/^[a-z][a-z0-9_]*$/)
    .filter((s) => s.length >= 2 && s.length <= 20);

  /**
   * Arbitrary for generating YAML-safe scalar values (strings, numbers, booleans).
   */
  const yamlValueArb = fc.oneof(
    // String values (simple alphanumeric to avoid YAML parsing issues)
    fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]*$/).filter((s) => s.trim().length > 0 && s.length <= 30),
    // Number values
    fc.integer({ min: -1000, max: 1000 }).map(String),
    // Boolean values
    fc.boolean().map(String),
  );

  /**
   * Arbitrary for generating a set of YAML key-value pairs.
   */
  const yamlFieldsArb = fc
    .array(fc.tuple(yamlKeyArb, yamlValueArb), { minLength: 1, maxLength: 5 })
    .map((pairs) => {
      // Deduplicate keys
      const seen = new Set<string>();
      return pairs.filter(([key]) => {
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    })
    .filter((pairs) => pairs.length >= 1);

  /**
   * Arbitrary for generating markdown body content (simple text that won't
   * accidentally match YAML patterns).
   */
  const bodyContentArb = fc
    .stringMatching(/^[A-Z][a-zA-Z0-9 ]+$/)
    .filter((s) => s.trim().length >= 10 && !s.includes('---'))
    .map((s) => s.trim());

  /**
   * Helper to render markdown with the same remark plugins as MarkdownRenderer
   * (minus the async rehype-shiki which is irrelevant to front matter stripping).
   */
  function renderMarkdown(content: string) {
    const { container } = render(
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkFrontmatter]}>
        {content}
      </ReactMarkdown>,
    );
    return container;
  }

  it('should not render front matter delimiters (---) in the output', () => {
    fc.assert(
      fc.property(yamlFieldsArb, bodyContentArb, (fields, body) => {
        // Build markdown with front matter
        const yamlLines = fields.map(([key, value]) => `${key}: ${value}`);
        const markdown = `---\n${yamlLines.join('\n')}\n---\n\n${body}`;

        const container = renderMarkdown(markdown);
        const textContent = container.textContent || '';

        // The rendered output should NOT contain the front matter delimiter `---`
        expect(textContent).not.toContain('---');

        // The body content SHOULD still be present
        expect(textContent).toContain(body);
      }),
      { numRuns: 100 },
    );
  });

  it('should not render raw YAML key-value pairs from front matter in the output', () => {
    fc.assert(
      fc.property(yamlFieldsArb, bodyContentArb, (fields, body) => {
        // Build markdown with front matter
        const yamlLines = fields.map(([key, value]) => `${key}: ${value}`);
        const markdown = `---\n${yamlLines.join('\n')}\n---\n\n${body}`;

        const container = renderMarkdown(markdown);
        const textContent = container.textContent || '';

        // None of the raw YAML key: value lines should appear in the rendered text
        for (const [key, value] of fields) {
          const yamlLine = `${key}: ${value}`;
          expect(textContent).not.toContain(yamlLine);
        }

        // The body content SHOULD still be present
        expect(textContent).toContain(body);
      }),
      { numRuns: 100 },
    );
  });

  it('should render body content correctly even with complex front matter', () => {
    fc.assert(
      fc.property(
        yamlFieldsArb,
        // Generate multiple paragraphs of body content
        fc
          .array(bodyContentArb, { minLength: 1, maxLength: 3 })
          .map((paragraphs) => paragraphs.join('\n\n')),
        (fields, body) => {
          const yamlLines = fields.map(([key, value]) => `${key}: ${value}`);
          const markdown = `---\n${yamlLines.join('\n')}\n---\n\n${body}`;

          const container = renderMarkdown(markdown);
          const textContent = container.textContent || '';

          // Each paragraph of body content should be present in the output
          for (const paragraph of body.split('\n\n')) {
            const trimmed = paragraph.trim();
            if (trimmed.length > 0) {
              expect(textContent).toContain(trimmed);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
