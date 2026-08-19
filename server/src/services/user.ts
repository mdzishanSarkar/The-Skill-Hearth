import fs from 'fs';
import path from 'path';
import { Types } from 'mongoose';
import { Category, Skill, User } from '../models';
import type { IAvailabilitySlot, ILocation, IUserMapPreferences, IUserQuietHours } from '../models';
import { HttpError } from '../utils/errors';
import { sanitizeUser } from './auth';
import { geocodePlace } from './naturalSearch.service';
import { UPLOADS_DIR, saveAvatarFile } from '../utils/upload';
import { destroyCloudinaryImage } from '../config/cloudinary';
import { isValidCoordinatePair, snapCoordinates } from '../utils/geo';

export async function getProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return sanitizeUser(user);
}

export interface UpdateProfileInput {
  username?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  location?: Partial<
    Pick<ILocation, 'city' | 'zipCode' | 'neighborhood' | 'coordinates' | 'radiusPreference'>
  >;
  showOnMap?: boolean;
  availability?: IAvailabilitySlot[];
  mapPreferences?: Partial<Pick<IUserMapPreferences, 'defaultMode' | 'defaultView' | 'clusterMarkers'>>;
  quietHours?: Partial<Pick<IUserQuietHours, 'enabled' | 'startTime' | 'endTime' | 'timezone'>>;
  weeklyDigest?: boolean;
}

const VALID_MAP_MODES = ['auto', 'day', 'night'] as const;
const VALID_MAP_VIEWS = ['map', 'list'] as const;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const USERNAME_PATTERN = /^[a-z][a-z0-9][a-z0-9._]{1,18}$/;

function isTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function isInQuietHours(user: Pick<IUserQuietHours, 'enabled' | 'startTime' | 'endTime' | 'timezone'>, now = new Date()): boolean {
  if (!user || !user.enabled) return false;
  const { startTime, endTime } = user;
  if (!isTime(startTime) || !isTime(endTime)) return false;

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const parse = (value: string): number => {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  };

  const start = parse(startTime);
  const end = parse(endTime);

  if (start === end) return false;
  return start < end ? currentMinutes >= start && currentMinutes < end : currentMinutes >= start || currentMinutes < end;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  if (input.username !== undefined) {
    const username = input.username.trim();
    if (!USERNAME_PATTERN.test(username)) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Username must start with a lowercase letter, be 3-20 characters, and use only letters, numbers, dots and underscores'
      );
    }
    const usernameClash = await User.findOne({ username, _id: { $ne: user._id } });
    if (usernameClash) {
      throw new HttpError(409, 'USERNAME_TAKEN', 'That username is already taken');
    }
    user.username = username;
  }

  if (input.displayName !== undefined) {
    const displayName = input.displayName.trim();
    if (displayName.length < 2 || displayName.length > 50) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Display name must be between 2 and 50 characters');
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
    if (input.location.zipCode !== undefined) user.location.zipCode = input.location.zipCode;
    if (input.location.neighborhood !== undefined) user.location.neighborhood = input.location.neighborhood;
    if (input.location.coordinates !== undefined) {
      if (!isValidCoordinatePair(input.location.coordinates)) {
        throw new HttpError(400, 'INVALID_COORDINATES', 'Invalid coordinates');
      }
      user.location.coordinates = snapCoordinates(
        input.location.coordinates[0],
        input.location.coordinates[1]
      );
    } else if (input.location.city !== undefined || input.location.neighborhood !== undefined) {
      // Location text changed without new coordinates: geocode the new place so the
      // stored coordinates follow the user's updated location instead of staying stale.
      const query = [user.location.neighborhood, user.location.city].filter(Boolean).join(', ');
      if (query) {
        const place = await geocodePlace(query);
        if (place) {
          user.location.coordinates = snapCoordinates(place.lng, place.lat);
        }
      }
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

  if (input.mapPreferences !== undefined) {
    const { defaultMode, defaultView, clusterMarkers } = input.mapPreferences;
    if (defaultMode !== undefined) {
      if (!(VALID_MAP_MODES as readonly string[]).includes(defaultMode)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid map default mode');
      }
      user.mapPreferences.defaultMode = defaultMode;
    }
    if (defaultView !== undefined) {
      if (!(VALID_MAP_VIEWS as readonly string[]).includes(defaultView)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid map default view');
      }
      user.mapPreferences.defaultView = defaultView;
    }
    if (clusterMarkers !== undefined) {
      user.mapPreferences.clusterMarkers = Boolean(clusterMarkers);
    }
  }

  if (input.quietHours !== undefined) {
    const { enabled, startTime, endTime, timezone } = input.quietHours;
    if (enabled !== undefined) user.quietHours.enabled = Boolean(enabled);
    if (startTime !== undefined) {
      if (!isTime(startTime)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Quiet hours start time must use HH:MM (24-hour) format');
      }
      user.quietHours.startTime = startTime;
    }
    if (endTime !== undefined) {
      if (!isTime(endTime)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Quiet hours end time must use HH:MM (24-hour) format');
      }
      user.quietHours.endTime = endTime;
    }
    if (timezone !== undefined) {
      user.quietHours.timezone = String(timezone).trim().slice(0, 64);
    }
  }

  if (input.weeklyDigest !== undefined) {
    user.weeklyDigest = Boolean(input.weeklyDigest);
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
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const saved = await saveAvatarFile(userId, file.buffer, file.mimetype);
  const previousUrl = user.avatar;
  const previousPublicId = user.avatarPublicId;

  user.avatar = saved.url;
  user.avatarPublicId = saved.publicId;
  await user.save();

  if (previousPublicId) {
    await destroyCloudinaryImage(previousPublicId);
  } else if (previousUrl && previousUrl.startsWith('/uploads/')) {
    const oldPath = path.join(UPLOADS_DIR, previousUrl.replace('/uploads/', ''));
    fs.unlink(oldPath, () => {});
  }

  return sanitizeUser(user);
}

export interface OnboardingSkillSelection {
  categoryId: string;
  skillName: string;
  description?: string;
}

export interface OnboardingInput {
  teachSkills: OnboardingSkillSelection[];
  learnSkills: OnboardingSkillSelection[];
  location: {
    city: string;
    zipCode: string;
    neighborhood?: string;
    coordinates: [number, number];
    radiusPreference: number;
  };
  bio?: string;
  availability?: IAvailabilitySlot[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
}

const MAX_ONBOARDING_SKILLS = 10;
const VALID_EXPERIENCE = ['beginner', 'intermediate', 'advanced'] as const;

async function loadActiveCategory(categoryId: string) {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new HttpError(400, 'INVALID_CATEGORY', 'Unknown or inactive skill category');
  }
  const category = await Category.findOne({ _id: categoryId, isActive: true }).lean();
  if (!category) {
    throw new HttpError(400, 'INVALID_CATEGORY', 'Unknown or inactive skill category');
  }
  return category;
}

function validateSelections(
  selections: OnboardingSkillSelection[],
  label: string
): void {
  if (!Array.isArray(selections) || selections.length > MAX_ONBOARDING_SKILLS) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      `Select up to ${MAX_ONBOARDING_SKILLS} skills you ${label}`
    );
  }
}

