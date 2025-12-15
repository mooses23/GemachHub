/**
 * Application configuration
 * Uses environment variables with fallback to window.location
 */

/**
 * Get the base URL for the application
 * In production, this uses VITE_BASE_URL if set, otherwise falls back to window.location.origin
 * In development, it uses window.location.origin
 */
export function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback - use environment variable or empty string
    return import.meta.env.VITE_BASE_URL || '';
  }
  
  return import.meta.env.VITE_BASE_URL || window.location.origin;
}

/**
 * Get the full URL for a given path
 * @param path - The path to append to the base URL (should start with /)
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
