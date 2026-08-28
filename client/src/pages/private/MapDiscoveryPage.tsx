import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import { getCategories } from '../../services/skills';
import { geocodePlace, getMapPins } from '../../services/discovery';
import { updateMe } from '../../services/users.service';
import { getApiError } from '../../types/api.types';
import { formatDistanceShort } from '../../utils/formatDistance';
import { getSkillEmoji } from '../../data/skillVisuals';
import type { Category } from '../../types/skill.types';
import type { MapFilterType, MapPin } from '../../types/discovery.types';
import type { UserMapPreferences } from '../../types/user.types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import MapView from '../../components/map/MapView';
import MapFilters from '../../components/map/MapFilters';

const DEFAULT_RADIUS_KM = 10;
const DEFAULT_CENTER: [number, number] = [90.4125, 23.8103];

export default function MapDiscoveryPage() {
  const { user, isAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();
  const didInteract = useRef(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [type, setType] = useState<MapFilterType>('both');
  const [availability, setAvailability] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fallbackQuery, setFallbackQuery] = useState('');
  const [fallbackError, setFallbackError] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [clusterMarkers, setClusterMarkers] = useState<boolean>(
    user?.mapPreferences?.clusterMarkers ?? true,
  );
  const [showList, setShowList] = useState<boolean>(user?.mapPreferences?.defaultView === 'list');
  const [recenterTick, setRecenterTick] = useState(0);

  useEffect(() => {
    if (user?.mapPreferences && !didInteract.current) {
      setClusterMarkers(user.mapPreferences.clusterMarkers ?? true);
      setShowList(user.mapPreferences.defaultView === 'list');
    }
  }, [user]);

  const night = false;
  const overlayPanel = night
    ? 'border-gray-700 bg-gray-900/95 text-gray-100'
    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/95 text-gray-900 dark:text-gray-100';
  const mutedText = night ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400';

  async function persistMapPreferences(patch: Partial<UserMapPreferences>) {
    if (!user) return;
    try {
      const updated = await updateMe({ mapPreferences: patch });
      setUser(updated);
    } catch {
      // Non-critical preference save; keep the local selection.
    }
  }

  function handleToggleCluster() {
    const next = !clusterMarkers;
    didInteract.current = true;
    setClusterMarkers(next);
    void persistMapPreferences({ clusterMarkers: next });
  }

  function handleToggleList() {
    const next = !showList;
    didInteract.current = true;
    setShowList(next);
    void persistMapPreferences({ defaultView: next ? 'list' : 'map' });
  }

  // Derive stored location from the authenticated user
  const hasStoredCoords = Boolean(
    user?.location.coordinates &&
      (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0),
  );
  const storedLabel = `${user?.location.neighborhood || user?.location.city || ''}`.trim();

  const geo = useGeolocation({
    storedCoordinates: hasStoredCoords && user ? user.location.coordinates : null,
    storedLabel,
    autoRequest: !hasStoredCoords && Boolean(user),
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
        type: type === 'both' ? undefined : type,
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
    setType('both');
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
    <div className="relative h-[calc(100dvh-64px)] w-full overflow-hidden">
      {geo.coordinates || !isAuthenticated ? (
        <MapView
          pins={pins}
          center={geo.coordinates ?? DEFAULT_CENTER}
          isAuthenticated={isAuthenticated}
          clusterMarkers={clusterMarkers}
          recenterSignal={recenterTick}
        />
      ) : (
        <div
          aria-hidden="true"
          className={`h-full w-full ${night ? 'bg-gray-950' : 'bg-slate-200 dark:bg-gray-950'}`}
        />
      )}

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-stretch gap-3 p-3 sm:flex-row sm:items-start sm:p-4">
        <div className="pointer-events-auto flex flex-col gap-3 sm:min-w-0">
          <form
            onSubmit={handleSearch}
            className={`w-full rounded-xl border p-3 shadow-lg backdrop-blur sm:w-72 sm:max-w-[calc(100vw-2.5rem)] ${overlayPanel}`}
          >
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city or neighborhood"
                className="flex-1"
                dark={night}
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
              <p className={`mt-2 truncate text-xs ${mutedText}`} title={geo.placedAtFull || geo.placedAt}>
                Showing around: {geo.placedAt}
              </p>
            )}
          </form>

          <button
            type="button"
            onClick={() => setShowFilters((visible) => !visible)}
            aria-expanded={showFilters}
            aria-controls="map-filters"
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold shadow-lg backdrop-blur sm:hidden ${overlayPanel}`}
          >
            <span>Filters</span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {showFilters ? 'Hide' : 'Show'}
            </span>
          </button>

          <div id="map-filters" className={`w-full sm:w-72 sm:max-w-[calc(100vw-2.5rem)] ${showFilters ? '' : 'hidden sm:block'}`}>
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
              night={night}
            />
          </div>
        </div>

        <div className="pointer-events-auto ml-auto flex w-full flex-col items-start gap-3 sm:w-auto sm:items-end">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleCluster}
              aria-label={clusterMarkers ? 'Show individual markers' : 'Cluster nearby markers'}
              title={clusterMarkers ? 'Show individual markers' : 'Cluster nearby markers'}
              className={`flex h-10 w-10 items-center justify-center rounded-full border shadow backdrop-blur transition-colors ${
                night
                  ? 'border-gray-700 bg-gray-900/95 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/95 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {clusterMarkers ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l9 5-9 5-9-5 9-5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9 5 9-5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l9 5 9-5" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-5.1-7-11a7 7 0 0114 0c0 5.9-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              )}
            </button>
          </div>
          {geo.status === 'found' && (
            <button
              type="button"
              onClick={() => setRecenterTick((t) => t + 1)}
              aria-label={geo.placedAt ? `Re-center to ${geo.placedAt}` : 'Re-center to your location'}
              title={geo.placedAt ? `Re-center to ${geo.placedAt}` : 'Re-center to your location'}
              className={`pointer-events-auto flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow backdrop-blur transition-colors ${
                night
                  ? 'border-green-800 bg-green-950/95 text-green-300 hover:bg-green-900'
                  : 'border-green-200 bg-green-50 dark:bg-green-950/40/95 text-green-700 dark:text-green-300 hover:bg-green-100'
              }`}
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <circle cx="12" cy="11" r="3" />
              </svg>
              {geo.placedAt ? `Near ${geo.placedAt}` : 'Using your location'}
            </button>
          )}
          {geo.status === 'denied' && (
            <div
              className={`pointer-events-none flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow backdrop-blur ${
                night
                  ? 'border-gray-700 bg-gray-900/95 text-gray-300'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/95 text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              Location off, searching from a place
            </div>
          )}
          {geo.status === 'found' && pins.length > 0 && (
            <div
              className={`pointer-events-none rounded-full border px-3 py-1.5 text-xs font-medium shadow backdrop-blur ${
                night
                  ? 'border-gray-700 bg-gray-900/95 text-gray-300'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/95 text-gray-700 dark:text-gray-300'
              }`}
            >
              {pins.length} skill{pins.length === 1 ? '' : 's'} found
            </div>
          )}
          {pins.length > 0 && (
            <button
              type="button"
              onClick={handleToggleList}
              aria-expanded={showList}
              aria-controls="map-skills-list"
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow backdrop-blur transition-colors ${
                night
                  ? 'border-blue-700 bg-blue-950/95 text-blue-300 hover:bg-blue-900'
                  : 'border-blue-200 bg-blue-50 dark:bg-blue-950/40/95 text-blue-700 dark:text-blue-400 hover:bg-blue-100'
              }`}
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
              className={`pointer-events-auto flex w-full max-h-[55vh] flex-col overflow-hidden rounded-xl border shadow-lg backdrop-blur sm:w-72 ${overlayPanel}`}
            >
              <div className={`border-b px-4 py-2.5 text-xs font-semibold ${night ? 'border-gray-800 text-gray-400 dark:text-gray-500' : 'border-gray-100 text-gray-500 dark:text-gray-400'}`}>
                {pins.length} skill{pins.length === 1 ? '' : 's'} in this area
              </div>
              <ul className={`flex-1 overflow-y-auto divide-y ${night ? 'divide-gray-800' : 'divide-gray-100 dark:divide-gray-800'}`}>
                {pins.map((pin) => (
                  <li key={pin.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/skills/${pin.id}`)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${
                        night ? 'hover:bg-blue-900/40' : 'hover:bg-blue-50/60'
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${night ? 'bg-gray-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        {getSkillEmoji(pin.categoryName, pin.skillName)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-medium ${night ? 'text-gray-100' : 'text-gray-900 dark:text-gray-100'}`}>
                          {pin.skillName}
                        </span>
                        <span className={`block truncate text-xs ${mutedText}`}>
                          {pin.teacher.displayName} · {pin.categoryName}
                        </span>
                      </span>
                      <span className={`shrink-0 text-xs ${night ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {pin.distanceKm !== undefined ? formatDistanceShort(pin.distanceKm) : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className={`w-full rounded-lg border px-3 py-2 text-xs shadow backdrop-blur sm:w-auto ${night ? 'border-gray-700 bg-gray-900/95 text-gray-300' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/95 text-gray-600 dark:text-gray-400'}`}>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className={`inline-block h-3 w-2.5 rounded-sm border-2 bg-white dark:bg-gray-900 ${night ? 'border-blue-400' : 'border-blue-600'}`} />
                Can teach
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`inline-block h-3 w-2.5 rounded-sm border-2 bg-white dark:bg-gray-900 ${night ? 'border-orange-400' : 'border-orange-500'}`} />
                Want to learn
              </span>
            </div>
          </div>
          <div className={`w-full rounded-lg border px-3 py-2 text-xs shadow backdrop-blur sm:w-auto ${night ? 'border-gray-700 bg-gray-900/95 text-gray-300' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/95 text-gray-600 dark:text-gray-400'}`}>
            <Link to="/skills" className={`font-medium ${night ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 dark:text-blue-400 hover:text-blue-500'}`}>
              Browse as a list
            </Link>
            <span className={`mx-2 ${night ? 'text-gray-600 dark:text-gray-400' : 'text-gray-300'}`}>·</span>
            <Link to="/edit-profile" className={`font-medium ${night ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 dark:text-blue-400 hover:text-blue-500'}`}>
              Manage map visibility
            </Link>
          </div>
        </div>
      </div>

      {loading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className={`rounded-full px-4 py-2 shadow ${night ? 'bg-gray-900/90' : 'bg-white dark:bg-gray-900/90'}`}>
            <Spinner size="sm" />
          </div>
        </div>
      )}

      {error && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
          <p className={`pointer-events-auto rounded-lg px-4 py-2 text-sm shadow ${night ? 'border border-red-800 bg-red-950/90 text-red-300' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'}`}>
            {error}
          </p>
        </div>
      )}

      {!loading && !error && pins.length === 0 && geo.status !== 'asking' && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className={`pointer-events-auto mx-4 w-full max-w-sm rounded-xl border p-6 text-center shadow-lg backdrop-blur ${overlayPanel}`}>
            <p className="text-lg">🔍</p>
            <h2 className={`mt-2 text-sm font-semibold ${night ? 'text-gray-100' : 'text-gray-900 dark:text-gray-100'}`}>
              No skills found in this area
            </h2>
            <p className={`mt-1 text-sm ${night ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
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
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Find skills near you</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              We use your location to show skills near you. Your exact location is never stored or
              shown to others. Pins on the map are placed on a privacy grid, not your precise spot.
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
            className={`w-full max-w-md rounded-xl border p-4 shadow-lg backdrop-blur ${overlayPanel}`}
          >
            <p className={`text-sm font-medium ${night ? 'text-gray-100' : 'text-gray-800 dark:text-gray-200'}`}>
              Enter your city or neighborhood to find skills nearby
            </p>
            <div className="mt-2 flex gap-2">
              <Input
                value={fallbackQuery}
                onChange={(e) => setFallbackQuery(e.target.value)}
                placeholder="e.g. Alfama, Lisbon"
                className="flex-1"
                dark={night}
              />
              <Button type="submit" size="sm" loading={geocoding} className="shrink-0">
                Search
              </Button>
            </div>
            {fallbackError && <p className={`mt-2 text-xs ${night ? 'text-red-400' : 'text-red-600 dark:text-red-400'}`}>{fallbackError}</p>}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              onClick={geo.requestGeolocation}
            >
              Use my location instead
            </Button>
            <p className={`mt-2 text-xs ${night ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
              Your exact location is never stored or shown to others.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
