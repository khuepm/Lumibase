import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Concatenate Tailwind classes, deduping conflicting utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
