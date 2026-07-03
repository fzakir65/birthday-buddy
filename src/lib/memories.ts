// Pure logic + palette for the Memories feature. No storage / React here.

import { Friend, Memory, SpecialDay } from '../types';
import { MONTHS } from './constants';
import { daysUntilBirthday, nextBirthday, startOfDay } from './dates';

/**
 * Memory "photo" placeholders. The HTML mock uses a radial highlight over a
 * dark diagonal linear-gradient; RN has no radial gradient, so each entry keeps
 * the two diagonal stops plus a highlight colour + corner that `MemoryImage`
 * layers as a soft directional glow to approximate it.
 */
export interface GradSpec {
  colors: [string, string];
  highlight: string;
  /** Highlight corner in 0..1 space. */
  hx: number;
  hy: number;
}

export const GRADS: GradSpec[] = [
  { colors: ['#3a2415', '#8a5a24'], highlight: 'rgba(255,214,120,0.25)', hx: 0.25, hy: 0.1 },
  { colors: ['#0e1620', '#2c4a63'], highlight: 'rgba(120,180,255,0.18)', hx: 0.75, hy: 0.15 },
  { colors: ['#1a2410', '#46662a'], highlight: 'rgba(190,255,140,0.15)', hx: 0.3, hy: 0.2 },
  { colors: ['#221020', '#6b2a52'], highlight: 'rgba(255,120,200,0.2)', hx: 0.7, hy: 0.1 },
  { colors: ['#0f1e1c', '#2a6b5e'], highlight: 'rgba(120,255,220,0.16)', hx: 0.25, hy: 0.15 },
  { colors: ['#281409', '#7a4218'], highlight: 'rgba(255,160,90,0.22)', hx: 0.7, hy: 0.2 },
];

export function gradAt(i: number): GradSpec {
  return GRADS[((i % GRADS.length) + GRADS.length) % GRADS.length];
}

/** Emoji palette for the new-memory picker. */
export const MEMOJI = ['📸', '🍜', '🎬', '🎤', '☕', '🎮', '🥾', '🎂', '🎳', '🧁', '📚', '🌧️'];
/** Reaction set for the viewer. */
export const REACTS = ['❤️', '🔥', '😭', '💀'];

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export const memKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

/** "July 1, 2026" */
export function formatMemoryDate(me: Pick<Memory, 'y' | 'm' | 'd'>): string {
  return `${MONTHS[me.m - 1]} ${me.d}, ${me.y}`;
}

export interface Flashback {
  mem: Memory;
  years: number;
}

/** A memory from a previous year that shares today's month & day. */
export function findFlashback(memories: Memory[], now: Date = new Date()): Flashback | null {
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const y = now.getFullYear();
  const mem = memories.find((me) => me.m === m && me.d === d && me.y < y);
  return mem ? { mem, years: y - mem.y } : null;
}

export interface StreakInfo {
  friend: Friend;
  count: number;
  /** Playful "weeks" figure = count × 4. */
  weeks: number;
}

/** Friends featured in this year's memories, most-featured first (top `limit`). */
export function computeStreaks(
  memories: Memory[],
  friends: Friend[],
  year: number = new Date().getFullYear(),
  limit = 4
): StreakInfo[] {
  const perFriend: Record<string, number> = {};
  for (const me of memories) {
    if (me.y !== year) continue;
    for (const fid of me.friendIds ?? []) perFriend[fid] = (perFriend[fid] ?? 0) + 1;
  }
  return Object.keys(perFriend)
    .map((fid) => ({ friend: friends.find((f) => f.id === fid), count: perFriend[fid] }))
    .filter((x): x is { friend: Friend; count: number } => !!x.friend)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((x) => ({ friend: x.friend, count: x.count, weeks: x.count * 4 }));
}

export interface Recap {
  memoryCount: number;
  coreCount: number;
  bestStreakWeeks: number;
  topFriend: Friend | null;
}

