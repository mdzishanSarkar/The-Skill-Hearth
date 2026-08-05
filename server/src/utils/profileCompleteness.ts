import type { IUser } from '../models';

export interface ProfileCompleteness {
  score: number;
  missing: string[];
  suggestions: string[];
}

export function calculateProfileCompleteness(user: IUser): ProfileCompleteness {
  let score = 0;
  const missing: string[] = [];
  const suggestions: string[] = [];

  if (user.displayName && user.displayName.length >= 2) {
    score += 15;
  } else {
    missing.push('displayName');
    suggestions.push('Add a display name');
  }

  if (user.bio && user.bio.length > 0) {
    score += 15;
  } else {
    missing.push('bio');
    suggestions.push('Write a short bio about yourself');
  }

  if (user.avatar && user.avatar.length > 0) {
    score += 15;
  } else {
    missing.push('avatar');
    suggestions.push('Upload a profile photo');
  }

  if (user.location.city && user.location.city.length > 0) {
    score += 15;
  } else {
    missing.push('location');
    suggestions.push('Set your location');
  }

  if (user.availability && user.availability.length > 0) {
    score += 15;
  } else {
    missing.push('availability');
    suggestions.push('Add your availability schedule');
  }

  if (user.hasCompletedOnboarding) {
    score += 15;
  } else {
    missing.push('onboarding');
    suggestions.push('Complete the onboarding process');
  }

  if (user.isEmailVerified) {
    score += 5;
  } else {
    missing.push('emailVerified');
    suggestions.push('Verify your email address');
  }

  if (user.isIdVerified) {
    score += 5;
  } else {
    suggestions.push('Verify your ID for a trusted profile badge');
  }

  score = Math.min(100, score);

  return { score, missing, suggestions };
}
