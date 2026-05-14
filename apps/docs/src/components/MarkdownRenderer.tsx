import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import rehypeSlug from 'rehype-slug';
import rehypeShiki from '@shikijs/rehype';
import type { Components } from 'react-markdown';
import type { HTMLAttributes, TableHTMLAttributes } from 'react';

/**
 * MarkdownRenderer — renders Markdown content as styled HTML using
 * react-markdown with a remark/rehype plugin pipeline.
 *
 * Pipeline:
 *   react-markdown
 *     → remark-gfm (tables, strikethrough, task lists)
 *     → remark-frontmatter (strip any remaining front matter)
 *     → rehype-slug (add IDs to headings for ToC anchors)
 *     → rehype-shiki (syntax highlighting)
 *     → custom component overrides (tables, code blocks, headings, etc.)
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

export interface MarkdownRendererProps {
  content: string;
  currentSlug: string;
  knownSlugs: Set<string>;
}

/**
 * Custom component overrides for react-markdown.
 * Provides Tailwind-styled elements for all standard Markdown constructs.
 */
const components: Components = {
  // Headings
  h1: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mt-8 mb-4 text-3xl font-bold text-foreground" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="mt-8 mb-3 text-2xl font-semibold text-foreground border-b pb-2"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-6 mb-2 text-xl font-semibold text-foreground" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="mt-4 mb-2 text-lg font-semibold text-foreground" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h5 className="mt-4 mb-1 text-base font-semibold text-foreground" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h6
      className="mt-4 mb-1 text-sm font-semibold text-muted-foreground"
      {...props}
    >
      {children}
    </h6>
  ),

  // Paragraphs
  p: ({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-3 leading-7 text-foreground" {...props}>
      {children}
    </p>
  ),

  // Blockquotes
  blockquote: ({ children, ...props }: HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-4 border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Lists
  ul: ({ children, ...props }: HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-3 ml-6 list-disc space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: HTMLAttributes<HTMLOListElement>) => (
    <ol className="my-3 ml-6 list-decimal space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),

  // Tables — visible borders and alternating row colors
  table: ({ children, ...props }: TableHTMLAttributes<HTMLTableElement>) => (
    <div className="my-4 overflow-x-auto">
      <table
        className="w-full border-collapse border border-border text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-muted" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody {...props}>{children}</tbody>
  ),
  tr: ({ children, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="border-b border-border even:bg-muted/50" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="border border-border px-3 py-2 text-left font-semibold"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-border px-3 py-2" {...props}>
      {children}
    </td>
  ),

  // Inline code
  code: ({ children, className, ...props }: HTMLAttributes<HTMLElement>) => {
    // If className contains "language-", it's a code block handled by Shiki.
    // Shiki wraps highlighted code in <pre><code class="language-xxx">.
    // We only style inline code here (no language class, not inside <pre>).
    const isBlock = className && /language-/.test(className);
    if (isBlock) {
      // Code block — rendered by Shiki or as plain monospace.
      // Return as-is; the <pre> wrapper handles styling.
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    // Inline code
    return (
      <code
        className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground"
        {...props}
      >
        {children}
      </code>
    );
  },

  // Fenced code blocks (the <pre> wrapper)
  pre: ({ children, ...props }: HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="my-4 overflow-x-auto rounded-lg border border-border bg-muted p-4 text-sm font-mono"
      {...props}
    >
      {children}
    </pre>
  ),

  // Horizontal rules
  hr: ({ ...props }: HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-6 border-t border-border" {...props} />
  ),

  // Strong / Bold
  strong: ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),

  // Emphasis / Italic
  em: ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),

  // Links — default styling (Link Rewriter in task 6.2 will override this)
  a: ({ children, href, ...props }: HTMLAttributes<HTMLAnchorElement> & { href?: string }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:text-primary/80"
      {...props}
    >
      {children}
    </a>
  ),
};

/**
 * Shiki rehype plugin configuration.
 * Highlights code blocks for the specified languages.
 * Code blocks without a language fall back to plain monospace (no highlighting).
 */
const rehypeShikiOptions = {
  themes: {
    light: 'github-light',
    dark: 'github-dark',
  },
  langs: [
    'typescript',
    'javascript',
    'json',
    'yaml',
    'sql',
    'bash',
    'markdown',
  ] as const,
  // When no language is specified, skip highlighting (renders as plain monospace)
  defaultLanguage: undefined,
};

export function MarkdownRenderer({
  content,
  currentSlug: _currentSlug,
  knownSlugs: _knownSlugs,
}: MarkdownRendererProps) {
  return (
    <div className="prose-docs max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkFrontmatter]}
        rehypePlugins={[rehypeSlug, [rehypeShiki, rehypeShikiOptions]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
