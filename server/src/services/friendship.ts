import { Types } from 'mongoose';
import { Friendship, User, Skill, Connection, Block } from '../models';
import type { FriendTier } from '../models';
import { HttpError } from '../utils/errors';
import { escapeRegExp } from '../utils/regex';
import { createNotification } from './notification';
import { createActivityEvent } from './activityFeed';
import { awardXP, awardBadge } from './gamification';
import { recordStreakActivity } from './streak';
import { filterOnlineUsers } from './presence';

const MAX_FRIENDS = 150;
const MAX_CLOSE_FRIENDS = 15;
const MAX_OUTGOING_PENDING = 20;
const REQUEST_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface PopulatedUser {
  _id: Types.ObjectId;
  displayName: string;
  avatar?: string;
  location?: { city?: string };
}

interface PopulatedFriendRequest {
  _id: Types.ObjectId;
  requesterId: PopulatedUser;
  addresseeId: PopulatedUser;
  createdAt: Date;
}

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export function getDirectMessageRoomId(userAId: string, userBId: string): string {
  const a = userAId < userBId ? userAId : userBId;
  const b = userAId < userBId ? userBId : userAId;
  return `dm_${a}_${b}`;
}

async function isBlockedBetween(userAId: string, userBId: string): Promise<boolean> {
  const block = await Block.findOne({
    $or: [
      { blockerId: userAId, blockedId: userBId },
      { blockerId: userBId, blockedId: userAId },
    ],
  }).lean();
  return Boolean(block);
}

export type FriendStatusResult =
  | { status: 'none' }
  | { status: 'pending_sent'; friendshipId: string }
  | { status: 'pending_received'; friendshipId: string }
  | { status: 'friends'; friendshipId: string; tier: FriendTier }
  | { status: 'blocked' };

export async function getFriendStatus(userId: string, otherId: string): Promise<FriendStatusResult> {
  if (userId === otherId) return { status: 'none' };

  if (await isBlockedBetween(userId, otherId)) return { status: 'blocked' };

  const friendship = await Friendship.findOne({
    $or: [
      { requesterId: userId, addresseeId: otherId },
      { requesterId: otherId, addresseeId: userId },
    ],
  }).lean();

  if (!friendship) return { status: 'none' };

  if (friendship.status === 'accepted') {
    const tier = String(friendship.requesterId) === userId ? friendship.requesterTier : friendship.addresseeTier;
    return { status: 'friends', friendshipId: String(friendship._id), tier };
  }
  if (friendship.status === 'pending') {
    if (String(friendship.requesterId) === userId) {
      return { status: 'pending_sent', friendshipId: String(friendship._id) };
    }
    return { status: 'pending_received', friendshipId: String(friendship._id) };
  }
  return { status: 'none' };
}

