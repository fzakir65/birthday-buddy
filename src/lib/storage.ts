import AsyncStorage from '@react-native-async-storage/async-storage';
import { Friend, Settings } from '../types';
import { DEFAULT_SETTINGS } from './constants';

const FRIENDS_KEY = 'bb.friends.v1';
const SETTINGS_KEY = 'bb.settings.v1';
const SEEDED_KEY = 'bb.seeded.v1';

export async function loadFriends(): Promise<Friend[] | null> {
  try {
    const raw = await AsyncStorage.getItem(FRIENDS_KEY);
    if (raw == null) return null;
    const parsed = JSON.parse(raw) as Friend[];
    // Backfill fields added in later versions so older saves stay valid.
    return parsed.map((f) => ({ ...f, interactions: f.interactions ?? [] }));
  } catch (e) {
    console.warn('Failed to load friends', e);
    return null;
  }
}

export async function saveFriends(friends: Friend[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
  } catch (e) {
    console.warn('Failed to save friends', e);
  }
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw == null) return DEFAULT_SETTINGS;
    // Merge so newly-added settings keys get defaults.
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch (e) {
    console.warn('Failed to load settings', e);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings', e);
  }
}

export async function hasSeeded(): Promise<boolean> {
  return (await AsyncStorage.getItem(SEEDED_KEY)) === 'true';
}

export async function markSeeded(): Promise<void> {
  await AsyncStorage.setItem(SEEDED_KEY, 'true');
}

/** Wipe everything — used by Settings "reset demo data". */
export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([FRIENDS_KEY, SETTINGS_KEY, SEEDED_KEY]);
}
