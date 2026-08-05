import { useEffect } from 'react';
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
      <ClusterLayer pins={pins} isAuthenticated={isAuthenticated} />
    </MapContainer>
  );
}
