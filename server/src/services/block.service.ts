import { Types } from 'mongoose';
import { Block, User } from '../models';
import { HttpError } from '../utils/errors';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) {
    throw new HttpError(400, 'CANNOT_BLOCK_SELF', 'You cannot block yourself');
  }

  const blocker = await User.findById(toObjectId(blockerId)).select('status');
  if (!blocker || blocker.status !== 'active') {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const blocked = await User.findById(toObjectId(blockedId)).select('status');
  if (!blocked || blocked.status !== 'active') {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const existing = await Block.findOne({
    blockerId: toObjectId(blockerId),
    blockedId: toObjectId(blockedId),
  });
  if (existing) {
    throw new HttpError(409, 'ALREADY_BLOCKED', 'You have already blocked this user');
  }

  await Block.create({
    blockerId: toObjectId(blockerId),
    blockedId: toObjectId(blockedId),
  });

  return { success: true };
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const block = await Block.findOneAndDelete({
    blockerId: toObjectId(blockerId),
    blockedId: toObjectId(blockedId),
  });

  if (!block) {
    throw new HttpError(404, 'BLOCK_NOT_FOUND', 'You have not blocked this user');
  }

  return { success: true };
}

export async function getBlockedUsers(userId: string) {
  const blocks = await Block.find({ blockerId: toObjectId(userId) })
    .populate('blockedId', 'displayName avatar')
    .sort({ createdAt: -1 })
    .lean();

  return {
    users: blocks.map((b) => ({
      _id: (b.blockedId as unknown as { _id: string })._id,
      displayName: (b.blockedId as unknown as { displayName: string }).displayName,
      avatar: (b.blockedId as unknown as { avatar: string }).avatar,
      blockedAt: b.createdAt,
    })),
  };
}

export async function isBlocked(userId1: string, userId2: string): Promise<boolean> {
  const count = await Block.countDocuments({
    $or: [
      { blockerId: toObjectId(userId1), blockedId: toObjectId(userId2) },
      { blockerId: toObjectId(userId2), blockedId: toObjectId(userId1) },
    ],
  });
  return count > 0;
}

export async function getBlockedIds(userId: string): Promise<string[]> {
  const blocks = await Block.find({
    $or: [
      { blockerId: toObjectId(userId) },
      { blockedId: toObjectId(userId) },
    ],
  }).lean();

  const ids = new Set<string>();
  for (const block of blocks) {
    ids.add(String(block.blockerId));
    ids.add(String(block.blockedId));
  }
  ids.delete(userId);
  return Array.from(ids);
}
