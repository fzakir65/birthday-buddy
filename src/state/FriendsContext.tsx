import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DateSuggestion,
  DiscoverItem,
  Friend,
  Memory,
  Settings,
  SpecialDay,
} from '../types';
import {
  loadFriends,
  saveFriends,
  loadSettings,
  saveSettings,
  hasSeeded,
  markSeeded,
  clearAll,
  loadMemories,
  saveMemories,
  loadSpecialDays,
  saveSpecialDays,
  loadSuggestions,
  saveSuggestions,
  loadDiscover,
  saveDiscover,
} from '../lib/storage';
import { DEFAULT_SETTINGS } from '../lib/constants';
import { defaultFriends } from '../data/seed';
import {
  defaultDiscover,
  defaultMemories,
  defaultSuggestions,
} from '../data/memoriesSeed';
import { firstName } from '../lib/memories';
import { makeId } from '../lib/id';
import {
  configureNotificationHandler,
  ensureAndroidChannel,
  requestPermissions,
  rescheduleAll,
  countScheduled,
} from '../lib/notifications';

type NewFriend = Omit<Friend, 'id' | 'createdAt'>;
type NewMemory = Omit<Memory, 'id'>;

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

  // --- Memories ---
  memories: Memory[];
  specialDays: SpecialDay[];
  suggestions: DateSuggestion[];
  discover: DiscoverItem[];
  /** True once the Memories tab has been opened this session (clears the red dot). */
  memoriesSeen: boolean;
  getMemory: (id: string) => Memory | undefined;
  addMemory: (data: NewMemory) => Memory;
  reactToMemory: (id: string, emoji: string) => void;
  acceptSuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  addSpecialDay: (discoverId: string) => void;
  dismissDiscover: (id: string) => void;
  markMemoriesSeen: () => void;
}

const FriendsContext = createContext<FriendsContextValue | undefined>(undefined);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [notifPermission, setNotifPermission] = useState(false);

  const [memories, setMemories] = useState<Memory[]>([]);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [suggestions, setSuggestions] = useState<DateSuggestion[]>([]);
  const [discover, setDiscover] = useState<DiscoverItem[]>([]);
  const [memoriesSeen, setMemoriesSeen] = useState(false);

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
      const fr = loadedFriends ?? [];

      // Memories & related collections — seed against the (seeded) friends on
      // first run; each key seeds independently so upgrades stay valid.
      let mem = await loadMemories();
      let sug = await loadSuggestions();
      let dis = await loadDiscover();
      let sp = await loadSpecialDays();
      if (mem == null) { mem = defaultMemories(fr); await saveMemories(mem); }
      if (sug == null) { sug = defaultSuggestions(fr); await saveSuggestions(sug); }
      if (dis == null) { dis = defaultDiscover(fr); await saveDiscover(dis); }
      if (sp == null) { sp = []; await saveSpecialDays(sp); }

      setSettings(loadedSettings);
      setFriends(fr);
      setMemories(mem);
      setSuggestions(sug);
      setDiscover(dis);
      setSpecialDays(sp);
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

  // Persist the memories collections whenever they change (after load).
  useEffect(() => {
    if (loaded.current) saveMemories(memories);
  }, [memories]);
  useEffect(() => {
    if (loaded.current) saveSpecialDays(specialDays);
  }, [specialDays]);
  useEffect(() => {
    if (loaded.current) saveSuggestions(suggestions);
  }, [suggestions]);
  useEffect(() => {
    if (loaded.current) saveDiscover(discover);
  }, [discover]);

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
    setMemories(defaultMemories(fresh));
    setSuggestions(defaultSuggestions(fresh));
    setDiscover(defaultDiscover(fresh));
    setSpecialDays([]);
  }, []);

  // --- Memories CRUD ---

  const getMemory = useCallback(
    (id: string) => memories.find((m) => m.id === id),
    [memories]
  );

  const addMemory = useCallback((data: NewMemory): Memory => {
    const memory: Memory = { ...data, id: makeId() };
    setMemories((prev) => [...prev, memory]);
    return memory;
  }, []);

  const reactToMemory = useCallback((id: string, emoji: string) => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, reactions: { ...m.reactions, [emoji]: (m.reactions[emoji] ?? 0) + 1 } }
          : m
      )
    );
  }, []);

  const acceptSuggestion = useCallback(
    (id: string) => {
      const sg = suggestions.find((x) => x.id === id);
      if (!sg) return;
      const friend = friends.find((f) => f.id === sg.friendId);
      const memory: Memory = {
        id: makeId(),
        y: sg.y,
        m: sg.m,
        d: sg.d,
        gradIndex: 2,
        emoji: sg.emoji,
        tagline: `${sg.kind.toLowerCase()} with ${friend ? firstName(friend.name) : 'a friend'}`,
        note: '',
        friendIds: friend ? [friend.id] : [],
        core: false,
        reactions: {},
      };
      setMemories((prev) => [...prev, memory]);
      setSuggestions((prev) => prev.filter((x) => x.id !== id));
    },
    [suggestions, friends]
  );

  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addSpecialDay = useCallback(
    (discoverId: string) => {
      const dv = discover.find((x) => x.id === discoverId);
      if (!dv || dv.added) return;
      setDiscover((prev) =>
        prev.map((x) => (x.id === discoverId ? { ...x, added: true } : x))
      );
      setSpecialDays((prev) => [
        ...prev,
        { id: `sp-${discoverId}`, m: dv.m, d: dv.d, emoji: dv.emoji, label: dv.title },
      ]);
    },
    [discover]
  );

  const dismissDiscover = useCallback((id: string) => {
    setDiscover((prev) =>
      prev.map((x) => (x.id === id ? { ...x, dismissed: true } : x))
    );
  }, []);

  const markMemoriesSeen = useCallback(() => setMemoriesSeen(true), []);

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
      memories,
      specialDays,
      suggestions,
      discover,
      memoriesSeen,
      getMemory,
      addMemory,
      reactToMemory,
      acceptSuggestion,
      dismissSuggestion,
      addSpecialDay,
      dismissDiscover,
      markMemoriesSeen,
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
      memories,
      specialDays,
      suggestions,
      discover,
      memoriesSeen,
      getMemory,
      addMemory,
      reactToMemory,
      acceptSuggestion,
      dismissSuggestion,
      addSpecialDay,
      dismissDiscover,
      markMemoriesSeen,
    ]
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends(): FriendsContextValue {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends must be used within a FriendsProvider');
  return ctx;
}
