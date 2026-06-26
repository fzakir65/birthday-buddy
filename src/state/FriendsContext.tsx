import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Friend, Settings } from '../types';
import {
  loadFriends,
  saveFriends,
  loadSettings,
  saveSettings,
  hasSeeded,
  markSeeded,
  clearAll,
} from '../lib/storage';
import { DEFAULT_SETTINGS } from '../lib/constants';
import { defaultFriends } from '../data/seed';
import { makeId } from '../lib/id';
import {
  configureNotificationHandler,
  ensureAndroidChannel,
  requestPermissions,
  rescheduleAll,
  countScheduled,
} from '../lib/notifications';

type NewFriend = Omit<Friend, 'id' | 'createdAt'>;

interface FriendsContextValue {
  friends: Friend[];
  settings: Settings;
  loading: boolean;
  scheduledCount: number;
  notifPermission: boolean;
  getFriend: (id: string) => Friend | undefined;
  addFriend: (data: NewFriend) => Friend;
  updateFriend: (id: string, data: Partial<Friend>) => void;
  deleteFriend: (id: string) => void;
  updateSettings: (data: Partial<Settings>) => void;
  resetDemoData: () => Promise<void>;
  enableNotifications: () => Promise<boolean>;
  refreshScheduledCount: () => Promise<void>;
}

const FriendsContext = createContext<FriendsContextValue | undefined>(undefined);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [notifPermission, setNotifPermission] = useState(false);

  const loaded = useRef(false);

  // Initial load + one-time seed.
  useEffect(() => {
    (async () => {
      configureNotificationHandler();
      await ensureAndroidChannel();

      const loadedSettings = await loadSettings();
      let loadedFriends = await loadFriends();

      if (loadedFriends == null && !(await hasSeeded())) {
        loadedFriends = defaultFriends();
        await saveFriends(loadedFriends);
        await markSeeded();
      }

      setSettings(loadedSettings);
      setFriends(loadedFriends ?? []);
      setLoading(false);
      loaded.current = true;

      const granted = await requestPermissions();
      setNotifPermission(granted);
      await rescheduleAll(loadedFriends ?? [], loadedSettings);
      setScheduledCount(await countScheduled());
    })();
  }, []);

  // Persist + reschedule whenever data changes (after the initial load).
  useEffect(() => {
    if (!loaded.current) return;
    saveFriends(friends);
    (async () => {
      await rescheduleAll(friends, settings);
      setScheduledCount(await countScheduled());
    })();
  }, [friends, settings]);

  useEffect(() => {
    if (!loaded.current) return;
    saveSettings(settings);
  }, [settings]);

  const getFriend = useCallback(
    (id: string) => friends.find((f) => f.id === id),
    [friends]
  );

  const addFriend = useCallback((data: NewFriend): Friend => {
    const friend: Friend = { ...data, id: makeId(), createdAt: new Date().toISOString() };
    setFriends((prev) => [...prev, friend]);
    return friend;
  }, []);

  const updateFriend = useCallback((id: string, data: Partial<Friend>) => {
    setFriends((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));
  }, []);

  const deleteFriend = useCallback((id: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateSettings = useCallback((data: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...data }));
  }, []);

  const resetDemoData = useCallback(async () => {
    await clearAll();
    const fresh = defaultFriends();
    await markSeeded();
    setSettings(DEFAULT_SETTINGS);
    setFriends(fresh);
  }, []);

  const enableNotifications = useCallback(async () => {
    const granted = await requestPermissions();
    setNotifPermission(granted);
    return granted;
  }, []);

  const refreshScheduledCount = useCallback(async () => {
    setScheduledCount(await countScheduled());
  }, []);

  const value = useMemo(
    () => ({
      friends,
      settings,
      loading,
      scheduledCount,
      notifPermission,
      getFriend,
      addFriend,
      updateFriend,
      deleteFriend,
      updateSettings,
      resetDemoData,
      enableNotifications,
      refreshScheduledCount,
    }),
    [
      friends,
      settings,
      loading,
      scheduledCount,
      notifPermission,
      getFriend,
      addFriend,
      updateFriend,
      deleteFriend,
      updateSettings,
      resetDemoData,
      enableNotifications,
      refreshScheduledCount,
    ]
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends(): FriendsContextValue {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends must be used within a FriendsProvider');
  return ctx;
}
