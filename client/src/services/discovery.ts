import api from './api';
import type { GeocodedPlace, MapDiscoveryParams, MapPin } from '../types/discovery.types';

export async function getMapPins(params: MapDiscoveryParams = {}): Promise<MapPin[]> {
  const { categoryIds, ...rest } = params;
  const { data } = await api.get('/discovery', {
    params: {
      ...rest,
      ...(categoryIds && categoryIds.length ? { categoryId: categoryIds.join(',') } : {}),
    },
  });
  return (data.data as { pins: MapPin[] }).pins;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

async function nominatimSearch(query: string, lang: string): Promise<NominatimResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=${lang}&q=${encodeURIComponent(
    query
  )}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error('Could not reach the map search service');
  }
  const results = (await response.json()) as NominatimResult[];
  return results[0] ?? null;
}

export async function geocodePlace(query: string): Promise<GeocodedPlace | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const [english, local] = await Promise.all([
    nominatimSearch(trimmed, 'en').catch(() => null),
    nominatimSearch(trimmed, 'bn').catch(() => null),
  ]);
  const primary = english ?? local;
  if (!primary) return null;
  const displayName = primary.display_name;
  const enShort = displayName.split(',')[0]?.trim() ?? displayName;
  const localName = local?.display_name ?? '';
  const localShort = localName.split(',')[0]?.trim() ?? '';
  const label =
    localShort && localShort !== enShort ? `${localShort} (${enShort})` : displayName;
  return {
    lat: Number(primary.lat),
    lng: Number(primary.lon),
    displayName,
    label,
    ...(localName ? { localName } : {}),
  };
}
