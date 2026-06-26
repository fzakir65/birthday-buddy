import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenProps } from '../navigation/types';
import { useFriends } from '../state/FriendsContext';
import { FriendCard } from '../components/FriendCard';
import { colors, radius, shadow, spacing } from '../lib/theme';
import { MONTHS, WEEKDAYS_SHORT } from '../lib/constants';
import { Friend } from '../types';

function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

export function CalendarScreen({ navigation }: TabScreenProps<'Calendar'>) {
  const { friends } = useFriends();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month0, setMonth0] = useState(today.getMonth()); // 0-11
  const [selectedDay, setSelectedDay] = useState<number | null>(
    today.getDate()
  );

  // day-of-month -> friends with a birthday that day this displayed month
  const byDay = useMemo(() => {
    const map: Record<number, Friend[]> = {};
    for (const f of friends) {
      if (f.birthMonth === month0 + 1) {
        (map[f.birthDay] ??= []).push(f);
      }
    }
    return map;
  }, [friends, month0]);

  const totalDays = daysInMonth(year, month0);
  const firstWeekday = new Date(year, month0, 1).getDay(); // 0=Sun

  // Build grid cells (leading blanks + days)
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const changeMonth = (delta: number) => {
    let m = month0 + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth0(m);
    setYear(y);
    setSelectedDay(null);
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    month0 === today.getMonth() &&
    year === today.getFullYear();

  const selectedFriends = selectedDay ? byDay[selectedDay] ?? [] : [];
  const monthCount = Object.values(byDay).reduce((n, arr) => n + arr.length, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Calendar</Text>

        <View style={styles.card}>
          {/* Month switcher */}
          <View style={styles.monthRow}>
            <Pressable onPress={() => changeMonth(-1)} hitSlop={10} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </Pressable>
            <Text style={styles.monthLabel}>
              {MONTHS[month0]} {year}
            </Text>
            <Pressable onPress={() => changeMonth(1)} hitSlop={10} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={22} color={colors.primary} />
            </Pressable>
          </View>

          <Text style={styles.monthCount}>
            {monthCount === 0
              ? 'No birthdays this month'
              : `${monthCount} ${monthCount === 1 ? 'birthday' : 'birthdays'} this month`}
          </Text>

          {/* Weekday header */}
          <View style={styles.weekRow}>
            {WEEKDAYS_SHORT.map((w, i) => (
              <Text key={i} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day == null) return <View key={i} style={styles.cell} />;
              const has = !!byDay[day];
              const selected = day === selectedDay;
              const todayCell = isToday(day);
              return (
                <Pressable
                  key={i}
                  style={styles.cell}
                  onPress={() => setSelectedDay(day)}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      todayCell && styles.dayToday,
                      selected && styles.daySelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        todayCell && styles.dayTextToday,
                        selected && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  <View style={styles.dotWrap}>
                    {has ? (
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: selected ? colors.primary : colors.primary },
                        ]}
                      />
                    ) : (
                      <View style={styles.dotPlaceholder} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Selected day detail */}
        {selectedDay != null && (
          <View style={styles.detail}>
            <Text style={styles.detailTitle}>
              {MONTHS[month0]} {selectedDay}
            </Text>
            {selectedFriends.length === 0 ? (
              <Text style={styles.detailEmpty}>No birthdays on this day.</Text>
            ) : (
              selectedFriends.map((f) => (
                <FriendCard
                  key={f.id}
                  friend={f}
                  onPress={() => navigation.navigate('FriendProfile', { id: f.id })}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// 1/7 of the row width. Literal so TS accepts it as a DimensionValue.
const CELL = '14.2857%';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  title: { fontSize: 34, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  navBtn: { padding: spacing.xs },
  monthLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
  monthCount: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: {
    width: CELL,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CELL,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: { backgroundColor: colors.primarySoft },
  daySelected: { backgroundColor: colors.primary },
  dayText: { fontSize: 15, color: colors.text },
  dayTextToday: { color: colors.primary, fontWeight: '700' },
  dayTextSelected: { color: colors.white, fontWeight: '700' },
  dotWrap: { height: 8, justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotPlaceholder: { width: 6, height: 6 },
  detail: { marginTop: spacing.xl },
  detailTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailEmpty: { color: colors.textSecondary, fontSize: 15 },
});
