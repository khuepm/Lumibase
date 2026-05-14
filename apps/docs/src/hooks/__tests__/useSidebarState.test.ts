import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSidebarState } from '../useSidebarState';

const STORAGE_KEY = 'lumibase-docs:sidebar-state';

// Create a working localStorage mock for the test environment
function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

describe('useSidebarState', () => {
  let mockStorage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to expanded (true) when no stored state exists', () => {
    const { result } = renderHook(() => useSidebarState());
    expect(result.current.isExpanded('features')).toBe(true);
    expect(result.current.isExpanded('guides')).toBe(true);
  });

  it('restores state from localStorage on initialization', () => {
    mockStorage.getItem.mockReturnValue(JSON.stringify({ features: false, guides: true }));

    const { result } = renderHook(() => useSidebarState());
    expect(result.current.isExpanded('features')).toBe(false);
    expect(result.current.isExpanded('guides')).toBe(true);
  });

  it('toggles a directory from expanded to collapsed', () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.toggle('features');
    });

    expect(result.current.isExpanded('features')).toBe(false);
  });

  it('toggles a directory from collapsed to expanded', () => {
    mockStorage.getItem.mockReturnValue(JSON.stringify({ features: false }));

    const { result } = renderHook(() => useSidebarState());
    expect(result.current.isExpanded('features')).toBe(false);

    act(() => {
      result.current.toggle('features');
    });

    expect(result.current.isExpanded('features')).toBe(true);
  });

  it('persists state to localStorage on toggle', () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.toggle('features');
    });

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify({ features: false })
    );
  });

  it('handles multiple directories independently', () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.toggle('features');
    });

    expect(result.current.isExpanded('features')).toBe(false);
    expect(result.current.isExpanded('guides')).toBe(true);

    act(() => {
      result.current.toggle('guides');
    });

    expect(result.current.isExpanded('features')).toBe(false);
    expect(result.current.isExpanded('guides')).toBe(false);
  });

  it('handles nested directory paths', () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.toggle('features/advanced');
    });

    expect(result.current.isExpanded('features/advanced')).toBe(false);
    expect(result.current.isExpanded('features')).toBe(true);
  });

  it('gracefully handles localStorage.getItem throwing', () => {
    mockStorage.getItem.mockImplementation(() => {
      throw new Error('SecurityError: access denied');
    });

    const { result } = renderHook(() => useSidebarState());
    // Should default to expanded
    expect(result.current.isExpanded('features')).toBe(true);
  });

  it('gracefully handles localStorage.setItem throwing', () => {
    mockStorage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useSidebarState());

    // Should not throw when toggling
    expect(() => {
      act(() => {
        result.current.toggle('features');
      });
    }).not.toThrow();

    // State should still update in memory
    expect(result.current.isExpanded('features')).toBe(false);
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    mockStorage.getItem.mockReturnValue('not-valid-json{{{');

    const { result } = renderHook(() => useSidebarState());
    // Should default to expanded
    expect(result.current.isExpanded('features')).toBe(true);
  });

  it('handles non-object values in localStorage gracefully', () => {
    mockStorage.getItem.mockReturnValue(JSON.stringify([1, 2, 3]));

    const { result } = renderHook(() => useSidebarState());
    // Should default to expanded
    expect(result.current.isExpanded('features')).toBe(true);
  });
});
