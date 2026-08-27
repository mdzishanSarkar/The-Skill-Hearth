import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface ILocation {
  city: string;
  zipCode: string;
  neighborhood: string;
  type: 'Point';
  coordinates: [number, number];
  radiusPreference: number;
}

export interface IUserStats {
  sessionsCompleted: number;
  averageRating: number;
  reviewCount: number;
}

export interface IUserGamification {
  xp: number;
  level: number;
  badges: string[];
  streakFreezeAvailable: number;
  referralCode: string;
  referredBy?: Types.ObjectId;
  lastXPAction?: Date;
}

export interface IUserMapPreferences {
  defaultMode: 'auto' | 'day' | 'night';
  defaultView: 'map' | 'list';
  clusterMarkers: boolean;
}

export interface IUserQuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface IIdentityVerification {
  idType: 'nid' | 'student_id' | 'passport';
  documentPath: string;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  rejectionReason?: string;
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  username?: string;
  displayName: string;
  bio: string;
  avatar: string;
  avatarPublicId: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'banned';
  suspensionExpiresAt?: Date;
  location: ILocation;
  showOnMap: boolean;
  availability: IAvailabilitySlot[];
  stats: IUserStats;
  gamification: IUserGamification;
  friendIds: Types.ObjectId[];
  closeFriendIds: Types.ObjectId[];
  feedVisibility: 'public' | 'friends' | 'close_friends' | 'private';
  mapPreferences: IUserMapPreferences;
  quietHours: IUserQuietHours;
  weeklyDigest: boolean;
  isEmailVerified: boolean;
  hasCompletedOnboarding: boolean;
  verificationStatus: 'unverified' | 'verified' | 'rejected';
  identityVerification?: IIdentityVerification;
  isShadowBanned: boolean;
  stripeCustomerId?: string;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const availabilitySlotSchema = new Schema<IAvailabilitySlot>(
  {
    day: { type: String, required: true, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 8,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    username: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^[a-z][a-z0-9][a-z0-9._]{1,18}$/, 'Username must start with a lowercase letter, be 3-20 characters, and use only letters, numbers, dots and underscores'],
    },
    bio: {
      type: String,
      default: '',
      maxlength: 280,
    },
    avatar: {
      type: String,
      default: '',
    },
    avatarPublicId: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },
    suspensionExpiresAt: {
      type: Date,
      default: undefined,
    },
    location: {
      city: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      neighborhood: { type: String, default: '' },
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: {
        type: [Number],
        default: [0, 0],
        validate: {
          validator: (v: number[]) => v.length === 2,
          message: 'Coordinates must be [lng, lat]',
        },
      },
      radiusPreference: { type: Number, default: 5, min: 1, max: 100 },
    },
    showOnMap: {
      type: Boolean,
      default: true,
    },
    availability: {
      type: [availabilitySlotSchema],
      default: [],
    },
    stats: {
      sessionsCompleted: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },
    gamification: {
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
      badges: { type: [String], default: [] },
      streakFreezeAvailable: { type: Number, default: 1 },
      referralCode: { type: String, default: '' },
      referredBy: { type: Schema.Types.ObjectId, ref: 'User', default: undefined },
      lastXPAction: { type: Date, default: undefined },
    },
    friendIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    closeFriendIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    feedVisibility: {
      type: String,
      enum: ['public', 'friends', 'close_friends', 'private'],
      default: 'friends',
    },
    mapPreferences: {
      defaultMode: { type: String, enum: ['auto', 'day', 'night'], default: 'auto' },
      defaultView: { type: String, enum: ['map', 'list'], default: 'map' },
      clusterMarkers: { type: Boolean, default: true },
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '22:00' },
      endTime: { type: String, default: '07:00' },
      timezone: { type: String, default: '' },
    },
    weeklyDigest: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    hasCompletedOnboarding: {
      type: Boolean,
      default: true,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'verified', 'rejected'],
      default: 'unverified',
    },
    identityVerification: {
      type: new Schema<IIdentityVerification>(
        {
          idType: { type: String, enum: ['nid', 'student_id', 'passport'], required: true },
          documentPath: { type: String, required: true, select: false, trim: true },
          reviewedAt: { type: Date, default: undefined },
          reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: undefined },
          rejectionReason: { type: String, default: undefined, maxlength: 500 },
        },
        { _id: false }
      ),
      select: false,
    },
    isShadowBanned: {
      type: Boolean,
      default: false,
    },
    stripeCustomerId: {
      type: String,
      sparse: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ status: 1, 'stats.averageRating': -1 });
userSchema.index({ username: 1 }, { unique: true, sparse: true });

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
