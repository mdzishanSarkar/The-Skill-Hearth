import { SavedSearch } from '../models';
import { HttpError } from '../utils/errors';

export async function saveSearch(
  userId: string,
  name: string,
  filters: {
    category?: string;
    format?: string;
    type?: 'teach' | 'learn';
    radius?: number;
    availability?: string[];
    proficiencyLevel?: string;
  },
  alertEnabled = false,
) {
  if (!name.trim()) throw new HttpError(400, 'VALIDATION_ERROR', 'Search name is required');

  const search = await SavedSearch.create({
    userId,
    name: name.trim().slice(0, 60),
    filters,
    alertEnabled,
  });

  return search.toJSON();
}

export async function listSavedSearches(userId: string) {
  return SavedSearch.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function updateSavedSearch(
  searchId: string,
  userId: string,
  updates: { name?: string; alertEnabled?: boolean },
) {
  const search = await SavedSearch.findById(searchId);
  if (!search) throw new HttpError(404, 'NOT_FOUND', 'Saved search not found');
  if (String(search.userId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Not your saved search');
  }

  if (updates.name !== undefined) search.name = updates.name.trim().slice(0, 60);
  if (updates.alertEnabled !== undefined) search.alertEnabled = updates.alertEnabled;
  await search.save();
  return search.toJSON();
}

export async function deleteSavedSearch(searchId: string, userId: string) {
  const result = await SavedSearch.deleteOne({ _id: searchId, userId });
  if (result.deletedCount === 0) {
    throw new HttpError(404, 'NOT_FOUND', 'Saved search not found');
  }
  return { success: true };
}