export function computeRecap(
  memories: Memory[],
  friends: Friend[],
  year: number = new Date().getFullYear()
): Recap {
  const memsYr = memories.filter((me) => me.y === year);
  const streaks = computeStreaks(memories, friends, year, 1);
  return {
    memoryCount: memsYr.length,
    coreCount: memsYr.filter((me) => me.core).length,
    bestStreakWeeks: streaks[0]?.weeks ?? 0,
    topFriend: streaks[0]?.friend ?? null,
  };
}

export interface MonthGroup {
  key: string;
  label: string;
  memories: Memory[];
}

/** Memories grouped by month, newest month first, days ascending within. */
export function groupByMonth(memories: Memory[]): MonthGroup[] {
  const groups: Record<number, Memory[]> = {};
  for (const me of memories) {
    const k = me.y * 12 + (me.m - 1);
    (groups[k] = groups[k] ?? []).push(me);
  }
  return Object.keys(groups)
    .map(Number)
    .sort((a, b) => b - a)
    .map((k) => ({
      key: `g${k}`,
      label: `${MONTHS[k % 12]}, ${Math.floor(k / 12)}`,
      memories: groups[k].slice().sort((a, b) => a.d - b.d),
    }));
}

export interface CalendarTile {
  day: number;
  memory: Memory | null;
  isBirthday: boolean;
  special: SpecialDay | null;
  isToday: boolean;
  isFuture: boolean;
}

/** One tile per day of the displayed month (1..N, not weekday-aligned). */
export function buildCalendarTiles(
  year: number,
  month0: number,
  memories: Memory[],
  friends: Friend[],
  specialDays: SpecialDay[],
  now: Date = new Date()
): CalendarTile[] {
  const totalDays = new Date(year, month0 + 1, 0).getDate();
  const todayStart = startOfDay(now).getTime();

  const byDate: Record<string, Memory> = {};
  for (const me of memories) byDate[memKey(me.y, me.m, me.d)] = me;

  const bdByDay: Record<number, boolean> = {};
  for (const f of friends) if (f.birthMonth === month0 + 1) bdByDay[f.birthDay] = true;

  const spByDay: Record<number, SpecialDay> = {};
  for (const sp of specialDays) if (sp.m === month0 + 1) spByDay[sp.d] = sp;

  const tiles: CalendarTile[] = [];
  for (let day = 1; day <= totalDays; day++) {
    const cellTime = new Date(year, month0, day).getTime();
    tiles.push({
      day,
      memory: byDate[memKey(year, month0 + 1, day)] ?? null,
      isBirthday: !!bdByDay[day],
      special: spByDay[day] ?? null,
      isToday:
        day === now.getDate() && month0 === now.getMonth() && year === now.getFullYear(),
      isFuture: cellTime > todayStart,
    });
  }
  return tiles;
}

export function birthdayCountForMonth(friends: Friend[], month0: number): number {
  return friends.filter((f) => f.birthMonth === month0 + 1).length;
}

export interface BirthdayRing {
  friend: Friend;
  days: number;
  when: string;
}

/** Upcoming birthdays within 60 days, soonest first (max 8). */
export function birthdayRings(friends: Friend[], now: Date = new Date()): BirthdayRing[] {
  return friends
    .map((friend) => ({ friend, days: daysUntilBirthday(friend, now) }))
    .filter((x) => x.days <= 60)
    .sort((a, b) => a.days - b.days)
    .slice(0, 8)
    .map((x) => ({
      friend: x.friend,
      days: x.days,
      when: x.days === 0 ? 'today' : x.days === 1 ? 'tmrw' : `in ${x.days}d`,
    }));
}

/** The month/day six months after a friend's birthday (for half-birthdays). */
export function halfBirthday(friend: Friend): { m: number; d: number } {
  let m = friend.birthMonth + 6;
  let d = friend.birthDay;
  if (m > 12) m -= 12;
  if (m === 2 && d > 28) d = 28;
  return { m, d };
}

/** Jump target month for a friend's next birthday. */
export function nextBirthdayMonth(friend: Friend, now: Date = new Date()) {
  const nb = nextBirthday(friend, now);
  return { year: nb.getFullYear(), month0: nb.getMonth() };
}
