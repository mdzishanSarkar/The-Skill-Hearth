export const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export function formatAvailabilitySlot(
  day: string,
  startTime: string,
  endTime: string
): string {
  return `${DAY_LABELS[day] ?? day} ${startTime}–${endTime}`;
}
