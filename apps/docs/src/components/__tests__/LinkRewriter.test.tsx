import { describe, it, expect } from 'vitest';
import { resolveRelativeSlug, classifyLink } from '../LinkRewriter';

describe('resolveRelativeSlug', () => {
  it('resolves a sibling .md file from a nested slug', () => {
    expect(resolveRelativeSlug('features/auth', './overview.md')).toBe('features/overview');
  });

  it('resolves a parent-relative path', () => {
    expect(resolveRelativeSlug('features/auth', '../README.md')).toBe('README');
  });

  it('resolves a plain filename from root-level slug', () => {
    expect(resolveRelativeSlug('README', 'features/auth.md')).toBe('features/auth');
  });

  it('resolves a sibling without ./ prefix from nested slug', () => {
    expect(resolveRelativeSlug('features/auth', 'overview.md')).toBe('features/overview');
  });

  it('resolves deeply nested relative paths', () => {
    expect(resolveRelativeSlug('a/b/c', '../../d.md')).toBe('d');
  });

  it('handles multiple .. segments', () => {
    expect(resolveRelativeSlug('a/b/c', '../../../root.md')).toBe('root');
  });
});

describe('classifyLink', () => {
  const knownSlugs = new Set(['README', 'features/auth', 'features/overview']);

  it('classifies absolute http URLs as external', () => {
    expect(classifyLink('https://example.com', 'README', knownSlugs)).toEqual({
      type: 'external',
    });
  });

  it('classifies absolute http (non-https) URLs as external', () => {
    expect(classifyLink('http://example.com/page', 'README', knownSlugs)).toEqual({
      type: 'external',
    });
  });

  it('classifies relative .md link to known slug as internal', () => {
    expect(classifyLink('./auth.md', 'features/overview', knownSlugs)).toEqual({
      type: 'internal',
      slug: 'features/auth',
    });
  });

  it('classifies relative .md link to unknown slug as broken', () => {
    expect(classifyLink('./nonexistent.md', 'features/auth', knownSlugs)).toEqual({
      type: 'broken',
    });
  });

  it('classifies .md link with fragment to known slug as internal', () => {
    expect(classifyLink('./auth.md#section', 'features/overview', knownSlugs)).toEqual({
      type: 'internal',
      slug: 'features/auth',
    });
  });

  it('classifies anchor-only links as passthrough', () => {
    expect(classifyLink('#section-id', 'README', knownSlugs)).toEqual({
      type: 'passthrough',
    });
  });

  it('classifies non-.md relative links as passthrough', () => {
    expect(classifyLink('./image.png', 'README', knownSlugs)).toEqual({
      type: 'passthrough',
    });
  });
});