export async function sendFriendRequest(userId: string, targetId: string) {
  if (userId === targetId) {
    throw new HttpError(400, 'CANNOT_FRIEND_SELF', 'You cannot friend yourself');
  }

  const target = await User.findById(targetId).select('status displayName');
  if (!target || target.status !== 'active') {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  if (await isBlockedBetween(userId, targetId)) {
    throw new HttpError(403, 'USER_BLOCKED', 'Unable to send a friend request');
  }

  const existing = await Friendship.findOne({
    $or: [
      { requesterId: userId, addresseeId: targetId },
      { requesterId: targetId, addresseeId: userId },
    ],
  }).lean();

  if (existing) {
    if (existing.status === 'accepted') {
      throw new HttpError(409, 'ALREADY_FRIENDS', 'You are already friends with this user');
    }
    if (existing.status === 'pending') {
      throw new HttpError(409, 'REQUEST_EXISTS', 'A friend request already exists');
    }
    if (existing.status === 'declined') {
      const friendship = await Friendship.findByIdAndUpdate(
        existing._id,
        { status: 'pending', requesterId: userId, addresseeId: targetId, expiresAt: new Date(Date.now() + REQUEST_TTL_MS) },
        { returnDocument: 'after' },
      );
      await notifyFriendRequest(friendship!);
      return friendship!.toJSON();
    }
  }

  const outgoingCount = await Friendship.countDocuments({
    requesterId: userId,
    status: 'pending',
  });
  if (outgoingCount >= MAX_OUTGOING_PENDING) {
    throw new HttpError(400, 'MAX_PENDING_REQUESTS', 'You have too many pending friend requests');
  }

  const friendship = await Friendship.create({
    requesterId: toObjectId(userId),
    addresseeId: toObjectId(targetId),
    status: 'pending',
    directMessageRoomId: getDirectMessageRoomId(userId, targetId),
    expiresAt: new Date(Date.now() + REQUEST_TTL_MS),
  });

  await awardXP(userId, 'send_friend_request');
  await notifyFriendRequest(friendship);

  return friendship.toJSON();
}

async function notifyFriendRequest(friendship: { _id: Types.ObjectId; requesterId: Types.ObjectId; addresseeId: Types.ObjectId }) {
  const requester = await User.findById(friendship.requesterId).select('displayName avatar').lean();
  await createNotification({
    userId: friendship.addresseeId,
    type: 'friend_request',
    referenceId: friendship._id,
    referenceModel: 'Friendship',
    message: `${requester?.displayName ?? 'Someone'} sent you a friend request`,
  });
}

export async function acceptFriendRequest(requestId: string, userId: string) {
  const id = toObjectId(requestId);
  const friendship = await Friendship.findById(id);
  if (!friendship) throw new HttpError(404, 'REQUEST_NOT_FOUND', 'Friend request not found');
  if (String(friendship.addresseeId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Only the recipient can accept this request');
  }
  if (friendship.status !== 'pending') {
    throw new HttpError(400, 'INVALID_STATE', 'This request is not pending');
  }

  friendship.status = 'accepted';
  friendship.acceptedAt = new Date();
  await friendship.save();

  const requesterId = String(friendship.requesterId);
  const addresseeId = String(friendship.addresseeId);

  await Promise.all([
    User.updateOne({ _id: friendship.requesterId }, { $addToSet: { friendIds: friendship.addresseeId } }),
    User.updateOne({ _id: friendship.addresseeId }, { $addToSet: { friendIds: friendship.requesterId } }),
  ]);

  const requester = await User.findById(friendship.requesterId).select('displayName avatar').lean();
  const addressee = await User.findById(friendship.addresseeId).select('displayName avatar').lean();

  await createNotification({
    userId: friendship.requesterId,
    type: 'friend_request_accepted',
    referenceId: friendship._id,
    referenceModel: 'Friendship',
    message: `${addressee?.displayName ?? 'Someone'} accepted your friend request`,
  });

  await awardXP(addresseeId, 'accept_friend_request');
  await awardXP(requesterId, 'first_friend');
  await awardBadge(requesterId, 'first_friend');

  try {
    await createActivityEvent({
      actorId: addresseeId,
      eventType: 'friend_request_accepted',
      subjectType: 'friendship',
      subjectId: friendship._id,
      title: `${requester?.displayName ?? 'You'} are now friends! 🎉`,
      subtitle: 'A new friendship forged at the hearth',
      emoji: '👥',
      visibility: 'friends',
    });
    await createActivityEvent({
      actorId: requesterId,
      eventType: 'friend_joined',
      subjectType: 'friendship',
      subjectId: friendship._id,
      title: `You and ${requester?.displayName ?? 'your friend'} are now friends! 🎉`,
      emoji: '👥',
      visibility: 'friends',
    });
  } catch {
    // best-effort
  }

  return friendship.toJSON();
}

export async function declineFriendRequest(requestId: string, userId: string) {
  const id = toObjectId(requestId);
  const friendship = await Friendship.findById(id);
  if (!friendship) throw new HttpError(404, 'REQUEST_NOT_FOUND', 'Friend request not found');
  if (String(friendship.addresseeId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Only the recipient can decline this request');
  }
  if (friendship.status !== 'pending') {
    throw new HttpError(400, 'INVALID_STATE', 'This request is not pending');
  }

  friendship.status = 'declined';
  friendship.declinedAt = new Date();
  await friendship.save();

  return friendship.toJSON();
}

export async function cancelFriendRequest(requestId: string, userId: string) {
  const id = toObjectId(requestId);
  const friendship = await Friendship.findById(id);
  if (!friendship) throw new HttpError(404, 'REQUEST_NOT_FOUND', 'Friend request not found');
  if (String(friendship.requesterId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Only the sender can cancel this request');
  }
  if (friendship.status !== 'pending') {
    throw new HttpError(400, 'INVALID_STATE', 'This request is not pending');
  }

  await friendship.deleteOne();
  return { success: true };
}

export async function unfriend(userId: string, otherId: string) {
  if (userId === otherId) {
    throw new HttpError(400, 'CANNOT_FRIEND_SELF', 'Invalid operation');
  }
  const friendship = await Friendship.findOne({
    status: 'accepted',
    $or: [
      { requesterId: userId, addresseeId: otherId },
      { requesterId: otherId, addresseeId: userId },
    ],
  });
  if (!friendship) throw new HttpError(404, 'NOT_FRIENDS', 'You are not friends with this user');

  await friendship.deleteOne();

  await Promise.all([
    User.updateOne(
      { _id: userId },
      { $pull: { friendIds: new Types.ObjectId(otherId), closeFriendIds: new Types.ObjectId(otherId) } },
    ),
    User.updateOne(
      { _id: otherId },
      { $pull: { friendIds: new Types.ObjectId(userId), closeFriendIds: new Types.ObjectId(userId) } },
    ),
  ]);

  return { success: true };
}

export async function setFriendTier(userId: string, otherId: string, tier: 'friend' | 'close_friend') {
  const friendship = await Friendship.findOne({
    status: 'accepted',
    $or: [
      { requesterId: userId, addresseeId: otherId },
      { requesterId: otherId, addresseeId: userId },
    ],
  });
  if (!friendship) throw new HttpError(404, 'NOT_FRIENDS', 'You are not friends with this user');

  const isRequester = String(friendship.requesterId) === userId;
  const field = isRequester ? 'requesterTier' : 'addresseeTier';

  if (tier === 'close_friend') {
    const closeCount = await User.countDocuments({ _id: userId, closeFriendIds: { $size: MAX_CLOSE_FRIENDS } });
    if (closeCount > 0) {
      throw new HttpError(400, 'MAX_CLOSE_FRIENDS', `You can have up to ${MAX_CLOSE_FRIENDS} close friends`);
    }
    await User.updateOne({ _id: userId }, { $addToSet: { closeFriendIds: new Types.ObjectId(otherId) } });
  } else {
    await User.updateOne({ _id: userId }, { $pull: { closeFriendIds: new Types.ObjectId(otherId) } });
  }

  await Friendship.updateOne({ _id: friendship._id }, { $set: { [field]: tier } });

  const updated = await Friendship.findById(friendship._id).lean();
  return updated;
}

export async function updateFriendPrivacy(userId: string, otherId: string, showStreak: boolean) {
  const friendship = await Friendship.findOne({
    status: 'accepted',
    $or: [
      { requesterId: userId, addresseeId: otherId },
      { requesterId: otherId, addresseeId: userId },
    ],
  });
  if (!friendship) throw new HttpError(404, 'NOT_FRIENDS', 'You are not friends with this user');

  const isRequester = String(friendship.requesterId) === userId;
  const field = isRequester ? 'showStreakTo.requester' : 'showStreakTo.addressee';

  await Friendship.updateOne({ _id: friendship._id }, { $set: { [field]: showStreak } });
  return Friendship.findById(friendship._id).lean();
}

export async function listFriends(userId: string, query = '') {
  const user = await User.findById(userId).select('friendIds').lean();
  if (!user || !user.friendIds?.length) return [];

  const filter: Record<string, unknown> = {
    _id: { $in: user.friendIds },
    status: 'active',
  };
  if (query) {
    filter.displayName = { $regex: new RegExp(escapeRegExp(query.slice(0, 100)), 'i') };
  }

  const friends = await User.find(filter)
    .select('displayName avatar location.city location.neighborhood lastActive gamification.level')
    .sort({ lastActive: -1 })
    .lean();

  return friends.map((f) => ({
    _id: String(f._id),
    displayName: f.displayName,
    avatar: f.avatar,
    city: f.location?.city ?? '',
    neighborhood: f.location?.neighborhood ?? '',
    lastActive: f.lastActive,
    level: f.gamification?.level ?? 1,
    isCloseFriend: (user.closeFriendIds ?? []).some((id) => String(id) === String(f._id)),
  }));
}

export async function getFriendRequests(userId: string, direction: 'incoming' | 'outgoing') {
  const filter =
    direction === 'incoming'
      ? { addresseeId: userId, status: 'pending' as const }
      : { requesterId: userId, status: 'pending' as const };

  const requests = (await Friendship.find(filter)
    .populate('requesterId', 'displayName avatar location.city')
    .populate('addresseeId', 'displayName avatar location.city')
    .sort({ createdAt: -1 })
    .lean()) as unknown as PopulatedFriendRequest[];

  return requests.map((r) => ({
    _id: String(r._id),
    requester: {
      _id: String(r.requesterId._id),
      displayName: r.requesterId.displayName,
      avatar: r.requesterId.avatar,
      city: r.requesterId.location?.city ?? '',
    },
    addressee: {
      _id: String(r.addresseeId._id),
      displayName: r.addresseeId.displayName,
      avatar: r.addresseeId.avatar,
    },
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getMutualFriends(userId: string, otherId: string) {
  const [user, other] = await Promise.all([
    User.findById(userId).select('friendIds').lean(),
    User.findById(otherId).select('friendIds').lean(),
  ]);
  if (!user || !other) return [];

  const userFriends = new Set((user.friendIds ?? []).map((id) => String(id)));
  const mutual = (other.friendIds ?? []).filter((id) => userFriends.has(String(id)));

  const users = await User.find({ _id: { $in: mutual } })
    .select('displayName avatar')
    .limit(12)
    .lean();

  return users.map((u) => ({ _id: String(u._id), displayName: u.displayName, avatar: u.avatar }));
}

export async function getFriendsOnline(userId: string) {
  const user = await User.findById(userId).select('friendIds').lean();
  if (!user?.friendIds?.length) return [];

  const onlineIds = await filterOnlineUsers(user.friendIds.map((id) => String(id)));
  if (!onlineIds.length) return [];

  const friends = await User.find({ _id: { $in: onlineIds } })
    .select('displayName avatar')
    .lean();

  return friends.map((f) => ({
    _id: String(f._id),
    displayName: f.displayName,
    avatar: f.avatar,
  }));
}

export async function getFriendSuggestions(userId: string, limit = 20) {
  const user = await User.findById(userId)
    .select('friendIds closeFriendIds location city availability')
    .lean();
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  const excluded = new Set([
    userId,
    ...(user.friendIds ?? []).map((id) => String(id)),
  ]);

  const blockedByMe = await Block.find({ blockerId: userId }).select('blockedId').lean();
  const blockedMe = await Block.find({ blockedId: userId }).select('blockerId').lean();
  for (const b of [...blockedByMe, ...blockedMe]) {
    excluded.add(String(b.blockerId ?? b.blockedId));
  }

  const pending = await Friendship.find({ status: 'pending' }).select('requesterId addresseeId').lean();
  for (const p of pending) {
    const req = String(p.requesterId);
    const add = String(p.addresseeId);
    if (req === userId) excluded.add(add);
    if (add === userId) excluded.add(req);
  }

  const myTeachSkills = await Skill.find({ userId, type: 'teach', isDeleted: false, isActive: true })
    .select('skillName categoryId')
    .lean();
  const myLearnSkills = await Skill.find({ userId, type: 'learn', isDeleted: false, isActive: true })
    .select('skillName categoryId')
    .lean();

  const myLearnNames = myLearnSkills.map((s) => s.skillName.toLowerCase());

  const candidates = await User.find({
    _id: { $nin: [...excluded].map((id) => new Types.ObjectId(id)) },
    status: 'active',
  })
    .select('displayName avatar location.city location.neighborhood gamification.level')
    .limit(500)
    .lean();

  const candidateSkills = await Skill.find({
    userId: { $in: candidates.map((c) => c._id) },
    isDeleted: false,
    isActive: true,
  })
    .select('userId type skillName categoryId')
    .lean();

  const myCompletedConnections = await Connection.find({
    status: 'completed',
    $or: [{ requesterId: userId }, { teacherId: userId }],
  }).select('requesterId teacherId').lean();
  const completedWith = new Set(
    myCompletedConnections.flatMap((c) => [
      String(c.requesterId),
      String(c.teacherId),
    ]),
  );

  const skillMap = new Map<string, typeof candidateSkills>();
  for (const skill of candidateSkills) {
    const uid = String(skill.userId);
    if (!skillMap.has(uid)) skillMap.set(uid, []);
    skillMap.get(uid)!.push(skill);
  }

  const suggestions: Array<{
    user: { _id: string; displayName: string; avatar: string; city: string; neighborhood: string; level: number };
    score: number;
    reasons: string[];
  }> = [];

  for (const candidate of candidates) {
    const cid = String(candidate._id);
    if (excluded.has(cid)) continue;
    const skills = skillMap.get(cid) ?? [];
    const teachNames = skills.filter((s) => s.type === 'teach').map((s) => s.skillName.toLowerCase());

    let score = 0;
    const reasons: string[] = [];

    const mutualCount = await countMutual(user, cid);
    if (mutualCount > 0) {
      score += Math.min(30, mutualCount * 5);
      reasons.push(`${mutualCount} mutual friend${mutualCount > 1 ? 's' : ''}`);
    }

    const overlap = teachNames.filter((n) => myLearnNames.includes(n));
    if (overlap.length > 0) {
      score += 25;
      reasons.push('Teaches what you want to learn');
    }

    if (candidate.location?.city && candidate.location.city === user.location?.city) {
      score += 20;
      reasons.push('Lives in your city');
    }

    if (completedWith.has(cid)) {
      score += 15;
      reasons.push('You have completed a session together');
    }

    if (score >= 20) {
      suggestions.push({
        user: {
          _id: cid,
          displayName: candidate.displayName,
          avatar: candidate.avatar,
          city: candidate.location?.city ?? '',
          neighborhood: candidate.location?.neighborhood ?? '',
          level: candidate.gamification?.level ?? 1,
        },
        score,
        reasons,
      });
    }
  }

  suggestions.sort((a, b) => b.score - a.score);
  return suggestions.slice(0, limit);
}

async function countMutual(user: { friendIds?: Types.ObjectId[] }, otherId: string): Promise<number> {
  const other = await User.findById(otherId).select('friendIds').lean();
  if (!other?.friendIds) return 0;
  const mine = new Set((user.friendIds ?? []).map((id) => String(id)));
  return other.friendIds.filter((id) => mine.has(String(id))).length;
}

export async function markFriendshipMetViaSkillSession(requesterId: string, teacherId: string) {
  const friendship = await Friendship.findOne({
    status: 'accepted',
    $or: [
      { requesterId, addresseeId: teacherId },
      { requesterId: teacherId, addresseeId: requesterId },
    ],
  });
  if (friendship && !friendship.metVia) {
    friendship.metVia = 'skill_session';
    await friendship.save();
  }
}

export async function autoCreateFriendshipFromSession(requesterId: string, teacherId: string) {
  const existing = await Friendship.findOne({
    status: { $in: ['accepted', 'pending'] },
    $or: [
      { requesterId, addresseeId: teacherId },
      { requesterId: teacherId, addresseeId: requesterId },
    ],
  }).lean();
  if (existing) return;

  if (await isBlockedBetween(requesterId, teacherId)) return;

  const friendship = await Friendship.create({
    requesterId: toObjectId(requesterId),
    addresseeId: toObjectId(teacherId),
    status: 'accepted',
    metVia: 'skill_session',
    acceptedAt: new Date(),
    directMessageRoomId: getDirectMessageRoomId(requesterId, teacherId),
  });

  await Promise.all([
    User.updateOne({ _id: requesterId }, { $addToSet: { friendIds: toObjectId(teacherId) } }),
    User.updateOne({ _id: teacherId }, { $addToSet: { friendIds: toObjectId(requesterId) } }),
  ]);

  return friendship.toJSON();
}