export async function skipOnboarding(userId: string, input: { location?: { city?: string; zipCode?: string } } = {}) {
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  if (user.hasCompletedOnboarding) {
    throw new HttpError(400, 'ONBOARDING_ALREADY_COMPLETED', 'You have already completed onboarding');
  }

  const city = typeof input?.location?.city === 'string' ? input.location.city.trim() : '';
  const zipCode = typeof input?.location?.zipCode === 'string' ? input.location.zipCode.trim() : '';
  if (!city) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'City is required to complete onboarding');
  }
  if (!zipCode) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Zip / postal code is required to complete onboarding');
  }

  user.location.city = city;
  user.location.zipCode = zipCode;
  user.hasCompletedOnboarding = true;
  await user.save();
  return sanitizeUser(user);
}

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  if (user.hasCompletedOnboarding) {
    throw new HttpError(400, 'ONBOARDING_ALREADY_COMPLETED', 'You have already completed onboarding');
  }

  const teach = input?.teachSkills ?? [];
  const learn = input?.learnSkills ?? [];
  validateSelections(teach, 'can teach');
  validateSelections(learn, 'want to learn');

  const location = (input?.location ?? {}) as {
    city?: string;
    zipCode?: string;
    neighborhood?: string;
    coordinates?: [number, number];
    radiusPreference?: number;
  };
  const city = typeof location.city === 'string' ? location.city.trim() : '';
  if (!city) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'City is required to complete onboarding');
  }
  const zipCode = typeof location.zipCode === 'string' ? location.zipCode.trim() : '';
  if (!zipCode) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Zip / postal code is required to complete onboarding');
  }
  if (location.coordinates !== undefined && !isValidCoordinatePair(location.coordinates)) {
    throw new HttpError(400, 'INVALID_COORDINATES', 'Invalid coordinates');
  }
  const radius = Number(location.radiusPreference ?? 5);
  if (!Number.isFinite(radius) || radius < 1 || radius > 100) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Radius must be between 1 and 100 km');
  }

  const bio = input.bio !== undefined ? String(input.bio).trim() : user.bio;
  if (bio.length > 280) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Bio must be 280 characters or fewer');
  }

  const experienceLevel = input.experienceLevel ?? 'beginner';
  if (!VALID_EXPERIENCE.includes(experienceLevel)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid experience level');
  }

  const snapped = location.coordinates
    ? snapCoordinates(location.coordinates[0], location.coordinates[1])
    : ([0, 0] as [number, number]);
  const neighborhood = (location.neighborhood ?? '').trim();

  await Skill.updateMany(
    { userId: user._id, isDeleted: false },
    { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } }
  );

  const selections: Array<{
    type: 'teach' | 'learn';
    categoryId: string;
    skillName: string;
    description?: string;
  }> = [
    ...teach.map((skill) => ({ ...skill, type: 'teach' as const })),
    ...learn.map((skill) => ({ ...skill, type: 'learn' as const })),
  ];

  const seen = new Set<string>();
  for (const selection of selections) {
    const skillName = String(selection.skillName || '').trim();
    if (!skillName) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Skill name is required');
    }
    const key = `${selection.type}:${selection.categoryId}:${skillName.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const category = await loadActiveCategory(selection.categoryId);
    const known = category.skills.find(
      (item) => item.name.toLowerCase() === skillName.toLowerCase()
    );
    if (!known) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        `"${skillName}" is not a recognized skill in "${category.name}"`
      );
    }

    await Skill.create({
      userId: user._id,
      type: selection.type,
      categoryId: category._id,
      categoryName: category.name,
      skillName: known.name,
      description: String(selection.description ?? '').trim().slice(0, 500),
      proficiencyLevel: selection.type === 'teach' ? experienceLevel : 'beginner',
      format: 'either',
      sessionLength: '1hr',
      isActive: true,
      isDeleted: false,
      location: {
        city,
        zipCode,
        neighborhood,
        coordinates: snapped,
        radiusPreference: radius,
      },
    });
  }

  user.location.city = city;
  user.location.zipCode = zipCode;
  user.location.neighborhood = neighborhood;
  user.location.coordinates = snapped;
  user.location.radiusPreference = radius;
  user.bio = bio;
  user.showOnMap = Boolean(city && snapped[0] !== 0 && snapped[1] !== 0);
  if (Array.isArray(input.availability)) {
    user.availability = input.availability;
  }
  user.hasCompletedOnboarding = true;
  await user.save();

  await Skill.updateMany(
    { userId: user._id, isDeleted: false },
    {
      $set: {
        'location.city': city,
        'location.zipCode': zipCode,
        'location.neighborhood': neighborhood,
        'location.coordinates': snapped,
        'location.radiusPreference': radius,
      },
    }
  );

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
