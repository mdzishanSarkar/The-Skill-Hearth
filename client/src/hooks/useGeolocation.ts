import { useCallback, useRef, useState } from 'react';

export type LocationStatus = 'idle' | 'asking' | 'found' | 'denied';

export interface GeolocationState {
  status: LocationStatus;
  coordinates: [number, number] | null;
  placedAt: string;
  placedAtFull: string;
}

export interface UseGeolocationOptions {
  /** Coords to use if the user already has a stored location. */
  storedCoordinates?: [number, number] | null;
  /** Label for the stored location (e.g. "Gulshan, Dhaka"). */
  storedLabel?: string;
  /** Whether to auto-request on mount (default true). */
  autoRequest?: boolean;
}

export interface UseGeolocationReturn extends GeolocationState {
  /** Request browser geolocation. Shows the browser prompt. */
  requestGeolocation: () => void;
  /** Manually set the center to a geocoded place. */
  setFromGeocode: (lng: number, lat: number, label: string, fullLabel: string) => void;
  /** Set status to denied (used when user picks manual entry). */
  denyLocation: () => void;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
};

export function useGeolocation(opts: UseGeolocationOptions = {}): UseGeolocationReturn {
  const { storedCoordinates = null, storedLabel = '', autoRequest = true } = opts;

  const [status, setStatus] = useState<LocationStatus>(() => {
    if (storedCoordinates) return 'found';
    return 'idle';
  });
  const [coordinates, setCoordinates] = useState<[number, number] | null>(storedCoordinates);
  const [placedAt, setPlacedAt] = useState(storedLabel);
  const [placedAtFull, setPlacedAtFull] = useState(storedLabel);
  const askedOnceRef = useRef(false);

  const requestGeolocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('denied');
      return;
    }
    setStatus('asking');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: [number, number] = [position.coords.longitude, position.coords.latitude];
        setCoordinates(next);
        setPlacedAt('');
        setPlacedAtFull('');
        setStatus('found');
      },
      () => {
        setStatus('denied');
      },
      GEOLOCATION_OPTIONS,
    );
  }, []);

  const setFromGeocode = useCallback(
    (lng: number, lat: number, label: string, fullLabel: string) => {
      setCoordinates([lng, lat]);
      setPlacedAt(label);
      setPlacedAtFull(fullLabel);
      setStatus('found');
    },
    [],
  );

  const denyLocation = useCallback(() => {
    setStatus('denied');
  }, []);

  // Auto-request on first render if no stored coords
  if (autoRequest && !askedOnceRef.current && !storedCoordinates && status === 'idle') {
    askedOnceRef.current = true;
    // Defer the request so it doesn't block render
    setTimeout(() => requestGeolocation(), 0);
  }

  return {
    status,
    coordinates,
    placedAt,
    placedAtFull,
    requestGeolocation,
    setFromGeocode,
    denyLocation,
  };
}
