import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface ILocation {
  city: string;
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

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName: string;
  bio: string;
  avatar: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'banned';
  suspensionExpiresAt?: Date;
  location: ILocation;
  showOnMap: boolean;
  availability: IAvailabilitySlot[];
  stats: IUserStats;
  isEmailVerified: boolean;
  isIdVerified: boolean;
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
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
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
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isIdVerified: {
      type: Boolean,
      default: false,
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

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
