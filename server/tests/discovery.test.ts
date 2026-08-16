import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Skill, User } from '../src/models';
import { getMapPins } from '../src/services/discovery';
import { blockUser } from '../src/services/block.service';

let viewer: any = null;
let teacherA: any = null;
let teacherB: any = null;
let skillA: any = null;
let skillB: any = null;

const CATEGORY_ID = new mongoose.Types.ObjectId();
const COORDS: [number, number] = [90.4125, 23.8103];

test.before(async () => {
  await mongoose.connect('mongodb://localhost:27017/skillshare-local');
  const base = { passwordHash: 'password123', status: 'active', location: { city: 'dhaka', neighborhood: 'gulshan' } };
  viewer = await User.create({ email: 'geo-viewer@test.local', username: 'geoviewer', displayName: 'Geo Viewer', ...base });
  teacherA = await User.create({
    email: 'geo-a@test.local',
    username: 'geoteachera',
    displayName: 'Geo Teacher A',
    ...base,
    showOnMap: true,
    location: { city: 'dhaka', neighborhood: 'gulshan', coordinates: COORDS },
  });
  teacherB = await User.create({
    email: 'geo-b@test.local',
    username: 'geoteacherb',
    displayName: 'Geo Teacher B',
    ...base,
    showOnMap: true,
    location: { city: 'dhaka', neighborhood: 'gulshan', coordinates: COORDS },
  });

  const skillBase = {
    type: 'teach',
    categoryId: CATEGORY_ID,
    categoryName: 'Craft',
    proficiencyLevel: 'beginner',
    format: 'in-person',
    sessionLength: '1hr',
    isActive: true,
    isDeleted: false,
    location: { city: 'dhaka', neighborhood: 'gulshan', coordinates: COORDS },
  };
  skillA = await Skill.create({ userId: teacherA._id, skillName: 'Geo Pottery A', ...skillBase });
  skillB = await Skill.create({ userId: teacherB._id, skillName: 'Geo Pottery B', ...skillBase });
});

test.after(async () => {
  await Skill.deleteMany({ _id: { $in: [skillA._id, skillB._id] } });
  await User.deleteMany({ _id: { $in: [viewer._id, teacherA._id, teacherB._id] } });
  await mongoose.disconnect();
});

test('getMapPins returns sanitized teachers and both pins without a viewer', async () => {
  const pins = await getMapPins({ lat: 23.8103, lng: 90.4125, radiusKm: 20 });
  const names = pins.map((p) => p.skillName);
  assert.ok(names.includes('Geo Pottery A'));
  assert.ok(names.includes('Geo Pottery B'));
  for (const pin of pins) {
    assert.equal(pin.teacher.passwordHash, undefined);
  }
});

test('getMapPins excludes blocked users when a viewerId is provided', async () => {
  await blockUser(String(viewer._id), String(teacherB._id));
  const blockedView = await getMapPins({ lat: 23.8103, lng: 90.4125, radiusKm: 20, viewerId: String(viewer._id) });
  assert.ok(blockedView.some((p) => p.skillName === 'Geo Pottery A'));
  assert.ok(!blockedView.some((p) => p.skillName === 'Geo Pottery B'));

  const otherView = await getMapPins({ lat: 23.8103, lng: 90.4125, radiusKm: 20, viewerId: String(teacherA._id) });
  assert.ok(otherView.some((p) => p.skillName === 'Geo Pottery B'));
});

test('getMapPins excludes shadow-banned teachers', async () => {
  await User.updateOne({ _id: teacherA._id }, { $set: { isShadowBanned: true } });
  const pins = await getMapPins({ lat: 23.8103, lng: 90.4125, radiusKm: 20, viewerId: String(teacherA._id) });
  assert.ok(!pins.some((p) => p.skillName === 'Geo Pottery A'));
  assert.ok(pins.some((p) => p.skillName === 'Geo Pottery B'));
  await User.updateOne({ _id: teacherA._id }, { $set: { isShadowBanned: false } });
});
