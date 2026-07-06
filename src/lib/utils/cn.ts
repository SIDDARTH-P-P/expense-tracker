import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes without style collisions. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
