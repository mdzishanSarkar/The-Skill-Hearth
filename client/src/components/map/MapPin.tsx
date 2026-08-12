import L from 'leaflet';
import type { MapPin } from '../../types/discovery.types';
import { getSkillEmoji } from '../../data/skillVisuals';
import { resolveMediaUrl } from '../../utils/media';
import { formatDistance } from '../../utils/formatDistance';

const PIN_TYPE: Record<MapPin['type'], string> = {
  teach: 'Can teach',
  learn: 'Wants to learn',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildPinIcon(pin: MapPin): L.DivIcon {
  const emoji = getSkillEmoji(pin.categoryName, pin.skillName);
  return L.divIcon({
    className: 'skill-map-pin',
    html: `
      <div class="skill-map-pin__bubble skill-map-pin__bubble--${pin.type}" title="${escapeHtml(PIN_TYPE[pin.type])}">
        <span>${emoji}</span>
      </div>
    `,
    iconSize: [34, 50],
    iconAnchor: [17, 48],
    popupAnchor: [0, -48],
  });
}

export function buildPinPopup(pin: MapPin, isAuthenticated: boolean): string {
  const avatarUrl = resolveMediaUrl(pin.teacher.avatar || '');
  const avatar = avatarUrl
    ? `<img class="skill-map-popup__avatar${isAuthenticated ? '' : ' skill-map-popup__avatar--blur'}" src="${escapeHtml(avatarUrl)}" alt="" />`
    : `<div class="skill-map-popup__avatar skill-map-popup__avatar--fallback">${escapeHtml(
        (pin.teacher.displayName || '?').slice(0, 1).toUpperCase()
      )}</div>`;
  const rating =
    pin.teacher.reviewCount > 0
      ? `<span class="skill-map-popup__rating">★ ${pin.teacher.rating.toFixed(1)} (${pin.teacher.reviewCount})</span>`
      : '<span class="skill-map-popup__rating">No reviews yet</span>';

  const typeLabel = PIN_TYPE[pin.type];
  const formatLabel =
    pin.format === 'online' ? 'Online' : pin.format === 'in-person' ? 'In person' : 'Online or in-person';
  const sessionLengthLabel =
    { '30min': '30 min', '1hr': '1 hour', '2hr+': '2+ hours' }[pin.sessionLength] ?? pin.sessionLength;

  return `
    <div class="skill-map-popup">
      <div class="skill-map-popup__header">
        ${avatar}
        <div class="skill-map-popup__identity">
          <span class="skill-map-popup__name">${escapeHtml(pin.teacher.displayName)}</span>
          ${rating}
        </div>
      </div>
      <div class="skill-map-popup__skill">
        ${escapeHtml(pin.skillName)}
        <span class="skill-map-popup__category">${escapeHtml(pin.categoryName)}</span>
      </div>
      <div class="skill-map-popup__meta">
        <span class="skill-map-popup__type skill-map-popup__type--${pin.type}">${typeLabel}</span>
        ${pin.distanceKm !== undefined ? `<span>${formatDistance(pin.distanceKm)}</span>` : ''}
        <span>${formatLabel}</span>
        <span>${sessionLengthLabel}</span>
      </div>
      <div class="skill-map-popup__actions">
        <a class="skill-map-popup__cta" href="/skills/${escapeHtml(pin.id)}" data-skill-id="${escapeHtml(pin.id)}">
          View skill details
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
          </svg>
        </a>
        <a class="skill-map-popup__cta--secondary" href="/profile/${escapeHtml(pin.userId)}">View profile</a>
      </div>
    </div>
  `;
}
