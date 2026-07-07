import { Ionicons } from '@expo/vector-icons';
import { Closeness, MemoryVault, Settings } from '../types';
import { accents } from './theme';

export interface ClosenessMeta {
  key: Closeness;
  /** Playful "vibe" label shown in the UI */
  label: string;
  color: string;
  /** Higher = closer; used for sorting */
  weight: number;
}

// "Vibe" tags — ordered closest -> most distant. Used by the tag picker & sorting.
// The keys are the original closeness slots (kept so saved data stays valid); only
// the labels/colours changed to give them personality.
// Each vibe gets a distinct true hue — it drives the card outline colour.
export const CLOSENESS: ClosenessMeta[] = [
  { key: 'best', label: 'Day One', color: accents.red, weight: 6 },
  { key: 'close', label: 'Inner Circle', color: accents.orange, weight: 5 },
  { key: 'family', label: 'Family DLC', color: accents.yellow, weight: 5 },
  { key: 'friend', label: 'Chaos Agent', color: accents.purple, weight: 4 },
  { key: 'acquaintance', label: 'Soft Spot', color: accents.pink, weight: 3 },
  { key: 'colleague', label: 'Work NPC', color: accents.blue, weight: 2 },
];

export function closenessMeta(key: Closeness): ClosenessMeta {
  return CLOSENESS.find((c) => c.key === key) ?? CLOSENESS[3];
}

// Memory Vault fields — drives both the profile display and the edit form.
export interface VaultField {
  key: keyof MemoryVault;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
}

export const VAULT_FIELDS: VaultField[] = [
  { key: 'favoriteFood', label: 'Favourite food', icon: 'fast-food-outline', placeholder: 'e.g. matcha, ramen' },
  { key: 'favoriteColor', label: 'Favourite colour', icon: 'color-palette-outline', placeholder: 'e.g. sage green' },
  { key: 'hobbies', label: 'Hobbies', icon: 'tennisball-outline', placeholder: 'e.g. climbing, pottery' },
  { key: 'dreamGift', label: 'Dream gift', icon: 'sparkles-outline', placeholder: 'e.g. Sony WH-1000XM5' },
  { key: 'allergies', label: 'Allergies', icon: 'medkit-outline', placeholder: 'e.g. nuts, lactose' },
  { key: 'dislikes', label: 'Dislikes', icon: 'thumbs-down-outline', placeholder: 'e.g. lilies, surprises' },
  { key: 'sizes', label: 'Sizes', icon: 'shirt-outline', placeholder: 'e.g. M top, UK 8 shoe' },
  { key: 'insideJokes', label: 'Inside jokes', icon: 'happy-outline', placeholder: 'e.g. the airport story' },
];

// Reminder lead-times the user can toggle, in days before the birthday.
export const REMINDER_OPTIONS: { days: number; label: string }[] = [
  { days: 30, label: '30 days' },
  { days: 14, label: '2 weeks' },
  { days: 7, label: '1 week' },
  { days: 3, label: '3 days' },
  { days: 1, label: '1 day' },
  { days: 0, label: 'Day of' },
];

export const DEFAULT_SETTINGS: Settings = {
  defaultReminderDays: [30, 7, 3, 1, 0],
  notificationHour: 9,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  notificationStyle: 'push',
  premium: false,
};

/** Free tier cap from the product plan. */
export const FREE_FRIEND_LIMIT = 20;

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
