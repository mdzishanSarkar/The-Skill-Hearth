import fs from 'fs';
import path from 'path';
import { Skill, User } from '../models';
import type { IAvailabilitySlot, ILocation } from '../models';
import { HttpError } from '../utils/errors';
import { sanitizeUser } from './auth';
import { UPLOADS_DIR } from '../utils/upload';

export async function getProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return sanitizeUser(user);
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatar?: string;
  location?: Partial<Pick<ILocation, 'city' | 'neighborhood' | 'coordinates' | 'radiusPreference'>>;
  showOnMap?: boolean;
  availability?: IAvailabilitySlot[];
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  if (input.displayName !== undefined) {
    const displayName = input.displayName.trim();
    if (displayName.length < 2 || displayName.length > 50) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Display name must be between 2 and 50 characters');
    }
    const clash = await User.findOne({ displayName, _id: { $ne: user._id } });
    if (clash) {
      throw new HttpError(409, 'NAME_TAKEN', 'That display name is already taken');
    }
    user.displayName = displayName;
  }

  if (input.bio !== undefined) {
    if (input.bio.length > 280) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Bio must be 280 characters or fewer');
    }
    user.bio = input.bio.trim();
  }

  if (input.avatar !== undefined) {
    user.avatar = input.avatar.trim();
  }

  if (input.location !== undefined) {
    if (input.location.city !== undefined) user.location.city = input.location.city;
    if (input.location.neighborhood !== undefined) user.location.neighborhood = input.location.neighborhood;
    if (input.location.coordinates !== undefined) {
      user.location.coordinates = input.location.coordinates;
    }
    if (input.location.radiusPreference !== undefined) {
      user.location.radiusPreference = input.location.radiusPreference;
    }
  }

  if (input.showOnMap !== undefined) {
    user.showOnMap = input.showOnMap;
  }

  if (input.availability !== undefined) {
    user.availability = input.availability;
  }

  await user.save();

  await Skill.updateMany(
    { userId: user._id, isDeleted: false },
    {
      $set: {
        'location.city': user.location.city,
        'location.neighborhood': user.location.neighborhood,
        'location.coordinates': user.location.coordinates,
        'location.radiusPreference': user.location.radiusPreference,
      },
    }
  );

  return sanitizeUser(user);
}

export async function updateAvatar(userId: string, file: Express.Multer.File) {
  const user = await User.findById(userId);
  if (!user) {
    fs.unlink(file.path, () => {});
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const avatarUrl = `/uploads/avatars/${file.filename}`;
  const previous = user.avatar;

  user.avatar = avatarUrl;
  await user.save();

  if (previous && previous.startsWith('/uploads/')) {
    const oldPath = path.join(UPLOADS_DIR, previous.replace('/uploads/', ''));
    if (oldPath !== file.path) {
      fs.unlink(oldPath, () => {});
    }
  }

  return sanitizeUser(user);
}

export async function getPublicProfile(userId: string) {
  const user = await User.findById(userId)
    .select('-email -passwordHash')
    .lean();
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return user;
}
