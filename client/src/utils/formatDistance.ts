/**
 * Returns an approximate, privacy-safe distance label like "~2 km away".
 * Never reveals exact coordinates — only an approximation.
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return '~less than 1 km away';
  return `~${Math.round(distanceKm)} km away`;
}

/**
 * Formats a distance into a short label (e.g. "2 km", "800 m")
 * without the "away" suffix — useful for compact UI.
 */
export function formatDistanceShort(distanceKm: number): string {
  if (distanceKm < 1) return '<1 km';
  return `${Math.round(distanceKm)} km`;
}
