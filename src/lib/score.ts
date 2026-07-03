// Friendship Score — a 0-100 measure of how warm a connection is.
//
// It's a *pure* function of a friend's logged interactions + relationship vibe:
//   - every interaction adds points that fade over a rolling window (recent matters more)
//   - a long silence (neglect) drains the score
// Nothing here touches storage or React; screens just render what these return.

import { Ionicons } from '@expo/vector-icons';
import { Closeness, Friend, Interaction, InteractionType } from '../types';
import { makeId } from './id';
import { colors } from './theme';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Interactions older than this contribute ~nothing. */
const WINDOW_DAYS = 120;
/** No neglect penalty for the first few weeks after the last contact. */
const NEGLECT_GRACE_DAYS = 21;
/** Score lost per day once past the grace period. */
const NEGLECT_PER_DAY = 0.5;
/** Caps so one very active (or very neglected) friend can't run away. */
const MAX_CONTRIBUTION = 46;
const MAX_PENALTY = 46;

/** Baseline you start from before any interactions — closer vibes sit higher. */
const BASE: Record<Closeness, number> = {
  best: 58,
  close: 52,
  family: 52,
  friend: 45,
  acquaintance: 40,
  colleague: 38,
};

export interface InteractionMeta {
  type: InteractionType;
  /** Imperative button label, e.g. "Call" */
  label: string;
  /** Past-tense log label, e.g. "Phoned" */
  past: string;
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
  /** Fresh point value (before recency decay) */
  points: number;
  color: string;
}

// Ordered roughly low -> high effort.
export const INTERACTION_TYPES: InteractionMeta[] = [
  { type: 'wish', label: 'Wish', past: 'Birthday wish', icon: 'balloon-outline', emoji: '🎂', points: 12, color: colors.red },
  { type: 'checkin', label: 'Check in', past: 'Checked in', icon: 'hand-left-outline', emoji: '👋', points: 7, color: colors.yellow },
  { type: 'message', label: 'Text', past: 'Messaged', icon: 'chatbubble-outline', emoji: '💬', points: 8, color: colors.orange },
  { type: 'call', label: 'Call', past: 'Called', icon: 'call-outline', emoji: '📞', points: 14, color: colors.amber },
  { type: 'hangout', label: 'Hang', past: 'Hung out', icon: 'cafe-outline', emoji: '🤝', points: 18, color: colors.gold },
  { type: 'gift', label: 'Gift', past: 'Gave a gift', icon: 'gift-outline', emoji: '🎁', points: 22, color: colors.coral },
];

const META_BY_TYPE: Record<InteractionType, InteractionMeta> = INTERACTION_TYPES.reduce(
  (acc, m) => {
    acc[m.type] = m;
    return acc;
  },
  {} as Record<InteractionType, InteractionMeta>
);

export function interactionMeta(type: InteractionType): InteractionMeta {
  return META_BY_TYPE[type] ?? INTERACTION_TYPES[0];
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Whole days since the most recent interaction (falls back to when they were added). */
export function daysSinceLastTouch(friend: Friend, now: Date = new Date()): number {
  const interactions = friend.interactions ?? [];
  const lastTouch = interactions.reduce(
    (max, it) => Math.max(max, new Date(it.date).getTime()),
    0
  );
  const ref = lastTouch || new Date(friend.createdAt).getTime();
  return Math.max(0, Math.floor((now.getTime() - ref) / MS_PER_DAY));
}

/** The friendship score, 0-100. */
export function computeScore(friend: Friend, now: Date = new Date()): number {
  const base = BASE[friend.closeness] ?? 45;
  const nowMs = now.getTime();

  let contribution = 0;
  for (const it of friend.interactions ?? []) {
    const meta = META_BY_TYPE[it.type];
    if (!meta) continue;
    const daysAgo = Math.max(0, (nowMs - new Date(it.date).getTime()) / MS_PER_DAY);
    const recency = Math.max(0, 1 - daysAgo / WINDOW_DAYS);
    contribution += meta.points * recency;
  }
  contribution = Math.min(contribution, MAX_CONTRIBUTION);

  const sinceLast = daysSinceLastTouch(friend, now);
  const penalty =
    sinceLast <= NEGLECT_GRACE_DAYS
      ? 0
      : Math.min(MAX_PENALTY, (sinceLast - NEGLECT_GRACE_DAYS) * NEGLECT_PER_DAY);

  return clamp(Math.round(base + contribution - penalty), 0, 100);
}

export interface ScoreStatus {
  label: string;
  color: string;
}

/** A human, slightly cheeky label for a score (red = hottest, dims as it fades). */
export function scoreStatus(score: number): ScoreStatus {
  if (score >= 80) return { label: 'Elite Bestie', color: colors.red };
  if (score >= 55) return { label: 'Going strong', color: colors.orange };
  if (score >= 30) return { label: 'Keep it warm', color: colors.yellow };
  return { label: 'Connection fading', color: colors.textSecondary };
}

/** New interactions array with a freshly-logged connection prepended. */
export function appendInteraction(
  friend: Friend,
  type: InteractionType,
  now: Date = new Date()
): Interaction[] {
  const entry: Interaction = { id: makeId(), type, date: now.toISOString() };
  return [entry, ...(friend.interactions ?? [])];
}

/** Overall "social battery" — average score across everyone (0 when empty). */
export function socialBattery(friends: Friend[], now: Date = new Date()): number {
  if (friends.length === 0) return 0;
  const total = friends.reduce((sum, f) => sum + computeScore(f, now), 0);
  return Math.round(total / friends.length);
}

export interface ScoredFriend {
  friend: Friend;
  score: number;
  daysSince: number;
}

/** Friends whose score has slipped below `threshold`, coldest first. */
export function neglectedFriends(
  friends: Friend[],
  now: Date = new Date(),
  threshold = 45
): ScoredFriend[] {
  return friends
    .map((friend) => ({
      friend,
      score: computeScore(friend, now),
      daysSince: daysSinceLastTouch(friend, now),
    }))
    .filter((x) => x.score < threshold)
    .sort((a, b) => a.score - b.score);
}
