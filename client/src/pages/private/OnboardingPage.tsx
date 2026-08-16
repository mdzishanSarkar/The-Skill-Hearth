import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { completeOnboarding, uploadAvatar, reverseGeocode } from '../../services/users.service';
import { getCategories } from '../../services/skills';
import { getApiError } from '../../types/api.types';
import type { Category } from '../../types/skill.types';
import type { OnboardingInput, OnboardingSkillSelection } from '../../types/user.types';
import { getCategoryVisual, getSkillEmoji } from '../../data/skillVisuals';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';

const MAX_SKILLS = 10;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const RADIUS_OPTIONS = [1, 3, 5, 10, 20];

const STEPS = ['Skills you teach', 'Skills you want to learn', 'Your neighborhood', 'Your photo'];

const inputClass =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export default function OnboardingPage() {
  const { user, status, setUser } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [step, setStep] = useState(0);
  const [teach, setTeach] = useState<OnboardingSkillSelection[]>([]);
  const [learn, setLearn] = useState<OnboardingSkillSelection[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<
    'beginner' | 'intermediate' | 'advanced'
  >('beginner');

  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [radius, setRadius] = useState(5);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState('');

  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectedSkillCounts = useMemo(
    () => ({
      teach: teach.length,
      learn: learn.length,
    }),
    [teach, learn]
  );

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.hasCompletedOnboarding) return <Navigate to="/dashboard" replace />;

  function toggleSelection(
    list: OnboardingSkillSelection[],
    setList: (next: OnboardingSkillSelection[]) => void,
    selection: OnboardingSkillSelection
  ) {
    const exists = list.some(
      (item) => item.categoryId === selection.categoryId && item.skillName === selection.skillName
    );
    if (exists) {
      setList(
        list.filter(
          (item) =>
            !(item.categoryId === selection.categoryId && item.skillName === selection.skillName)
        )
      );
      return;
    }
    if (list.length >= MAX_SKILLS) {
      setError(`You can pick up to ${MAX_SKILLS} skills`);
      return;
    }
    setError('');
    setList([...list, selection]);
  }

  function renderSkillPicker(
    list: OnboardingSkillSelection[],
    setList: (next: OnboardingSkillSelection[]) => void,
    emptyMessage: string
  ) {
    if (loadingCategories) {
      return (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {categories.map((category) => {
          const visual = getCategoryVisual(category.name);
          return (
            <div key={category._id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span className="mr-1.5">{visual.emoji}</span>
                {category.name}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {category.skills.map((skill) => {
                  const selected = list.some(
                    (item) =>
                      item.categoryId === category._id && item.skillName === skill.name
                  );
                  return (
                    <button
                      key={`${category._id}-${skill.slug}`}
                      type="button"
                      onClick={() =>
                        toggleSelection(list, setList, {
                          categoryId: category._id,
                          skillName: skill.name,
                          description: skill.description || '',
                        })
                      }
                      className={
                        selected
                          ? 'inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white'
                          : 'inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                      }
                    >
                      <span>{getSkillEmoji(category.name, skill.name)}</span>
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <p className="text-sm text-gray-400 dark:text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  function handleNext() {
    setError('');
    if (step === 2) {
      if (!city.trim()) {
        setError('City is required — please enter your city.');
        return;
      }
      if (!zipCode.trim()) {
        setError('Zip / postal code is required — please enter it.');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function handleBack() {
    setError('');
    setStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setLocationNote('Location is not available in this browser — just type your city.');
      return;
    }
    setLocating(true);
    setLocationNote('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates([lng, lat]);
        setLocating(false);
        try {
          const place = await reverseGeocode(lat, lng);
          if (place.city) setCity(place.city);
          if (place.zipCode) setZipCode(place.zipCode);
          if (place.neighborhood) setNeighborhood(place.neighborhood);
          setLocationNote(
            `Found ${place.city || 'your area'}${place.neighborhood ? ` — ${place.neighborhood}` : ''}. Confirm below, or tap "Update my location" to try again.`
          );
        } catch {
          setLocationNote('Location set — we could not read the city name, so please type it below.');
        }
      },
      () => {
        setLocating(false);
        setLocationNote('We could not get your location — just type your city instead.');
      }
    );
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please choose a JPEG, PNG, WebP, or GIF image');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be 2MB or smaller');
      return;
    }
    setError('');
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const payload: OnboardingInput = {
      teachSkills: teach,
      learnSkills: learn,
      location: {
        city: city.trim(),
        zipCode: zipCode.trim(),
        neighborhood: neighborhood.trim() || undefined,
        coordinates: coordinates ?? [0, 0],
        radiusPreference: radius,
      },
      bio: bio.trim() || undefined,
      experienceLevel,
    };

    try {
      const savedUser = await completeOnboarding(payload);
      if (avatarFile) {
        const withAvatar = await uploadAvatar(avatarFile);
        setUser(withAvatar);
      } else {
        setUser(savedUser);
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getApiError(err));
      setSubmitting(false);
    }
  }

  async function handleSkipToLocation() {
    setError('');
    setStep(2);
  }

  const stepLabel = `${STEPS[step]} (${step + 1}/${STEPS.length})`;

  return (
    <div className="page-shell animate-fade-in py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Let's set you up</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Start with what you can teach and learn — the rest follows.
        </p>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleSkipToLocation}
          disabled={submitting}
          className="text-sm font-medium text-gray-500 dark:text-gray-400 underline-offset-2 hover:text-indigo-600 hover:underline"
        >
          Skip skills — set my location
        </button>
      </div>

      <ol className="mt-8 flex items-center gap-2">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 flex-col gap-1">
            <span
              className={
                index <= step
                  ? 'h-1.5 rounded-full bg-indigo-600'
                  : 'h-1.5 rounded-full bg-gray-200 dark:bg-gray-700'
              }
            />
            <span className="hidden text-[11px] font-medium text-gray-500 dark:text-gray-400 sm:block">
              {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stepLabel}</p>

        {step === 0 && (
          <>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              What could you teach a neighbor? Pick up to {MAX_SKILLS} — or skip ahead, you can add these later.
            </p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your experience</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as typeof experienceLevel)}
                className={inputClass + ' max-w-[180px]'}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="mt-4">{renderSkillPicker(teach, setTeach, '')}</div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSkipToLocation}
                className="text-sm font-medium text-gray-500 dark:text-gray-400 underline-offset-2 hover:text-indigo-600 hover:underline"
              >
                Skip — I don't teach anything yet
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              What would you love to learn? Pick up to {MAX_SKILLS} — or skip ahead, you can add these later.
            </p>
            <div className="mt-4">{renderSkillPicker(learn, setLearn, '')}</div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSkipToLocation}
                className="text-sm font-medium text-gray-500 dark:text-gray-400 underline-offset-2 hover:text-indigo-600 hover:underline"
              >
                Skip — nothing to learn right now
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              We only ever show an approximate neighborhood — never your exact spot. City and zip code
              are required.
            </p>
            <div className="mt-4 space-y-4">
              <Button type="button" variant="secondary" onClick={handleUseMyLocation} loading={locating}>
                {coordinates ? 'Update my location' : 'Use my location'}
              </Button>
              {locationNote && <p className="text-xs text-gray-500 dark:text-gray-400">{locationNote}</p>}
              {coordinates && (
                <p className="text-xs font-medium text-green-700 dark:text-green-300">
                  Location captured — approximated for privacy.
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="onboarding-city"
                  label="City"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. London"
                />
                <Input
                  id="onboarding-zip"
                  label="Zip / Postal code"
                  required
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="e.g. EC1A 1BB"
                />
              </div>
              <div>
                <Input
                  id="onboarding-neighborhood"
                  label="Neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="e.g. Shoreditch (optional)"
                />
              </div>
              <div>
                <label htmlFor="onboarding-radius" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Discovery radius
                </label>
                <select
                  id="onboarding-radius"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className={inputClass}
                >
                  {RADIUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} km
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Almost done — add a face to the name (optional).</p>
            <div className="mt-4 flex items-center gap-5">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <Avatar name={user.displayName} size="lg" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                id="onboarding-avatar"
                onChange={handleFileChange}
              />
              <div className="flex flex-col gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => document.getElementById('onboarding-avatar')?.click()}>
                  {avatarFile ? 'Choose a different photo' : 'Choose a photo'}
                </Button>
                {avatarFile && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setAvatarFile(null); setPreviewUrl(''); }}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">JPEG, PNG, WebP or GIF up to 2MB.</p>

            <div className="mt-5">
              <label htmlFor="onboarding-bio" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tell your neighbors a little about yourself
              </label>
              <textarea
                id="onboarding-bio"
                rows={3}
                maxLength={280}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What's your story with these skills? (optional)"
                className={inputClass}
              />
              <p className="mt-1 text-right text-xs text-gray-400 dark:text-gray-500">{bio.length}/280</p>
            </div>

            <div className="mt-5 rounded-md bg-gray-50 dark:bg-gray-900 p-4 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-gray-100">Ready to go</p>
              <p className="mt-1">
                Teaching <span className="font-medium">{selectedSkillCounts.teach}</span> skill
                {selectedSkillCounts.teach === 1 ? '' : 's'} · Learning{' '}
                <span className="font-medium">{selectedSkillCounts.learn}</span> skill
                {selectedSkillCounts.learn === 1 ? '' : 's'} ·{' '}
                {city.trim()
                  ? `${city.trim()}${zipCode.trim() ? ` (${zipCode.trim()})` : ''}${neighborhood.trim() ? `, ${neighborhood.trim()}` : ''}`
                  : 'No location'}
              </p>
            </div>
          </>
        )}

        {error && <div className="mt-4 rounded-md bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

        <div className="mt-6 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={handleBack} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} loading={submitting}>
              Start sharing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
