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
}

export default function ClusterLayer({ pins, isAuthenticated }: ClusterLayerProps) {
  const map = useMap();
  const navigate = useNavigate();

  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: 55,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 15,
    });

    pins.forEach((pin) => {
      const [lng, lat] = pin.coordinates;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
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

      group.addLayer(marker);
    });

    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [map, pins, isAuthenticated, navigate]);

  return null;
}
