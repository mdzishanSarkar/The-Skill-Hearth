import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { User, Skill, SkillDemandSnapshot } from '../src/models';
import { computeAndSaveSnapshot, getLatestSnapshot } from '../src/services/skillDemand.service';

let user: any = null;

test.before(async () => {
  await mongoose.connect('mongodb://localhost:27017/skillshare-local');
  await SkillDemandSnapshot.deleteMany({});
  user = await User.create({
    email: 'demand-test@test.local',
    passwordHash: 'password123',
    username: 'demandtest',
    displayName: 'Demand Test',
    status: 'active',
  });
});

test.after(async () => {
  await SkillDemandSnapshot.deleteMany({});
  await Skill.deleteMany({ userId: user._id });
  await User.deleteOne({ _id: user._id });
  await mongoose.disconnect();
});

test('computeAndSaveSnapshot aggregates learn skills into ranked demand', async () => {
  // 3 learners of "Pottery", 2 of "Calligraphy", in distinct neighborhoods.
  const learners: any[] = [];
  for (let i = 0; i < 5; i++) {
    learners.push(
      await User.create({
        email: `demand-l${i}@test.local`,
        passwordHash: 'password123',
        username: `demandl${i}`,
        displayName: `Learner ${i}`,
        status: 'active',
      })
    );
  }
  await Skill.create({
    userId: user._id,
    type: 'learn',
    categoryId: new mongoose.Types.ObjectId(),
    categoryName: 'Craft',
    skillName: 'Pottery',
    proficiencyLevel: 'beginner',
    format: 'in-person',
    sessionLength: '1hr',
    location: { neighborhood: 'Old Town' },
  });
  for (let i = 0; i < 3; i++) {
    await Skill.create({
      userId: learners[i]._id,
      type: 'learn',
      categoryId: new mongoose.Types.ObjectId(),
      categoryName: 'Craft',
      skillName: 'Pottery',
      proficiencyLevel: 'beginner',
      format: 'in-person',
      sessionLength: '1hr',
      location: { neighborhood: `District ${i}` },
    });
  }
  for (let i = 0; i < 2; i++) {
    await Skill.create({
      userId: learners[i]._id,
      type: 'learn',
      categoryId: new mongoose.Types.ObjectId(),
      categoryName: 'Languages',
      skillName: 'Calligraphy',
      proficiencyLevel: 'beginner',
      format: 'in-person',
      sessionLength: '1hr',
      location: { neighborhood: `District ${i}` },
    });
  }

  const snapshot = await computeAndSaveSnapshot();

  const pottery = snapshot.skills.find((s) => s.skillName === 'Pottery');
  const calligraphy = snapshot.skills.find((s) => s.skillName === 'Calligraphy');
  assert.ok(pottery, 'Pottery should appear');
  assert.ok(calligraphy, 'Calligraphy should appear');
  assert.equal(pottery.demandScore, 4);
  assert.equal(calligraphy.demandScore, 2);
  assert.ok(pottery.topRegions.length >= 1, 'top regions should be populated');
  assert.equal(pottery.topRegions[0].count, Math.max(...pottery.topRegions.map((r) => r.count)));
  assert.ok(snapshot.skills[0].demandScore >= snapshot.skills[snapshot.skills.length - 1].demandScore, 'sorted desc');

  await Skill.deleteMany({ userId: { $in: learners.map((l) => l._id) } });
  await User.deleteMany({ _id: { $in: learners.map((l) => l._id) } });
});

test('getLatestSnapshot returns the saved snapshot', async () => {
  const latest = await getLatestSnapshot();
  assert.ok(latest);
  assert.ok(latest.skills.length >= 2);
  assert.ok(latest.windowStart instanceof Date, 'windowStart should be a Date');
});
