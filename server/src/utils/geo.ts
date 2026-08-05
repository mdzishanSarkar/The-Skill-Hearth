const GRID_DEGREES = 0.002;

const EARTH_RADIUS_KM = 6378.1;

export function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function snapCoordinates(lng: number, lat: number): [number, number] {
  const snappedLat = Math.round(lat / GRID_DEGREES) * GRID_DEGREES;
  const cosLat = Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const gridLng = GRID_DEGREES * cosLat;
  const snappedLng = Math.round(lng / gridLng) * gridLng;
  return [Number(snappedLng.toFixed(6)), Number(snappedLat.toFixed(6))];
}

export function isValidCoordinatePair(
  coordinates: unknown
): coordinates is [number, number] {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;
  const [lng, lat] = coordinates as [unknown, unknown];
  if (typeof lng !== 'number' || typeof lat !== 'number') return false;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}
