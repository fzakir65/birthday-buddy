import { DateSuggestion, DiscoverItem, Friend, Memory } from '../types';
import { MONTHS_SHORT } from '../lib/constants';
import { firstName, halfBirthday } from '../lib/memories';

const MS = 24 * 60 * 60 * 1000;

/** {y, m, d} for a date `days` before today. */
function ago(days: number): { y: number; m: number; d: number } {
  const d = new Date(Date.now() - days * MS);
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

/**
 * Demo memories, relative to today, referencing the first five seeded friends
 * ([aisha, daniel, mum, leo, priya]). Mirrors the design prototype.
 */
export function defaultMemories(friends: Friend[]): Memory[] {
  const id = (f?: Friend) => (f ? [f.id] : []);
  const [aisha, daniel, mum, leo, priya] = friends;

  const M = (
    days: number,
    gradIndex: number,
    emoji: string,
    tagline: string,
    friendIds: string[],
    extra: Partial<Memory> = {}
  ): Memory => ({
    id: `seed-m-${days}`,
    ...ago(days),
    gradIndex,
    emoji,
    tagline,
    note: '',
    friendIds,
    core: false,
    reactions: {},
    ...extra,
  });

  return [
    M(365, 3, '🎂', "Aisha's birthday — the cake barely survived", id(aisha), {
      note: 'Rooftop dinner, fourteen people, one very melted cake. She cried (happy tears).',
      core: true,
      reactions: { '❤️': 6, '😭': 3, '🔥': 2 },
    }),
    M(2, 5, '🍜', 'ramen run with the day ones', [...id(aisha), ...id(daniel)], {
      note: 'Daniel ordered extra chashu. Again.',
      reactions: { '🔥': 2 },
    }),
    M(5, 1, '🎬', 'movie night — no-phones challenge failed in 11 min', [...id(priya), ...id(aisha)], {
      reactions: { '💀': 4 },
    }),
    M(9, 2, '🏋️', 'gym arc continues', id(leo), { reactions: { '🔥': 5 } }),
    M(14, 3, '🎤', "priya's karaoke era is REAL", [...id(priya), ...id(daniel)], {
      note: 'Three encores. Security got involved (politely).',
      core: true,
      reactions: { '😭': 2, '💀': 7 },
    }),
    M(20, 0, '☕', '3-hour coffee debrief', id(aisha), { reactions: { '❤️': 3 } }),
    M(26, 2, '🥾', 'sunrise hike. never again (same time next week?)', id(leo), {
      reactions: { '🔥': 1, '😭': 1 },
    }),
    M(33, 1, '🎮', 'co-op til 2am', id(daniel), { reactions: { '💀': 2 } }),
    M(41, 0, '🧁', "mum's 'experimental' bake day", id(mum), {
      note: 'The lavender ones were… brave.',
      reactions: { '❤️': 4 },
    }),
    M(48, 4, '📚', 'bookshop crawl — 6 shops, 0 restraint', id(aisha), {
      core: true,
      reactions: { '❤️': 5, '🔥': 1 },
    }),
    M(55, 1, '🌧️', 'rain check → photo walk', id(priya), {}),
    M(63, 5, '🎳', 'bowling. leo carried, we got humbled', id(leo), { reactions: { '💀': 3 } }),
  ];
}

export function defaultSuggestions(friends: Friend[]): DateSuggestion[] {
  const rows: [string, number, string, string, number][] = [
    ['sg1', 1, 'Hang', '🤝', 3],
    ['sg2', 4, 'Call', '📞', 6],
    ['sg3', 3, 'Gym sesh', '🏋️', 8],
  ];
  return rows
    .filter(([, idx]) => friends[idx])
    .map(([id, idx, kind, emoji, days]) => ({
      id,
      friendId: friends[idx].id,
      kind,
      emoji,
      ...ago(days),
    }));
}

export function defaultDiscover(friends: Friend[]): DiscoverItem[] {
  const [aisha, daniel] = friends;
  const items: DiscoverItem[] = [];
  if (daniel) {
    items.push({
      id: 'dv1',
      emoji: '🥂',
      title: `Friendversary · ${firstName(daniel.name)}`,
      sub: 'Jul 12 · one year since day one',
      m: 7,
      d: 12,
      added: false,
      dismissed: false,
    });
  }
  if (aisha) {
    const h = halfBirthday(aisha);
    items.push({
      id: 'dv2',
      emoji: '🎈',
      title: `Half-birthday · ${firstName(aisha.name)}`,
      sub: `${MONTHS_SHORT[h.m - 1]} ${h.d} · low-key celebration`,
      m: h.m,
      d: h.d,
      added: false,
      dismissed: false,
    });
  }
  items.push(
    { id: 'dv3', emoji: '💘', title: "Galentine's Day", sub: 'Feb 13 · with the girls', m: 2, d: 13, added: false, dismissed: false },
    { id: 'dv4', emoji: '🌍', title: 'Friendship Day', sub: 'Jul 30 · international friendship day', m: 7, d: 30, added: false, dismissed: false }
  );
  return items;
}
