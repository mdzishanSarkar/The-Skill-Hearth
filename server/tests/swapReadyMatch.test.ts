import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { User, Skill, SkillSwap, SwapReadyMatch, Block } from '../src/models';
import {
  recomputeMatchesForUser,
  getAvailableMatches,
  hideMatch,
  proposeMatch,
} from '../src/services/swapReadyMatch.service';
import { blockUser } from '../src/services/block.service';

let userA: any = null;
let userB: any = null;
let skillBTeach: any = null;

async function makeUser(seed: string) {
  const email = `swapmatch-${seed}@test.local`;
  await User.deleteMany({ email });
  return User.create({
    email,
    passwordHash: 'password123',
    username: `swapmatch_${seed}`,
    displayName: `Swap ${seed}`,
    status: 'active',
  });
}

async function makeSkill(userId: any, type: 'teach' | 'learn', name: string) {
  return Skill.create({
    userId,
    type,
    categoryId: new mongoose.Types.ObjectId(),
    categoryName: 'Craft',
    skillName: name,
    proficiencyLevel: 'intermediate',
    format: 'online',
    sessionLength: '1hr',
    location: { coordinates: [90.39, 23.81] },
  });
}

test.before(async () => {
  await mongoose.connect('mongodb://localhost:27017/the-skill-hearth-local');
  await SwapReadyMatch.deleteMany({});
  await SkillSwap.deleteMany({});
  userA = await makeUser('a');
  userB = await makeUser('b');
  await makeSkill(userA._id, 'teach', 'Cooking Basics');
  await makeSkill(userA._id, 'learn', 'Knitting');
  skillBTeach = await makeSkill(userB._id, 'teach', 'Knitting');
  await makeSkill(userB._id, 'learn', 'Cooking Basics');
});

test.after(async () => {
  await SwapReadyMatch.deleteMany({});
  await SkillSwap.deleteMany({});
  await Skill.deleteMany({ userId: { $in: [userA._id, userB._id] } });
  await Block.deleteMany({});
  await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
  await mongoose.disconnect();
});

test('recompute creates exactly one reciprocal match visible to both users', async () => {
  await recomputeMatchesForUser(String(userA._id));
  const matchesA = await getAvailableMatches(String(userA._id));
  const matchesB = await getAvailableMatches(String(userB._id));

  assert.equal(matchesA.length, 1, 'user A should see exactly one match');
  assert.equal(matchesB.length, 1, 'user B should see exactly one match');

  const m = matchesA[0];
  assert.equal(m.status, 'available');

  const aIsA = String(m.userAId._id) === String(userA._id);
  const aTeach = String((aIsA ? m.userATeachesSkillId : m.userBTeachesSkillId).skillName);
  const bTeach = String((aIsA ? m.userBTeachesSkillId : m.userATeachesSkillId).skillName);
  assert.equal(aTeach, 'Cooking Basics');
  assert.equal(bTeach, 'Knitting');
});

test('hiding a match survives recompute', async () => {
  const matches = await getAvailableMatches(String(userA._id));
  assert.equal(matches.length, 1);
  await hideMatch(String(matches[0]._id), String(userA._id));

  await recomputeMatchesForUser(String(userA._id));
  const after = await getAvailableMatches(String(userA._id));
  assert.equal(after.length, 0, 'hidden match must not come back');

  const stored = await SwapReadyMatch.findById(matches[0]._id).lean();
  assert.equal(stored?.status, 'hidden', 'hidden status must be preserved');

  await SwapReadyMatch.deleteMany({}); // reset for the next test
});

test('proposeMatch creates a SkillSwap and marks the match proposed', async () => {
  await recomputeMatchesForUser(String(userA._id));
  const matches = await getAvailableMatches(String(userA._id));
  assert.equal(matches.length, 1);

  const { swap } = await proposeMatch(String(matches[0]._id), String(userA._id));
  assert.ok(swap, 'a SkillSwap should be created');

  const stored = await SwapReadyMatch.findById(matches[0]._id).lean();
  assert.equal(stored?.status, 'proposed');

  const swaps = await SkillSwap.find({});
  assert.equal(swaps.length, 1, 'one swap should exist');
  assert.equal(swaps[0].status, 'suggested');

  await assert.rejects(
    () => proposeMatch(String(matches[0]._id), String(userA._id)),
    /no longer available/i,
  );

  await SwapReadyMatch.deleteMany({});
  await SkillSwap.deleteMany({});
});

test('blocks exclude matches (both directions)', async () => {
  await recomputeMatchesForUser(String(userA._id));
  assert.equal((await getAvailableMatches(String(userA._id))).length, 1);

  await blockUser(String(userA._id), String(userB._id));
  await recomputeMatchesForUser(String(userA._id));
  const matches = await getAvailableMatches(String(userA._id));
  assert.equal(matches.length, 0, 'blocked match must not appear');

  await Block.deleteMany({});
  await SwapReadyMatch.deleteMany({});
});

test('stale matches are cleaned up when a skill becomes invalid', async () => {
  await recomputeMatchesForUser(String(userA._id));
  assert.equal((await getAvailableMatches(String(userA._id))).length, 1);

  await Skill.updateOne({ _id: skillBTeach._id }, { $set: { isDeleted: true } });
  await recomputeMatchesForUser(String(userA._id));
  const after = await getAvailableMatches(String(userA._id));
  assert.equal(after.length, 0, 'stale match must be cleaned up');
  await Skill.updateOne({ _id: skillBTeach._id }, { $set: { isDeleted: false } });
});
