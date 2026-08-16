import { User } from '../models';
import { listSkills, ListSkillsFilters } from './skill';
import { getBlockedIds } from './block.service';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Common Bangladeshi place names, longest first so multi-word places match first.
const PLACE_LEXICON: string[] = [
  'bashundhara r/a',
  'bashundhara',
  'bashun dara',
  'old town',
  'old dhaka',
  'mohammadpur',
  'mohakhali',
  'dhanmondi',
  'hatirjheel',
  'jhigatola',
  'khilgaon',
  'lalmatia',
  'shantinagar',
  'mirpur',
  'gulshan',
  'banani',
  'uttara',
  'badda',
  'ramna',
  'motijheel',
  'tongi',
  'savar',
  'narayanganj',
  'gazipur',
  'mymensingh',
  'chittagong',
  'chatogram',
  'sylhet',
  'khulna',
  'rajshahi',
  'barisal',
  'rangpur',
  'comilla',
  'cumilla',
  'jashore',
  'dhaka',
  'bangladesh',
];

const NEAR_ME_PATTERNS = [/near\s+me/i, /close\s+to\s+me/i, /around\s+me/i, /close\s+by/i];

const NEIGHBORHOODS = new Set([
  'bashundhara r/a',
  'bashundhara',
  'old town',
  'old dhaka',
  'mohammadpur',
  'mohakhali',
  'dhanmondi',
  'hatirjheel',
  'jhigatola',
  'khilgaon',
  'lalmatia',
  'shantinagar',
  'mirpur',
  'gulshan',
  'banani',
  'uttara',
  'badda',
  'ramna',
  'motijheel',
]);

const CITIES = new Set([
  'tongi',
  'savar',
  'narayanganj',
  'gazipur',
  'mymensingh',
  'chittagong',
  'chatogram',
  'sylhet',
  'khulna',
  'rajshahi',
  'barisal',
  'rangpur',
  'comilla',
  'cumilla',
  'jashore',
  'dhaka',
  'bangladesh',
]);

export interface ParsedQuery {
  skillQuery: string;
  locationQuery: string | null;
  nearMe: boolean;
}

export function geocodeTarget(place: string): string {
  if (NEIGHBORHOODS.has(place)) {
    return `${place} Dhaka Bangladesh`;
  }
  if (CITIES.has(place) && place !== 'bangladesh') {
    return `${place} Bangladesh`;
  }
  return place;
}

export function parseQuery(raw: string): ParsedQuery {
  const query = raw.trim();
  let skillQuery = query;
  let locationQuery: string | null = null;
  let nearMe = false;

  for (const pattern of NEAR_ME_PATTERNS) {
    if (pattern.test(query)) {
      skillQuery = query.replace(pattern, '').trim();
      nearMe = true;
      break;
    }
  }

  if (!locationQuery) {
    const lower = skillQuery.toLowerCase();
    for (const place of PLACE_LEXICON) {
      const escaped = place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?:^|[\\s,]+)${escaped}(?:[\\s,]+|$)`, 'i');
      if (re.test(skillQuery)) {
        locationQuery = place;
        skillQuery = skillQuery
          .replace(new RegExp(`(?:^|\\s+)${escaped}(?=\\s|$|,|\\.)`, 'i'), ' ')
          .replace(/\s+/g, ' ')
          .trim();
        break;
      }
    }
  }

  return { skillQuery, locationQuery, nearMe };
}

let lastGeocodeAt = 0;

export async function geocodePlace(query: string): Promise<{ name: string; lat: number; lng: number } | null> {
  const wait = Math.max(0, 1100 - (Date.now() - lastGeocodeAt));
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastGeocodeAt = Date.now();

  try {
    const res = await fetch(
      `${NOMINATIM_URL}?format=json&limit=1&addressdetails=0&q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'TheSkillHearth/1.0 (skill-hearth@localhost)', 'Accept-Language': 'en,bn' } },
    );
    if (!res.ok) return null;
    const results = (await res.json()) as NominatimResult[];
    const first = results[0];
    if (!first) return null;
    return {
      name: first.display_name.split(',').slice(0, 2).join(',').trim(),
      lat: Number(first.lat),
      lng: Number(first.lon),
    };
  } catch {
    return null;
  }
}

export interface NaturalSearchResult {
  query: string;
  skillQuery: string;
  location: { name: string; lat: number; lng: number } | null;
  matchedLocation: boolean;
  nearMe: boolean;
  skills: Awaited<ReturnType<typeof listSkills>>['skills'];
  total: number;
}

const DEFAULT_RADIUS_KM = 25;
const MAX_RESULTS = 20;

export async function naturalSearch(rawQuery: string, viewerId?: string): Promise<NaturalSearchResult> {
  const { skillQuery, locationQuery, nearMe } = parseQuery(rawQuery);

  let matchedLocation: { name: string; lat: number; lng: number } | null = null;
  let viewerCoords: number[] | null = null;

  if (viewerId) {
    const viewer = await User.findById(viewerId).select('location').lean();
    if (viewer?.location?.coordinates && Array.isArray(viewer.location.coordinates)) {
      viewerCoords = viewer.location.coordinates as number[];
    }
  }

  if (locationQuery && !nearMe) {
    matchedLocation = await geocodePlace(geocodeTarget(locationQuery));
  }

  const filters: ListSkillsFilters = {
    q: skillQuery || undefined,
    sort: 'closest',
    limit: MAX_RESULTS,
  };

  const coords = matchedLocation
    ? { lng: matchedLocation.lng, lat: matchedLocation.lat }
    : viewerCoords
      ? { lng: Number(viewerCoords[0]), lat: Number(viewerCoords[1]) }
      : null;

  if (coords) {
    filters.lat = coords.lat;
    filters.lng = coords.lng;
    filters.radiusKm = DEFAULT_RADIUS_KM;
  }

  if (viewerId) {
    const blocked = await getBlockedIds(viewerId);
    if (blocked.length) filters.excludeUserIds = blocked;
  }

  const data = await listSkills(filters);

  return {
    query: rawQuery,
    skillQuery,
    location: coords ? { ...(matchedLocation ?? { name: 'Your area', lat: coords.lat, lng: coords.lng }) } : null,
    matchedLocation: Boolean(matchedLocation),
    nearMe,
    skills: data.skills,
    total: data.total,
  };
}
