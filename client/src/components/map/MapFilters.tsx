import type { Category } from '../../types/skill.types';
import type { MapFilterType } from '../../types/discovery.types';
import { getCategoryVisual } from '../../data/skillVisuals';

interface MapFiltersProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onToggleCategory: (categoryId: string) => void;
  type: MapFilterType;
  onTypeChange: (type: MapFilterType) => void;
  availability: boolean;
  onAvailabilityChange: (availability: boolean) => void;
  radiusKm: number;
  onRadiusChange: (radiusKm: number) => void;
  onReset: () => void;
  night?: boolean;
}

export default function MapFilters({
  categories,
  selectedCategoryIds,
  onToggleCategory,
  type,
  onTypeChange,
  availability,
  onAvailabilityChange,
  radiusKm,
  onRadiusChange,
  onReset,
  night = false,
}: MapFiltersProps) {
  const hasActiveFilters = selectedCategoryIds.length > 0 || availability;

  const panelClass = night
    ? 'border-gray-700 bg-gray-900/95 text-gray-100'
    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/95 text-gray-900 dark:text-gray-100';
  const mutedClass = night ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400';
  const itemClass = night
    ? 'text-gray-200 hover:bg-gray-800'
    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800';
  const idleButtonClass = night
    ? 'flex-1 rounded-md bg-gray-800 px-2 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700'
    : 'flex-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700';
  const radiusBadgeClass = night
    ? 'rounded-full bg-blue-900/60 px-2 py-0.5 text-xs font-semibold text-blue-300'
    : 'rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400';
  const dividerClass = night ? 'border-gray-800' : 'border-gray-100';

  return (
    <div className={`w-full max-h-[calc(100dvh-18rem)] overflow-y-auto rounded-xl border p-4 shadow-lg backdrop-blur sm:w-64 sm:max-h-none sm:overflow-visible ${panelClass}`}>
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-semibold ${night ? 'text-gray-100' : 'text-gray-900 dark:text-gray-100'}`}>Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className={`text-xs font-medium ${night ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 dark:text-blue-400 hover:text-blue-500'}`}
          >
            Reset
          </button>
        )}
      </div>

      <div className="mt-4">
        <p className={`text-xs font-medium ${mutedClass}`}>Searching for</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onTypeChange('both')}
            className={
              type === 'both'
                ? night
                  ? 'flex-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1.5 text-xs font-medium text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'flex-1 rounded-md bg-gray-800 px-2 py-1.5 text-xs font-medium text-white shadow-sm'
                : idleButtonClass
            }
          >
            All skills
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('teach')}
            className={
              type === 'teach'
                ? 'flex-1 rounded-md bg-blue-600 px-2 py-1.5 text-xs font-medium text-white shadow-sm'
                : idleButtonClass
            }
          >
            Can teach
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('learn')}
            className={
              type === 'learn'
                ? 'flex-1 rounded-md bg-orange-500 px-2 py-1.5 text-xs font-medium text-white shadow-sm'
                : idleButtonClass
            }
          >
            Want to learn
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label htmlFor="map-radius" className={`text-xs font-medium ${mutedClass}`}>
            Radius
          </label>
          <span className={radiusBadgeClass}>
            {radiusKm} km
          </span>
        </div>
        <input
          id="map-radius"
          type="range"
          min={1}
          max={20}
          step={1}
          value={radiusKm}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="mt-2 w-full accent-blue-600"
        />
      </div>

      <label className={`mt-4 flex cursor-pointer items-center gap-2 text-sm ${night ? 'text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}>
        <input
          type="checkbox"
          checked={availability}
          onChange={(e) => onAvailabilityChange(e.target.checked)}
          className="h-4 w-4 accent-blue-600"
        />
        Available now
      </label>

      <div className={`mt-4 border-t pt-4 ${dividerClass}`}>
        <p className={`text-xs font-medium ${mutedClass}`}>Categories</p>
        {categories.length === 0 ? (
          <p className={`mt-2 text-xs ${night ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>No categories available.</p>
        ) : (
          <div className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
            {categories.map((category) => {
              const visual = getCategoryVisual(category.name);
              const checked = selectedCategoryIds.includes(category._id);
              return (
                <label
                  key={category._id}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm ${itemClass}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleCategory(category._id)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="truncate">
                    {visual.emoji} {category.name}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
