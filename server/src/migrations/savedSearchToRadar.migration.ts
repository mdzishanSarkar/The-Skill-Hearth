import mongoose from 'mongoose';
import { SavedSearch, SkillRadar } from '../models';

export async function migrateSavedSearchesToRadar(): Promise<{ migrated: number; users: number }> {
  const savedSearches = await SavedSearch.find({});
  let migrated = 0;
  const affectedUsers = new Set<string>();

  for (const savedSearch of savedSearches) {
    const userId = savedSearch.userId;
    affectedUsers.add(String(userId));

    let radar = await SkillRadar.findOne({ userId });
    if (!radar) {
      radar = await SkillRadar.create({ userId, signals: [], intents: [], manualRadars: [] });
    }

    const name = savedSearch.name?.trim() || 'Imported Search';
    const alreadyImported = radar.manualRadars.some((m) => m.name === name);
    if (alreadyImported) continue;

    radar.manualRadars.push({
      name,
      filters: {
        category: savedSearch.filters?.category,
        type: savedSearch.filters?.type,
        format: savedSearch.filters?.format,
        proficiencyLevel: savedSearch.filters?.proficiencyLevel,
        radius: savedSearch.filters?.radius,
        availability: savedSearch.filters?.availability,
      },
      lastAlertedAt: savedSearch.lastAlertSentAt || savedSearch.createdAt,
      alertedSkillIds: savedSearch.matchedSkillIds || [],
    });

    await radar.save();
    migrated++;
  }

  return { migrated, users: affectedUsers.size };
}

export async function runMigrationIfNeeded(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');

  const logs = db.collection('migrationlogs');
  const existing = await logs.findOne({ name: 'savedSearchToRadar_v1' });
  if (existing) {
    console.log('[Migration] savedSearchToRadar_v1 already applied, skipping');
    return;
  }

  const { migrated, users } = await migrateSavedSearchesToRadar();
  await logs.insertOne({
    name: 'savedSearchToRadar_v1',
    completedAt: new Date(),
    migrated,
    users,
  });
  console.log(`[Migration] savedSearchToRadar_v1 complete: ${migrated} saved searches → manual radars for ${users} user(s)`);
}
