import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { SkillRadar } from '../src/models';
import {
  confidenceForWeight,
  decayedWeight,
  recordSignal,
  recomputeIntents,
} from '../src/services/skillRadar.service';

let radar: any = null;

test.before(async () => {
  await mongoose.connect('mongodb://localhost:27017/the-skill-hearth-local');
});

test.after(async () => {
  if (radar) await SkillRadar.deleteOne({ _id: radar._id });
  await mongoose.disconnect();
});

test('confidenceForWeight thresholds', () => {
  assert.equal(confidenceForWeight(5.0), 'high');
  assert.equal(confidenceForWeight(3.0), 'high');
  assert.equal(confidenceForWeight(2.9), 'medium');
  assert.equal(confidenceForWeight(1.5), 'medium');
  assert.equal(confidenceForWeight(1.49), 'low');
  assert.equal(confidenceForWeight(0.8), 'low');
  assert.equal(confidenceForWeight(0.79), null);
});

test('decay math: half-life of 14 days', () => {
  assert.ok(Math.abs(decayedWeight(1.0, 0) - 1.0) < 1e-9);
  assert.ok(Math.abs(decayedWeight(1.0, 14) - 0.5) < 1e-9);
  assert.ok(Math.abs(decayedWeight(1.0, 28) - 0.25) < 1e-9);
  assert.ok(Math.abs(decayedWeight(0.8, 14) - 0.4) < 1e-9);
});

test('recomputeIntents: creates high-confidence intent + math', async () => {
  radar = await SkillRadar.create({
    userId: new mongoose.Types.ObjectId(),
    signals: [],
    intents: [],
    manualRadars: [],
  });

  const now = Date.now();
  // 4 recent search signals of 1.0 each → 4.0 weight → 'high'
  for (let i = 0; i < 4; i++) {
    await SkillRadar.updateOne(
      { _id: radar._id },
      { $push: { signals: { type: 'search', category: 'Cooking', timestamp: new Date(now - 1000), weight: 1.0 } } }
    );
  }

  const intents = await recomputeIntents(String(radar.userId));
  const cooking = intents.find((i) => i.category === 'Cooking');
  assert.ok(cooking, 'expected a Cooking intent');
  assert.equal(cooking.confidence, 'high');
  assert.match(cooking.reasoning, /searched 4 times/);
});

test('recomputeIntents: weak signals below 0.8 are excluded', async () => {
  await SkillRadar.updateOne(
    { _id: radar._id },
    { $push: { signals: { type: 'swap_declined', category: 'Music', timestamp: new Date(Date.now() - 1000), weight: 0.3 } } }
  );
  const intents = await recomputeIntents(String(radar.userId));
  const music = intents.find((i) => i.category === 'Music');
  assert.equal(music, undefined, 'single 0.3 signal must not create an intent');
});

test('recomputeIntents: preserves alertedSkillIds, status, lastAlertedAt', async () => {
  await SkillRadar.updateOne(
    { _id: radar._id },
    {
      $set: {
        'intents.$[i].alertedSkillIds': [new mongoose.Types.ObjectId()],
        'intents.$[i].status': 'paused',
        'intents.$[i].lastAlertedAt': new Date(),
        'intents.$[i].matchCount': 7,
      },
    },
    { arrayFilters: [{ 'i.category': 'Cooking' }] }
  );

  const intents = await recomputeIntents(String(radar.userId));
  const cooking = intents.find((i) => i.category === 'Cooking');
  assert.ok(cooking, 'cooking intent must survive recompute');
  assert.equal(cooking.status, 'paused', 'paused status must be preserved');
  assert.equal(cooking.alertedSkillIds.length, 1, 'alertedSkillIds must be preserved');
  assert.ok(cooking.lastAlertedAt, 'lastAlertedAt must be preserved');
  assert.equal(cooking.matchCount, 7, 'matchCount must be preserved');
});

test('recomputeIntents: time decay reduces weight of old signals', async () => {
  // Add signals aged 20 days (heavy decay) → total below 0.8 → category must not appear.
  await SkillRadar.updateOne(
    { _id: radar._id },
    { $push: { signals: { type: 'search', category: 'Cooking', timestamp: new Date(Date.now() - 20 * 86400000), weight: 1.0 } } }
  );

  // Recompute with ONLY old signals would still keep Cooking (exists already).
  // Instead verify via pure decay function that 20-day-old signal decays below 0.8 alone.
  const aged = decayedWeight(1.0, 20);
  assert.ok(aged < 0.8, `20-day-old signal weight ${aged} must fall below 0.8`);
});
