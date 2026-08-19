import { Types } from 'mongoose';
import { ActivityEvent, User, Friendship } from '../models';
import type { ActivityEventType, ActivitySubjectType, ActivityVisibility } from '../models';
import { HttpError } from '../utils/errors';

const EVENT_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export interface CreateActivityInput {
  actorId: string | Types.ObjectId;
  eventType: ActivityEventType;
  subjectType: ActivitySubjectType;
  subjectId?: string | Types.ObjectId;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  emoji?: string;
  visibility?: ActivityVisibility;
}

export async function createActivityEvent(input: CreateActivityInput) {
  const event = await ActivityEvent.create({
    actorId: toObjectId(String(input.actorId)),
    eventType: input.eventType,
    subjectType: input.subjectType,
    subjectId: input.subjectId !== undefined ? toObjectId(String(input.subjectId)) : undefined,
    preview: {
      title: input.title.slice(0, 200),
      subtitle: input.subtitle ? input.subtitle.slice(0, 200) : undefined,
      imageUrl: input.imageUrl,
      emoji: input.emoji,
    },
    visibility: input.visibility ?? 'friends',
    expiresAt: new Date(Date.now() + EVENT_TTL_MS),
  });
  return event.toJSON();
}

function eventVisibilityFilter(
  friendIds: string[],
  closeFriendIds: string[],
  myId: string,
): Record<string, unknown> {
  const actorIds = friendIds.map((id) => new Types.ObjectId(id));
  const closeSet = new Set(closeFriendIds.map((id) => String(id)));

  return {
    $or: [
      { actorId: new Types.ObjectId(myId) },
      {
        actorId: { $in: actorIds },
        visibility: { $in: ['public', 'friends'] },
      },
      {
        actorId: {
          $in: closeFriendIds.map((id) => new Types.ObjectId(id)),
        },
        visibility: 'close_friends',
      },
    ],
  };
}

export async function getFeed(userId: string, page = 1, limit = 20) {
  const id = toObjectId(userId);
  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));

  const user = await User.findById(id).select('friendIds closeFriendIds').lean();
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  const filter = eventVisibilityFilter(
    (user.friendIds ?? []).map((f) => String(f)),
    (user.closeFriendIds ?? []).map((f) => String(f)),
    userId,
  );

  const [events, total] = await Promise.all([
    ActivityEvent.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'displayName avatar gamification.level')
      .lean(),
    ActivityEvent.countDocuments(filter),
  ]);

  return {
    events: events.map((e) => toFeedEvent(e, userId)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserActivityEvents(userId: string, viewerId: string, page = 1, limit = 20) {
  const targetId = toObjectId(userId);
  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));

  const isSelf = userId === viewerId;
  let visibleFilter: Record<string, unknown> = { actorId: targetId };

  if (!isSelf) {
    const [viewer, target, friendship] = await Promise.all([
      User.findById(viewerId).select('friendIds closeFriendIds').lean(),
      User.findById(targetId).select('feedVisibility').lean(),
      Friendship.findOne({
        status: 'accepted',
        $or: [
          { requesterId: viewerId, addresseeId: targetId },
          { requesterId: targetId, addresseeId: viewerId },
        ],
      }).lean(),
    ]);

    const viewerFriendIds = (viewer?.friendIds ?? []).map((f) => String(f));
    const isFriend = viewerFriendIds.includes(userId);
    const isClose = (viewer?.closeFriendIds ?? []).map((f) => String(f)).includes(userId);

    const targetFeedVisibility = target?.feedVisibility ?? 'friends';
    const visibilities = ['public'];
    if (isFriend && targetFeedVisibility !== 'private') {
      visibilities.push('friends');
    }
    if (isClose && targetFeedVisibility === 'close_friends') {
      visibilities.push('close_friends');
    }

    visibleFilter = { actorId: targetId, visibility: { $in: visibilities } };
    void friendship;
  }

  const [events, total] = await Promise.all([
    ActivityEvent.find(visibleFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'displayName avatar gamification.level')
      .lean(),
    ActivityEvent.countDocuments(visibleFilter),
  ]);

  return {
    events: events.map((e) => toFeedEvent(e, viewerId)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

interface LeanFeedEvent {
  _id: Types.ObjectId;
  eventType: ActivityEventType;
  subjectType: ActivitySubjectType;
  subjectId?: Types.ObjectId | null;
  actorId?: unknown;
  preview: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    emoji?: string;
  };
  visibility: ActivityVisibility;
  reactions: Array<{ userId: Types.ObjectId; emoji: string; createdAt: Date }>;
  createdAt: Date;
}

function toFeedEvent(e: LeanFeedEvent, viewerId: string) {
  const actor = e.actorId as
    | {
        _id?: Types.ObjectId;
        displayName?: string;
        avatar?: string;
        gamification?: { level: number };
      }
    | null
    | undefined;

  return {
    _id: String(e._id),
    eventType: e.eventType,
    subjectType: e.subjectType,
    subjectId: e.subjectId ? String(e.subjectId) : undefined,
    actor: {
      _id: String(actor?._id ?? ''),
      displayName: actor?.displayName ?? 'Unknown',
      avatar: actor?.avatar ?? '',
      level: actor?.gamification?.level ?? 1,
    },
    preview: e.preview,
    visibility: e.visibility,
    reactions: e.reactions,
    reactionCounts: countReactions(e.reactions),
    myReaction: e.reactions.find((r) => String(r.userId) === viewerId)?.emoji ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

export async function reactToEvent(eventId: string, userId: string, emoji: string) {
  const id = toObjectId(eventId);
  const userObjectId = toObjectId(userId);

  const event = await ActivityEvent.findById(id);
  if (!event) throw new HttpError(404, 'EVENT_NOT_FOUND', 'Activity event not found');
  if (String(event.actorId) === userId) {
    throw new HttpError(400, 'CANNOT_REACT_OWN', 'You cannot react to your own activity');
  }

  const emojiValue = (['🎉', '❤️', '👏', '🔥', '💡'] as string[]).includes(emoji) ? emoji : '🎉';

  const existing = event.reactions.find((r) => String(r.userId) === userId);
  if (existing && existing.emoji === emojiValue) {
    event.reactions = event.reactions.filter((r) => String(r.userId) !== userId);
  } else if (existing) {
    existing.emoji = emojiValue;
  } else {
    event.reactions.push({ userId: userObjectId, emoji: emojiValue, createdAt: new Date() });
  }

  await event.save();

  const fresh = await ActivityEvent.findById(id)
    .populate('actorId', 'displayName avatar gamification.level')
    .lean();
  if (!fresh) throw new HttpError(404, 'EVENT_NOT_FOUND', 'Activity event not found');

  return toFeedEvent(fresh as LeanFeedEvent, userId);
}

function countReactions(reactions: Array<{ emoji: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of reactions) {
    counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
  }
  return counts;
}
