import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import type { MapPin } from '../../types/discovery.types';
import { buildPinIcon, buildPinPopup } from './MapPin';

interface ClusterLayerProps {
  pins: MapPin[];
  isAuthenticated: boolean;
  enabled?: boolean;
}

export default function ClusterLayer({ pins, isAuthenticated, enabled = true }: ClusterLayerProps) {
  const map = useMap();
  const navigate = useNavigate();

  useEffect(() => {
    const markers = pins
      .map((pin) => {
        const [lng, lat] = pin.coordinates;
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
        const marker = L.marker([lat, lng], { icon: buildPinIcon(pin) });
        marker.bindPopup(buildPinPopup(pin, isAuthenticated));

        marker.on('popupopen', () => {
          const el = marker.getPopup()?.getElement();
          if (!el || el.dataset.skillNavBound === '1') return;
          el.dataset.skillNavBound = '1';
          el.addEventListener('click', (event) => {
            const target = (event.target as HTMLElement).closest<HTMLElement>('[data-skill-id]');
            const skillId = target?.dataset.skillId;
            if (!skillId) return;
            event.preventDefault();
            navigate(`/skills/${skillId}`);
          });
        });

        return marker;
      })
      .filter((marker): marker is L.Marker => marker !== null);

    if (markers.length === 0) return;

    const group = enabled ? L.markerClusterGroup({
      maxClusterRadius: 55,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 15,
    }) : null;

    if (group) {
      markers.forEach((marker) => group.addLayer(marker));
      map.addLayer(group);
    } else {
      markers.forEach((marker) => map.addLayer(marker));
    }

    return () => {
      if (group) {
        map.removeLayer(group);
      } else {
        markers.forEach((marker) => map.removeLayer(marker));
      }
    };
  }, [map, pins, isAuthenticated, navigate, enabled]);

  return null;
}
