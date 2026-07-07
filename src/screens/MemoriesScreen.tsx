import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenProps } from '../navigation/types';
import { useFriends } from '../state/FriendsContext';
import { Avatar } from '../components/Avatar';
import { MemoryImage } from '../components/MemoryImage';
import { Gloss } from '../components/Gloss';
import { colors, colorFromString, radius, spacing } from '../lib/theme';
import { MONTHS } from '../lib/constants';
import {
  birthdayCountForMonth,
  birthdayRings,
  buildCalendarTiles,
  computeRecap,
  computeStreaks,
  findFlashback,
  firstName,
  formatMemoryDate,
  groupByMonth,
  nextBirthdayMonth,
} from '../lib/memories';

const SIDE = spacing.lg; // 16
const GAP = 8;

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/** Rounded-square avatar (initials on hashed colour) — matches the mock squircles. */
function Squircle({ name, size, rad }: { name: string; size: number; rad: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rad,
        backgroundColor: colorFromString(name),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.white, fontWeight: '700', fontSize: size * 0.38 }}>
        {initials(name)}
      </Text>
    </View>
  );
}

export function MemoriesScreen({ navigation }: TabScreenProps<'Memories'>) {
  const {
    friends,
    memories,
    specialDays,
    suggestions,
    discover,
    acceptSuggestion,
    dismissSuggestion,
    addSpecialDay,
    dismissDiscover,
    markMemoriesSeen,
  } = useFriends();

  const [view, setView] = useState<'feed' | 'calendar'>('feed');
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth0, setCalMonth0] = useState(now.getMonth());

  useEffect(() => {
    markMemoriesSeen();
  }, [markMemoriesSeen]);

  const { width } = useWindowDimensions();
  const tileW = (width - SIDE * 2 - GAP * 3) / 4;
  const tileH = (tileW * 4) / 3;

  const openViewer = (memoryId: string) => navigation.navigate('MemoryViewer', { memoryId });
  const openFriend = (id: string) => navigation.navigate('FriendProfile', { id });
  const addToday = () =>
    navigation.navigate('NewMemory', {
      y: now.getFullYear(),
      m: now.getMonth() + 1,
      d: now.getDate(),
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.segment}>
          <Gloss radius={radius.pill} strength={0.05} />
          {(['feed', 'calendar'] as const).map((v) => {
            const on = view === v;
            return (
              <Pressable
                key={v}
                onPress={() => setView(v)}
                style={[styles.segItem, on && styles.segItemOn]}
              >
                <Text style={[styles.segText, on && styles.segTextOn]}>
                  {v === 'feed' ? 'Memories' : 'Calendar'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.todayChip} onPress={addToday} hitSlop={6}>
          <Ionicons name="add" size={14} color={colors.white} />
          <Text style={styles.todayChipText}>Today</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {view === 'feed'
          ? renderFeed({ memories, friends, tileW, tileH, openViewer, openFriend })
          : renderCalendar({
              friends,
              memories,
              specialDays,
              suggestions,
              discover,
              calYear,
              calMonth0,
              setCalYear,
              setCalMonth0,
              tileW,
              tileH,
              now,
              openViewer,
              openFriend,
              acceptSuggestion,
              dismissSuggestion,
              addSpecialDay,
              dismissDiscover,
              navigation,
            })}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------- Feed view ----------------

function renderFeed({
  memories,
  friends,
  tileW,
  tileH,
  openViewer,
  openFriend,
}: any) {
  const fb = findFlashback(memories);
  const streaks = computeStreaks(memories, friends);
  const recap = computeRecap(memories, friends);
  const months = groupByMonth(memories);
  const year = new Date().getFullYear();

  return (
    <>
      {fb && (
        <Pressable onPress={() => openViewer(fb.mem.id)} style={{ marginBottom: spacing.lg }}>
          <MemoryImage
            gradIndex={fb.mem.gradIndex}
            photoUri={fb.mem.photoUri}
            radius={22}
            style={{ height: 200, justifyContent: 'space-between', padding: 14 }}
          >
            <View style={styles.fbBadge}>
              <Text style={styles.fbBadgeText}>
                ON THIS DAY · {fb.years === 1 ? '1 YEAR' : `${fb.years} YEARS`} AGO
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 38 }}>{fb.mem.emoji}</Text>
              <Text style={styles.fbTagline}>{fb.mem.tagline}</Text>
              <Text style={styles.fbDate}>{formatMemoryDate(fb.mem)} · tap to relive</Text>
            </View>
          </MemoryImage>
        </Pressable>
      )}

      {streaks.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.streakRow}
        >
          {streaks.map((s: any) => (
            <Pressable key={s.friend.id} style={styles.streakChip} onPress={() => openFriend(s.friend.id)}>
              <Avatar name={s.friend.name} photoUri={s.friend.photoUri} size={26} />
              <Text style={styles.streakName}>{firstName(s.friend.name)}</Text>
              <Ionicons name="flame" size={12} color={colors.orange} />
              <Text style={styles.streakWeeks}>{s.weeks}w</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.recap}>
        <Gloss radius={20} />
        <Text style={styles.recapTitle}>{year} recap · so far</Text>
        <View style={styles.recapStats}>
          {[
            { n: String(recap.memoryCount), label: 'memories' },
            { n: String(recap.coreCount), label: 'core moments' },
            { n: `${recap.bestStreakWeeks}w`, label: 'best streak' },
          ].map((st, i) => (
            <View key={i} style={styles.recapTile}>
              <Gloss radius={14} strength={0.05} />
              <Text style={styles.recapNum}>{st.n}</Text>
              <Text style={styles.recapLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
        {recap.topFriend && (
          <Text style={styles.recapFooter}>
            Most featured: {firstName(recap.topFriend.name)}
          </Text>
        )}
      </View>

      {months.map((mo) => (
        <View key={mo.key} style={{ marginBottom: spacing.lg }}>
          <Text style={styles.monthHeader}>{mo.label}</Text>
          <View style={styles.grid}>
            {mo.memories.map((me) => (
              <Pressable key={me.id} onPress={() => openViewer(me.id)} style={{ marginBottom: GAP }}>
                <MemoryImage
                  gradIndex={me.gradIndex}
                  photoUri={me.photoUri}
                  emoji={me.emoji}
                  emojiSize={26}
                  radius={14}
                  style={{ width: tileW, height: tileH }}
                >
                  <Text style={[styles.tileDay, styles.tileDayShadow]}>{me.d}</Text>
                  {me.core && (
                    <View style={styles.coreBadge}>
                      <Ionicons name="star" size={10} color={colors.white} />
                    </View>
                  )}
                </MemoryImage>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

// ---------------- Calendar view ----------------

function renderCalendar(p: any) {
  const {
    friends,
    memories,
    specialDays,
    suggestions,
    discover,
    calYear,
    calMonth0,
    setCalYear,
    setCalMonth0,
    tileW,
    tileH,
    now,
    openViewer,
    openFriend,
    acceptSuggestion,
    dismissSuggestion,
    addSpecialDay,
    dismissDiscover,
    navigation,
  } = p;

  const rings = birthdayRings(friends, now);
  const tiles = buildCalendarTiles(calYear, calMonth0, memories, friends, specialDays, now);
  const bdCount = birthdayCountForMonth(friends, calMonth0);
  const memCount = tiles.filter((t: any) => t.memory).length;
  const visibleDiscover = discover.filter((d: any) => !d.dismissed);

  const changeMonth = (delta: number) => {
    let m = calMonth0 + delta;
    let y = calYear;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    setCalMonth0(m);
    setCalYear(y);
  };

  const openAddAt = (day: number) =>
    navigation.navigate('NewMemory', { y: calYear, m: calMonth0 + 1, d: day });

  return (
    <>
      {rings.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ringRow}>
          {rings.map((r: any) => {
            const ringColor = r.days === 0 ? colors.primary : r.days <= 7 ? colors.orange : colors.segmentActive;
            const whenColor = r.days === 0 ? colors.primary : r.days <= 7 ? colors.orange : colors.textSecondary;
            const jump = () => {
              const nb = nextBirthdayMonth(r.friend, now);
              setCalYear(nb.year);
              setCalMonth0(nb.month0);
            };
            return (
              <Pressable key={r.friend.id} style={styles.ringItem} onPress={jump}>
                <View style={[styles.ring, { borderColor: ringColor }]}>
                  <Squircle name={r.friend.name} size={44} rad={15} />
                </View>
                <Text style={styles.ringName}>{firstName(r.friend.name)}</Text>
                <Text style={[styles.ringWhen, { color: whenColor }]}>{r.when}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Fast Add banner */}
      <Pressable style={styles.fastAdd} onPress={() => navigation.navigate('AddEditFriend')}>
        <Gloss radius={18} />
        <Ionicons name="people" size={22} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.fastAddTitle}>Fast Add birthdays</Text>
          <Text style={styles.fastAddSub}>Up to 500 contacts at once</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </Pressable>

      {/* Month nav */}
      <View style={styles.monthNav}>
        <Pressable style={styles.monthBtn} onPress={() => changeMonth(-1)} hitSlop={8}>
          <Gloss radius={19} strength={0.06} />
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.monthNavTitle}>{MONTHS[calMonth0]}, {calYear}</Text>
          <Text style={styles.monthNavSub}>
            {bdCount} {bdCount === 1 ? 'birthday' : 'birthdays'} · {memCount} {memCount === 1 ? 'memory' : 'memories'}
          </Text>
        </View>
        <Pressable style={styles.monthBtn} onPress={() => changeMonth(1)} hitSlop={8}>
          <Gloss radius={19} strength={0.06} />
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </Pressable>
      </View>

      {/* Month grid */}
      <View style={styles.grid}>
        {tiles.map((t: any) => {
          const border = t.isBirthday
            ? 'rgba(255,59,48,0.7)'
            : t.special
            ? 'rgba(224,168,46,0.75)'
            : t.isToday
            ? colors.todayRing
            : t.memory
            ? 'transparent'
            : colors.emptyTileBorder;

          const common = {
            width: tileW,
            height: tileH,
            marginBottom: GAP,
            opacity: t.isFuture ? 0.45 : 1,
          };

          const badge = t.isBirthday ? (
            <View style={[styles.calBadge, { backgroundColor: 'rgba(255,59,48,0.9)' }]}>
              <Ionicons name="gift" size={10} color={colors.white} />
            </View>
          ) : t.special ? (
            <View style={[styles.calBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
              <Ionicons name="star" size={10} color={colors.gold} />
            </View>
          ) : null;

          if (t.memory) {
            return (
              <Pressable key={t.day} onPress={() => openViewer(t.memory.id)}>
                <MemoryImage
                  gradIndex={t.memory.gradIndex}
                  photoUri={t.memory.photoUri}
                  emoji={t.memory.emoji}
                  emojiSize={22}
                  radius={14}
                  style={{ ...common, borderWidth: border === 'transparent' ? 0 : 2, borderColor: border }}
                >
                  <Text style={[styles.tileDay, styles.tileDayShadow]}>{t.day}</Text>
                  {badge}
                </MemoryImage>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={t.day}
              disabled={t.isFuture}
              onPress={() => (t.isFuture ? undefined : openAddAt(t.day))}
              style={[
                styles.emptyTile,
                common,
                { borderColor: border },
              ]}
            >
              {!t.isFuture && <Ionicons name="add" size={20} color={colors.todayRing} />}
              <Text style={[styles.emptyDay, { color: t.isFuture ? colors.disabledFuture : '#8A8A90' }]}>
                {t.day}
              </Text>
              {badge}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.legend}>Tap + on any day to add a memory</Text>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <View style={{ marginTop: spacing.xl }}>
          <Text style={styles.sectionH}>Add to your calendar?</Text>
          {suggestions.map((sg: any) => {
            const f = friends.find((x: any) => x.id === sg.friendId);
            if (!f) return null;
            return (
              <View key={sg.id} style={styles.sugRow}>
                <Avatar name={f.name} photoUri={f.photoUri} size={46} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sugTitle}>{sg.kind} with {firstName(f.name)}</Text>
                  <Text style={styles.sugSub}>{MONTHS[sg.m - 1].slice(0, 3)} {sg.d} · from your activity</Text>
                </View>
                <Pressable style={styles.acceptBtn} onPress={() => acceptSuggestion(sg.id)}>
                  <Text style={styles.acceptText}>Accept</Text>
                </Pressable>
                <Pressable onPress={() => dismissSuggestion(sg.id)} hitSlop={8}>
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {/* Discover */}
      {visibleDiscover.length > 0 && (
        <View style={{ marginTop: spacing.xl }}>
          <Text style={styles.sectionH}>Discover special days</Text>
          {visibleDiscover.map((dv: any) => (
            <View key={dv.id} style={styles.sugRow}>
              <View style={styles.dvTile}>
                <Text style={{ fontSize: 22 }}>{dv.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sugTitle}>{dv.title}</Text>
                <Text style={styles.sugSub}>{dv.sub}</Text>
              </View>
              <Pressable
                style={[styles.acceptBtn, dv.added && styles.addedBtn]}
                onPress={() => addSpecialDay(dv.id)}
                disabled={dv.added}
              >
                <Text style={[styles.acceptText, dv.added && styles.addedText]}>
                  {dv.added ? 'Added' : 'Add'}
                </Text>
              </Pressable>
              <Pressable onPress={() => dismissDiscover(dv.id)} hitSlop={8}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIDE,
    paddingTop: 12,
    paddingBottom: spacing.md,
  },
  segment: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.pill, padding: 3, borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden' },
  segItem: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: radius.pill },
  segItemOn: { backgroundColor: colors.segmentActive },
  segText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  segTextOn: { color: colors.white },
  todayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  todayChipText: { fontSize: 13, fontWeight: '700', color: colors.white },
  content: { paddingHorizontal: SIDE, paddingBottom: 124 },

  // flashback
  fbBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  fbBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: colors.white },
  fbTagline: { fontSize: 21, fontWeight: '800', color: colors.white, marginTop: 4 },
  fbDate: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  // streaks
  streakRow: { gap: spacing.sm, paddingBottom: spacing.lg },
  streakChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.glassBorder },
  streakName: { fontSize: 13, fontWeight: '700', color: colors.white },
  streakWeeks: { fontSize: 12, fontWeight: '800', color: colors.orange },

  // recap
  recap: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden' },
  recapTitle: { fontSize: 15, fontWeight: '800', color: colors.white, marginBottom: spacing.md },
  recapStats: { flexDirection: 'row', gap: GAP },
  recapTile: { flex: 1, backgroundColor: colors.cardInner, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden' },
  recapNum: { fontSize: 21, fontWeight: '800', color: colors.orange },
  recapLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  recapFooter: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.md },

  // grid + tiles
  monthHeader: { fontSize: 20, fontWeight: '800', color: colors.white, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tileDay: { position: 'absolute', bottom: 6, left: 8, fontSize: 14, fontWeight: '800', color: colors.white },
  tileDayShadow: { textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  coreBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.pill, paddingHorizontal: 5, paddingVertical: 1 },
  coreBadgeText: { fontSize: 11 },

  // rings
  ringRow: { gap: spacing.md, paddingBottom: spacing.lg },
  ringItem: { alignItems: 'center', width: 64 },
  ring: { width: 58, height: 58, borderRadius: 20, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  ringName: { fontSize: 11, fontWeight: '600', color: colors.white, marginTop: 4 },
  ringWhen: { fontSize: 10, fontWeight: '800', marginTop: 1 },

  // fast add
  fastAdd: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden' },
  fastAddTitle: { fontSize: 16, fontWeight: '800', color: colors.white },
  fastAddSub: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },

  // month nav
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  monthBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden' },
  monthNavTitle: { fontSize: 19, fontWeight: '800', color: colors.white },
  monthNavSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },

  // empty calendar tile
  emptyTile: { backgroundColor: colors.emptyTile, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyDay: { position: 'absolute', bottom: 6, left: 8, fontSize: 14, fontWeight: '800' },
  calBadge: { position: 'absolute', top: 5, right: 5, borderRadius: radius.pill, paddingHorizontal: 4, paddingVertical: 1 },
  calBadgeText: { fontSize: 11 },
  legend: { textAlign: 'center', fontSize: 12, color: colors.textTertiary, marginTop: spacing.md },

  // suggestions / discover
  sectionH: { fontSize: 18, fontWeight: '800', color: colors.white, marginBottom: spacing.md },
  sugRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  sugTitle: { fontSize: 16, fontWeight: '700', color: colors.white },
  sugSub: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  dvTile: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  acceptBtn: { backgroundColor: colors.white, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 18 },
  acceptText: { fontSize: 14, fontWeight: '800', color: colors.black },
  addedBtn: { backgroundColor: colors.cardInner },
  addedText: { color: colors.textSecondary },
});
