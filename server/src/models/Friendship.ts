import mongoose, { Document, Schema, Types } from 'mongoose';

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';
export type FriendTier = 'friend' | 'close_friend';
export type FriendshipMetVia = 'skill_session' | 'friend_request' | 'group_session';

export interface IFriendship extends Document {
  requesterId: Types.ObjectId;
  addresseeId: Types.ObjectId;
  status: FriendshipStatus;
  requesterTier: FriendTier;
  addresseeTier: FriendTier;
  showStreakTo: {
    requester: boolean;
    addressee: boolean;
  };
  metVia?: FriendshipMetVia;
  sharedSkillId?: Types.ObjectId;
  directMessageRoomId: string;
  expiresAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const friendshipSchema = new Schema<IFriendship>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    addresseeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'blocked'],
      default: 'pending',
    },
    requesterTier: {
      type: String,
      enum: ['friend', 'close_friend'],
      default: 'friend',
    },
    addresseeTier: {
      type: String,
      enum: ['friend', 'close_friend'],
      default: 'friend',
    },
    showStreakTo: {
      requester: { type: Boolean, default: true },
      addressee: { type: Boolean, default: true },
    },
    metVia: {
      type: String,
      enum: ['skill_session', 'friend_request', 'group_session'],
    },
    sharedSkillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
    },
    directMessageRoomId: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
    },
    acceptedAt: {
      type: Date,
    },
    declinedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

friendshipSchema.index({ requesterId: 1, addresseeId: 1 }, { unique: true });
friendshipSchema.index({ requesterId: 1, status: 1 });
friendshipSchema.index({ addresseeId: 1, status: 1 });
friendshipSchema.index({ status: 1, expiresAt: 1 });

const Friendship = mongoose.model<IFriendship>('Friendship', friendshipSchema);
export default Friendship;
