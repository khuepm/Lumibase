/**
 * DocPage component — displays a single documentation page.
 *
 * Responsibilities:
 * - Load doc content from `docIndex` based on route slug parameter
 * - Pass content to MarkdownRenderer
 * - Display document title as H1 at top of content area
 * - Display last-modified date below title in DD/MM/YYYY format (if available)
 * - Set browser <title> to `{document title} — Lumibase Docs`
 * - If slug not found in docIndex, redirect to NotFoundPage
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 5.2
 */
import { useEffect, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { docIndex } from 'virtual:docs-registry';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

/**
 * Formats an ISO date string to DD/MM/YYYY format.
 * Returns undefined if the input is not a valid date.
 */
export function formatDate(isoDate: string | undefined): string | undefined {
  if (!isoDate) return undefined;
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return undefined;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function DocPage() {
  const { '*': slug } = useParams();

  const entry = slug ? docIndex[slug] : undefined;

  // Build the set of known slugs for link rewriting
  const knownSlugs = useMemo(() => new Set(Object.keys(docIndex)), []);

  // Set browser title
  useEffect(() => {
    if (entry) {
      document.title = `${entry.title} — Lumibase Docs`;
    }
    return () => {
      document.title = 'Lumibase Docs';
    };
  }, [entry]);

  // If slug not found, redirect to 404
  if (!entry) {
    return <Navigate to="/404" replace />;
  }

  const formattedDate = formatDate(entry.lastModified);

  return (
    <article className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{entry.title}</h1>
        {formattedDate && (
          <p className="mt-2 text-sm text-muted-foreground">
            Last modified: {formattedDate}
          </p>
        )}
      </header>
      <MarkdownRenderer
        content={entry.content}
        currentSlug={entry.slug}
        knownSlugs={knownSlugs}
      />
    </article>
  );
}
