import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard shadcn-svelte `cn()` helper: merges conditional classnames via `clsx`, then resolves
 * conflicting Tailwind utilities (e.g. a caller's `bg-secondary` overriding a base `bg-primary`)
 * via `tailwind-merge` so the last one wins instead of both landing in the class list.
 *
 * @param {...import('clsx').ClassValue} inputs
 * @returns {string}
 */
export function cn(...inputs) {
	return twMerge(clsx(inputs));
}
