import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import { getCategories } from '../../services/skills';
import { geocodePlace, getMapPins } from '../../services/discovery';
import { getApiError } from '../../types/api.types';
import { formatDistanceShort } from '../../utils/formatDistance';
import { getSkillEmoji } from '../../data/skillVisuals';
import type { Category } from '../../types/skill.types';
import type { MapPin, MapSkillType } from '../../types/discovery.types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import MapView from '../../components/map/MapView';
import MapFilters from '../../components/map/MapFilters';

const DEFAULT_RADIUS_KM = 10;
const DEFAULT_CENTER: [number, number] = [90.4125, 23.8103];

export default function MapDiscoveryPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [type, setType] = useState<MapSkillType>('teach');
  const [availability, setAvailability] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fallbackQuery, setFallbackQuery] = useState('');
  const [fallbackError, setFallbackError] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showList, setShowList] = useState(false);

  // Derive stored location from the authenticated user
  const hasStoredCoords = Boolean(
    user?.location.coordinates &&
      (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0),
  );
  const storedLabel = `${user?.location.neighborhood || user?.location.city || ''}`.trim();

  const geo = useGeolocation({
    storedCoordinates: hasStoredCoords && user ? user.location.coordinates : null,
    storedLabel,
    autoRequest: !hasStoredCoords,
  });

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const load = useCallback(async () => {
    const [lng, lat] = geo.coordinates ?? DEFAULT_CENTER;
    setLoading(true);
    setError('');
    try {
      const pinsResult = await getMapPins({
        lat,
        lng,
        radiusKm,
        type,
        availability: availability || undefined,
        categoryIds: selectedCategoryIds.length ? selectedCategoryIds : undefined,
      });
      setPins(pinsResult);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [geo.coordinates, radiusKm, type, availability, selectedCategoryIds]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
  }

  function handleResetFilters() {
    setSelectedCategoryIds([]);
    setType('teach');
    setAvailability(false);
    setRadiusKm(DEFAULT_RADIUS_KM);
  }

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearching(true);
    setError('');
    try {
      const place = await geocodePlace(query);
      if (!place) {
        setError(`No place found for "${query}". Try a city or neighborhood name.`);
        return;
      }
      geo.setFromGeocode(place.lng, place.lat, place.label, place.displayName);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSearching(false);
    }
  }

  async function handleFallbackSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = fallbackQuery.trim();
    if (!query) return;
    setGeocoding(true);
    setFallbackError('');
    try {
      const place = await geocodePlace(query);
      if (!place) {
        setFallbackError(`No place found for "${query}". Try a different city or neighborhood.`);
        return;
      }
      geo.setFromGeocode(place.lng, place.lat, place.label, place.displayName);
    } catch (err) {
      setFallbackError(getApiError(err));
    } finally {
      setGeocoding(false);
    }
  }

  return (
    <div className="relative h-[calc(100vh-57px)] w-full overflow-hidden">
      <MapView
        pins={pins}
        center={geo.coordinates ?? DEFAULT_CENTER}
        isAuthenticated={isAuthenticated}
      />

      <div className="pointer-events-none absolute inset-0 z-10 flex">
        <div className="pointer-events-auto flex flex-col gap-3 p-4">
          <form
            onSubmit={handleSearch}
            className="w-72 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur"
          >
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city or neighborhood"
                className="flex-1"
              />
              <Button type="submit" size="sm" loading={searching} className="shrink-0">
                Search
              </Button>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2 w-full"
              onClick={geo.requestGeolocation}
            >
              Near me
            </Button>
            {geo.placedAt && (
              <p className="mt-2 truncate text-xs text-gray-500" title={geo.placedAtFull || geo.placedAt}>
                Showing around: {geo.placedAt}
              </p>
            )}
          </form>

          <div className="w-72">
            <MapFilters
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
              onToggleCategory={toggleCategory}
              type={type}
              onTypeChange={setType}
              availability={availability}
              onAvailabilityChange={setAvailability}
              radiusKm={radiusKm}
              onRadiusChange={setRadiusKm}
              onReset={handleResetFilters}
            />
          </div>
        </div>

        <div className="pointer-events-auto ml-auto flex flex-col items-end gap-3 p-4">
          {geo.status === 'found' && (
            <div className="pointer-events-none flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50/95 px-3 py-1.5 text-xs font-medium text-green-700 shadow backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {geo.placedAt ? `Near ${geo.placedAt}` : 'Using your location'}
            </div>
          )}
          {geo.status === 'denied' && (
            <div className="pointer-events-none flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-600 shadow backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              Location off — searching from a place
            </div>
          )}
          {geo.status === 'found' && pins.length > 0 && (
            <div className="pointer-events-none rounded-full border border-gray-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-700 shadow backdrop-blur">
              {pins.length} skill{pins.length === 1 ? '' : 's'} found
            </div>
          )}
          {pins.length > 0 && (
            <button
              type="button"
              onClick={() => setShowList((prev) => !prev)}
              aria-expanded={showList}
              aria-controls="map-skills-list"
              className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/95 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow backdrop-blur hover:bg-indigo-100"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
              </svg>
              {showList ? 'Hide list' : `Skills list (${pins.length})`}
            </button>
          )}
          {showList && pins.length > 0 && (
            <div
              id="map-skills-list"
              className="pointer-events-auto flex w-72 max-h-[55vh] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white/95 shadow-lg backdrop-blur"
            >
              <div className="border-b border-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-500">
                {pins.length} skill{pins.length === 1 ? '' : 's'} in this area
              </div>
              <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {pins.map((pin) => (
                  <li key={pin.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/skills/${pin.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-indigo-50/60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-base">
                        {getSkillEmoji(pin.categoryName, pin.skillName)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {pin.skillName}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {pin.teacher.displayName} · {pin.categoryName}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-gray-400">
                        {pin.distanceKm !== undefined ? formatDistanceShort(pin.distanceKm) : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs text-gray-600 shadow backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-2.5 rounded-sm border-2 border-indigo-600 bg-white" />
                Can teach
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-2.5 rounded-sm border-2 border-amber-500 bg-white" />
                Want to learn
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs text-gray-600 shadow backdrop-blur">
            <Link to="/skills" className="font-medium text-indigo-600 hover:text-indigo-500">
              Browse as a list
            </Link>
            <span className="mx-2 text-gray-300">·</span>
            <Link to="/edit-profile" className="font-medium text-indigo-600 hover:text-indigo-500">
              Manage map visibility
            </Link>
          </div>
        </div>
      </div>

      {loading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="rounded-full bg-white/90 px-4 py-2 shadow">
            <Spinner size="sm" />
          </div>
        </div>
      )}

      {error && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
          <p className="pointer-events-auto rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 shadow">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && pins.length === 0 && geo.status !== 'asking' && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="pointer-events-auto mx-4 w-full max-w-sm rounded-xl border border-gray-200 bg-white/95 p-6 text-center shadow-lg backdrop-blur">
            <p className="text-lg">🔍</p>
            <h2 className="mt-2 text-sm font-semibold text-gray-900">
              No skills found in this area
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Try widening the radius, switching to “Want to learn”, or clearing the category filters.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                Reset filters
              </Button>
              <Button
                size="sm"
                onClick={() => setRadiusKm((prev) => Math.min(20, prev + 5))}
              >
                Widen radius
              </Button>
            </div>
          </div>
        </div>
      )}

      {geo.status === 'asking' && (
        <div className="pointer-events-auto absolute inset-0 z-[1000] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Find skills near you</h2>
            <p className="mt-2 text-sm text-gray-600">
              We use your location to show skills near you. Your exact location is never stored or
              shown to others — pins on the map are placed on a privacy grid, not your precise spot.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={geo.requestGeolocation}>Allow location</Button>
              <Button variant="secondary" onClick={geo.denyLocation}>
                Enter location manually
              </Button>
            </div>
          </div>
        </div>
      )}

      {geo.status === 'denied' && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-16 flex justify-center px-4">
          <form
            onSubmit={handleFallbackSearch}
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur"
          >
            <p className="text-sm font-medium text-gray-800">
              Enter your city or neighborhood to find skills nearby
            </p>
            <div className="mt-2 flex gap-2">
              <Input
                value={fallbackQuery}
                onChange={(e) => setFallbackQuery(e.target.value)}
                placeholder="e.g. Alfama, Lisbon"
                className="flex-1"
              />
              <Button type="submit" size="sm" loading={geocoding} className="shrink-0">
                Search
              </Button>
            </div>
            {fallbackError && <p className="mt-2 text-xs text-red-600">{fallbackError}</p>}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              onClick={geo.requestGeolocation}
            >
              Use my location instead
            </Button>
            <p className="mt-2 text-xs text-gray-400">
              Your exact location is never stored or shown to others.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
