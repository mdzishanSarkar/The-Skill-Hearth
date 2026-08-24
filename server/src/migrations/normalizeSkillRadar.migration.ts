import mongoose from 'mongoose';

const SIGNAL_TYPE_MAP: Record<string, string> = {
  view: 'skill_view',
  connection_request: 'message_sent',
};

const VALID_SIGNAL_TYPES = new Set([
  'search',
  'skill_view',
  'profile_view',
  'category_browse',
  'swap_declined',
  'message_sent',
  'endorsement_given',
]);

function normalizeConfidence(value: unknown): string | undefined {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;

  const score = Number(value);
  if (!Number.isFinite(score)) return undefined;
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

export async function normalizeSkillRadarData(): Promise<number> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');

  const collection = db.collection('skillradars');
  let updated = 0;
  const cursor = collection.find({});

  for await (const radar of cursor) {
    let changed = false;
    const signals = (radar.signals ?? []).flatMap((signal: Record<string, unknown>) => {
      const type = SIGNAL_TYPE_MAP[String(signal.type)] ?? signal.type;
      if (!VALID_SIGNAL_TYPES.has(String(type))) {
        changed = true;
        return [];
      }
      if (type !== signal.type) changed = true;
      return { ...signal, type };
    });
    const intents = (radar.intents ?? []).map((intent: Record<string, unknown>) => {
      const confidence = normalizeConfidence(intent.confidence);
      if (!confidence) {
        changed = true;
        return { ...intent, confidence: 'low' };
      }
      if (confidence !== intent.confidence) changed = true;
      return { ...intent, confidence };
    });

    if (!changed) continue;
    await collection.updateOne({ _id: radar._id }, { $set: { signals, intents } });
    updated++;
  }

  return updated;
}

export async function runSkillRadarNormalizationIfNeeded(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');

  const logs = db.collection('migrationlogs');
  const name = 'normalizeSkillRadar_v1';
  if (await logs.findOne({ name })) {
    console.log(`[Migration] ${name} already applied, skipping`);
    return;
  }

  const updated = await normalizeSkillRadarData();
  await logs.insertOne({ name, completedAt: new Date(), updated });
  console.log(`[Migration] ${name} complete: normalized ${updated} radar(s)`);
}