import type { Category } from '../../types/skill.types';
import type { MapSkillType } from '../../types/discovery.types';
import { getCategoryVisual } from '../../data/skillVisuals';

interface MapFiltersProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onToggleCategory: (categoryId: string) => void;
  type: MapSkillType;
  onTypeChange: (type: MapSkillType) => void;
  availability: boolean;
  onAvailabilityChange: (availability: boolean) => void;
  radiusKm: number;
  onRadiusChange: (radiusKm: number) => void;
  onReset: () => void;
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
}: MapFiltersProps) {
  const hasActiveFilters = selectedCategoryIds.length > 0 || availability;

  return (
    <div className="w-64 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            Reset
          </button>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-gray-500">Searching for</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onTypeChange('teach')}
            className={
              type === 'teach'
                ? 'flex-1 rounded-md bg-indigo-600 px-2 py-1.5 text-xs font-medium text-white shadow-sm'
                : 'flex-1 rounded-md bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200'
            }
          >
            Can teach
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('learn')}
            className={
              type === 'learn'
                ? 'flex-1 rounded-md bg-amber-500 px-2 py-1.5 text-xs font-medium text-white shadow-sm'
                : 'flex-1 rounded-md bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200'
            }
          >
            Want to learn
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label htmlFor="map-radius" className="text-xs font-medium text-gray-500">
            Radius
          </label>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
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
          className="mt-2 w-full accent-indigo-600"
        />
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={availability}
          onChange={(e) => onAvailabilityChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-600"
        />
        Available now
      </label>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="text-xs font-medium text-gray-500">Categories</p>
        {categories.length === 0 ? (
          <p className="mt-2 text-xs text-gray-400">No categories available.</p>
        ) : (
          <div className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
            {categories.map((category) => {
              const visual = getCategoryVisual(category.name);
              const checked = selectedCategoryIds.includes(category._id);
              return (
                <label
                  key={category._id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleCategory(category._id)}
                    className="h-4 w-4 accent-indigo-600"
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
