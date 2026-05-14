import { useCallback, useRef, useState } from 'react';

const STORAGE_KEY = 'lumibase-docs:sidebar-state';

/**
 * Reads the sidebar expanded/collapsed state from localStorage.
 * Returns an empty record if localStorage is unavailable or data is invalid.
 */
function readFromStorage(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, boolean>;
    }
    return {};
  } catch {
    // localStorage unavailable (private browsing) or invalid JSON
    return {};
  }
}

/**
 * Writes the sidebar state to localStorage.
 * Silently ignores errors (e.g., quota exceeded, private browsing).
 */
function writeToStorage(state: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Gracefully ignore storage errors
  }
}

/**
 * Custom hook for managing sidebar directory expanded/collapsed state
 * with localStorage persistence.
 *
 * - Persists expanded/collapsed state per directory path
 * - Restores state on page load
 * - Defaults to expanded (true) if no stored state exists
 * - Gracefully handles private browsing / storage errors
 *
 * Requirements: 3.5
 */
export function useSidebarState() {
  // Initialize state from localStorage once
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>(readFromStorage);
  const stateRef = useRef(expandedState);
  stateRef.current = expandedState;

  /**
   * Returns whether a directory is expanded.
   * Defaults to true (expanded) if no stored state exists for the path.
   */
  const isExpanded = useCallback(
    (path: string): boolean => {
      return expandedState[path] ?? true;
    },
    [expandedState]
  );

  /**
   * Toggles the expanded/collapsed state for a directory path
   * and persists the change to localStorage.
   */
  const toggle = useCallback((path: string) => {
    setExpandedState((prev) => {
      const currentValue = prev[path] ?? true;
      const next = { ...prev, [path]: !currentValue };
      writeToStorage(next);
      return next;
    });
  }, []);

  return { isExpanded, toggle };
}
