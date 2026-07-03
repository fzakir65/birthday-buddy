import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DateSuggestion,
  DiscoverItem,
  Friend,
  Memory,
  Settings,
  SpecialDay,
} from '../types';
import { DEFAULT_SETTINGS } from './constants';

const FRIENDS_KEY = 'bb.friends.v1';
const SETTINGS_KEY = 'bb.settings.v1';
const SEEDED_KEY = 'bb.seeded.v1';
const MEMORIES_KEY = 'bb.memories.v1';
const SPECIALDAYS_KEY = 'bb.specialdays.v1';
const SUGGESTIONS_KEY = 'bb.suggestions.v1';
const DISCOVER_KEY = 'bb.discover.v1';

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

// --- Memories & related collections ---

async function loadList<T>(key: string): Promise<T[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T[];
  } catch (e) {
    console.warn(`Failed to load ${key}`, e);
    return null;
  }
}

async function saveList<T>(key: string, list: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn(`Failed to save ${key}`, e);
  }
}

export const loadMemories = () => loadList<Memory>(MEMORIES_KEY);
export const saveMemories = (m: Memory[]) => saveList(MEMORIES_KEY, m);
export const loadSpecialDays = () => loadList<SpecialDay>(SPECIALDAYS_KEY);
export const saveSpecialDays = (s: SpecialDay[]) => saveList(SPECIALDAYS_KEY, s);
export const loadSuggestions = () => loadList<DateSuggestion>(SUGGESTIONS_KEY);
export const saveSuggestions = (s: DateSuggestion[]) => saveList(SUGGESTIONS_KEY, s);
export const loadDiscover = () => loadList<DiscoverItem>(DISCOVER_KEY);
export const saveDiscover = (d: DiscoverItem[]) => saveList(DISCOVER_KEY, d);

/** Wipe everything — used by Settings "reset demo data". */
export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([
    FRIENDS_KEY,
    SETTINGS_KEY,
    SEEDED_KEY,
    MEMORIES_KEY,
    SPECIALDAYS_KEY,
    SUGGESTIONS_KEY,
    DISCOVER_KEY,
  ]);
}
