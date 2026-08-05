import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { updateMe, uploadAvatar } from '../../services/users.service';
import { getApiError } from '../../types/api.types';
import type { AvailabilitySlot } from '../../types/user.types';
import { resolveMediaUrl } from '../../utils/media';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AvailabilityCalendar from '../../components/social/AvailabilityCalendar';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const RADIUS_OPTIONS = [1, 3, 5, 10, 20];
const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export default function EditProfilePage() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [showOnMap, setShowOnMap] = useState(user?.showOnMap ?? true);
  const [city, setCity] = useState(user?.location.city || '');
  const [neighborhood, setNeighborhood] = useState(user?.location.neighborhood || '');
  const [radius, setRadius] = useState<number>(user?.location.radiusPreference ?? 5);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(user?.availability ?? []);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

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

  async function handleAvatarUpload() {
    if (!avatarFile) return;
    setUploading(true);
    setError('');
    try {
      const saved = await uploadAvatar(avatarFile);
      setUser(saved);
      setAvatarFile(null);
      setPreviewUrl('');
      toast.success('Profile photo updated');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const saved = await updateMe({
        displayName,
        bio,
        showOnMap,
        location: { city, neighborhood, radiusPreference: radius },
        availability,
      });
      setUser(saved);
      toast.success('Profile updated');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  const shownAvatar = previewUrl || user.avatar || '';

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Edit profile</h1>
      <p className="mt-1 text-sm text-gray-600">Update the details shown on your profile.</p>

      <div className="mt-8 rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900">Profile photo</h2>
        <div className="mt-4 flex items-center gap-5">
          {shownAvatar ? (
            <img
              src={previewUrl || resolveMediaUrl(shownAvatar)}
              alt="Avatar preview"
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <Avatar name={displayName || user.displayName} size="lg" />
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose image
            </Button>
            {avatarFile && (
              <Button type="button" size="sm" loading={uploading} onClick={handleAvatarUpload}>
                Upload photo
              </Button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          JPEG, PNG, WebP or GIF up to 2MB.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        <Input
          id="edit-name"
          label="Display name"
          required
          minLength={2}
          maxLength={50}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <div>
          <label htmlFor="edit-bio" className="mb-1 block text-sm font-medium text-gray-700">
            Bio
          </label>
          <textarea
            id="edit-bio"
            rows={3}
            maxLength={280}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people what you love to learn and share…"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{bio.length}/280</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="edit-city"
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Input
            id="edit-neighborhood"
            label="Neighborhood"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="edit-radius" className="mb-1 block text-sm font-medium text-gray-700">
            Discovery radius
          </label>
          <select
            id="edit-radius"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {RADIUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} km
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Availability</label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setAvailability((prev) => [
                  ...prev,
                  { day: 'monday', startTime: '09:00', endTime: '10:00' },
                ])
              }
            >
              Add slot
            </Button>
          </div>
          <p className="mt-1 text-xs text-gray-500">When are you usually available for sessions?</p>
          {availability.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {availability.map((slot, index) => (
                <li
                  key={index}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 p-2"
                >
                  <select
                    value={slot.day}
                    onChange={(e) => {
                      const next = [...availability];
                      next[index] = { ...slot, day: e.target.value };
                      setAvailability(next);
                    }}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => {
                      const next = [...availability];
                      next[index] = { ...slot, startTime: e.target.value };
                      setAvailability(next);
                    }}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-500">–</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => {
                      const next = [...availability];
                      next[index] = { ...slot, endTime: e.target.value };
                      setAvailability(next);
                    }}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${slot.day} slot`}
                    onClick={() => setAvailability((prev) => prev.filter((_, i) => i !== index))}
                    className="ml-auto rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-400">No availability set yet.</p>
          )}
        </div>

        <AvailabilityCalendar />

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={showOnMap}
            onChange={(e) => setShowOnMap(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Show me on the skill map
        </label>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
