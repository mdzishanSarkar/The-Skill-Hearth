import { useEffect } from 'react';
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
}

function Recenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
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
      className="map-fit-button"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
        />
      </svg>
    </button>
  );
}

export default function MapView({ pins, center, zoom = 12, isAuthenticated }: MapViewProps) {
  const centerLatLng: [number, number] = [center[1], center[0]];
  return (
    <MapContainer center={centerLatLng} zoom={zoom} className="h-full w-full" zoomControl={false} style={{ zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomleft" />
      <MapSizer />
      <Recenter center={centerLatLng} zoom={zoom} />
      <FitResultsButton pins={pins} center={centerLatLng} />
      <ClusterLayer pins={pins} isAuthenticated={isAuthenticated} />
    </MapContainer>
  );
}
