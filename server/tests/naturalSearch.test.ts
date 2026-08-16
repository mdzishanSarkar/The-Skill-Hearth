import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Skill, User } from '../src/models';
import { naturalSearch, parseQuery } from '../src/services/naturalSearch.service';
import { blockUser } from '../src/services/block.service';

let viewer: any = null;
let teacher: any = null;
let skill: any = null;

const CATEGORY_ID = new mongoose.Types.ObjectId();
const VIEWER_COORDS: [number, number] = [90.4125, 23.8103];
const TEACHER_COORDS: [number, number] = [90.4145, 23.8113];

test.before(async () => {
  await mongoose.connect('mongodb://localhost:27017/skillshare-local');
  viewer = await User.create({
    email: 'nl-viewer@test.local',
    username: 'nlviewer',
    displayName: 'NL Viewer',
    passwordHash: 'password123',
    status: 'active',
    isEmailVerified: true,
    location: { city: 'dhaka', neighborhood: 'gulshan', coordinates: VIEWER_COORDS, radiusPreference: 5 },
  });
  teacher = await User.create({
    email: 'nl-teacher@test.local',
    username: 'nlteacher',
    displayName: 'NL Teacher',
    passwordHash: 'password123',
    status: 'active',
    isEmailVerified: true,
    showOnMap: true,
    location: { city: 'dhaka', neighborhood: 'gulshan', coordinates: TEACHER_COORDS },
  });
  skill = await Skill.create({
    userId: teacher._id,
    type: 'teach',
    categoryId: CATEGORY_ID,
    categoryName: 'Textile & Craft',
    skillName: 'Mock Knitting Basics',
    proficiencyLevel: 'beginner',
    format: 'in-person',
    sessionLength: '1hr',
    isActive: true,
    isDeleted: false,
    description: 'learn mock knitting',
    location: { city: 'dhaka', neighborhood: 'gulshan', coordinates: TEACHER_COORDS },
  });
});

test.after(async () => {
  await Skill.deleteOne({ _id: skill._id });
  await User.deleteMany({ _id: { $in: [viewer._id, teacher._id] } });
  await mongoose.disconnect();
});

test('parseQuery extracts the named location and the skill keywords', () => {
  const parsed = parseQuery('knitting classes in gulshan');
  assert.equal(parsed.skillQuery.trim(), 'knitting classes in');
  assert.equal(parsed.locationQuery, 'gulshan');
  assert.equal(parsed.nearMe, false);
});

test('parseQuery detects "near me"', () => {
  const parsed = parseQuery('gardening near me');
  assert.equal(parsed.skillQuery, 'gardening');
  assert.equal(parsed.nearMe, true);
  assert.equal(parsed.locationQuery, null);
});

test('naturalSearch finds matching skills near the viewer, sanitized', async () => {
  const result = await naturalSearch('mock knitting', String(viewer._id));
  assert.ok(result.total >= 1);
  const match = result.skills.find((s) => s.skillName === 'Mock Knitting Basics');
  assert.ok(match, 'expected the mock skill in results');
  assert.ok('distanceKm' in match && typeof match.distanceKm === 'number');
  assert.equal((match as Record<string, unknown>).passwordHash, undefined);
  assert.equal((match.teacher as Record<string, unknown> | undefined)?.passwordHash, undefined);
  assert.equal(result.matchedLocation, false);
  assert.equal(result.nearMe, false);
});

test('naturalSearch excludes blocked teachers for the viewer', async () => {
  await blockUser(String(viewer._id), String(teacher._id));
  const result = await naturalSearch('mock knitting', String(viewer._id));
  assert.ok(!result.skills.some((s) => s.skillName === 'Mock Knitting Basics'));
});
