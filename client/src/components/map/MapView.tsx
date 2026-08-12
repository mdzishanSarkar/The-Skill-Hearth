import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './map.css';
import type { MapPin } from '../../types/discovery.types';
import ClusterLayer from './ClusterLayer';

interface MapViewProps {
  pins: MapPin[];
  center: [number, number];
  zoom?: number;
  isAuthenticated: boolean;
  mode?: 'day' | 'night';
  clusterMarkers?: boolean;
  recenterSignal?: number;
}

const TILE_URLS: Record<'day' | 'night', { url: string; attribution: string }> = {
  day: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  night: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

function Recenter({
  center,
  zoom,
  signal,
}: {
  center: [number, number];
  zoom?: number;
  signal?: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom, signal]);
  return null;
}

function MapSizer() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function FitResultsButton({ pins, center }: { pins: MapPin[]; center: [number, number] }) {
  const map = useMap();
  function handleClick() {
    if (pins.length === 0) {
      map.setView(center, 12);
      return;
    }
    const bounds = L.latLngBounds(
      pins.map((p) => [p.coordinates[1], p.coordinates[0]] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15 });
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Zoom to all results"
      title="Zoom to all results"
      className="map-control-button"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 16l4 4" />
      </svg>
    </button>
  );
}

function FullscreenButton() {
  const map = useMap();
  const containerRef = useRef<HTMLElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    containerRef.current = map.getContainer();
  }, [map]);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(document.fullscreenElement != null);
    }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  if (typeof document !== 'undefined' && !('requestFullscreen' in document)) {
    return null;
  }

  function handleClick() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      className="map-control-button hidden sm:flex"
    >
      {isFullscreen ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"
          />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8V5a2 2 0 012-2h3m8 0h3a2 2 0 012 2v3m0 8v3a2 2 0 01-2 2h-3m-8 0H5a2 2 0 01-2-2v-3"
          />
        </svg>
      )}
    </button>
  );
}

export default function MapView({
  pins,
  center,
  zoom = 12,
  isAuthenticated,
  mode = 'day',
  clusterMarkers = true,
  recenterSignal,
}: MapViewProps) {
  const centerLatLng: [number, number] = [center[1], center[0]];
  const tiles = TILE_URLS[mode];
  return (
    <MapContainer
      center={centerLatLng}
      zoom={zoom}
      className={`h-full w-full${mode === 'night' ? ' map--night' : ''}`}
      zoomControl={false}
      style={{ zIndex: 0 }}
    >
      <TileLayer attribution={tiles.attribution} url={tiles.url} />
      <ZoomControl position="bottomleft" />
      <MapSizer />
      <Recenter center={centerLatLng} zoom={zoom} signal={recenterSignal} />
      <div className="map-controls">
        <FitResultsButton pins={pins} center={centerLatLng} />
        <FullscreenButton />
      </div>
      <ClusterLayer pins={pins} isAuthenticated={isAuthenticated} enabled={clusterMarkers} />
    </MapContainer>
  );
}
