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

/** Keep markers sharing coordinates visibly separate at the current zoom. */
const STACK_OFFSET_PX = 70;

function offsetPins(pins: MapPin[], map: L.Map): [MapPin, [number, number]][] {
  const groups = new Map<string, MapPin[]>();
  for (const pin of pins) {
    const key = `${pin.coordinates[0]},${pin.coordinates[1]}`;
    const arr = groups.get(key) ?? [];
    arr.push(pin);
    groups.set(key, arr);
  }

  const result: [MapPin, [number, number]][] = [];
  for (const group of groups.values()) {
    if (group.length <= 1) {
      result.push([group[0], group[0].coordinates]);
      continue;
    }
    const [lng, lat] = group[0].coordinates;
    const center = map.latLngToLayerPoint([lat, lng]);
    const step = (2 * Math.PI) / group.length;
    for (let i = 0; i < group.length; i++) {
      const angle = step * i - Math.PI / 2;
      const point = L.point(
        center.x + STACK_OFFSET_PX * Math.sin(angle),
        center.y - STACK_OFFSET_PX * Math.cos(angle),
      );
      const position = map.layerPointToLatLng(point);
      result.push([group[i], [position.lng, position.lat]]);
    }
  }
  return result;
}

export default function ClusterLayer({ pins, isAuthenticated, enabled = true }: ClusterLayerProps) {
  const map = useMap();
  const navigate = useNavigate();

  useEffect(() => {
    function makeMarker(pin: MapPin, coords: [number, number]): L.Marker | null {
      const [lng, lat] = coords;
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
    }

    const positioned = enabled
      ? pins.map((p) => [p, p.coordinates] as [MapPin, [number, number]])
      : offsetPins(pins, map);
    const markers = positioned
      .map(([pin, coords]) => makeMarker(pin, coords))
      .filter((m): m is L.Marker => m !== null);

    if (markers.length === 0) return;

    if (enabled) {
      const group = L.markerClusterGroup({
        maxClusterRadius: 55,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 15,
      });
      markers.forEach((marker) => group.addLayer(marker));
      map.addLayer(group);

      return () => {
        map.removeLayer(group);
      };
    }

    markers.forEach((marker) => map.addLayer(marker));

    return () => {
      markers.forEach((marker) => map.removeLayer(marker));
    };
  }, [map, pins, isAuthenticated, navigate, enabled]);

  return null;
}
