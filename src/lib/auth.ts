/**
 * Centralized auth token accessor.
 *
 * All components and API callers must use this instead of reading
 * localStorage.token directly. This is the single seam for a future
 * httpOnly cookie migration — one function to change.
 */
export function getToken(): string | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage.token ?? null;
}
