import React from 'react';
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
import { Avatar } from '../components/Avatar';
import { ScoreBadge } from '../components/ScoreBadge';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { colors, radius, shadow, spacing } from '../lib/theme';
import {
  daysUntilBirthday,
  turningAge,
  upcomingWithin,
} from '../lib/dates';
import { neglectedFriends, scoreStatus, socialBattery } from '../lib/score';
import { MONTHS } from '../lib/constants';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel(): string {
  const d = new Date();
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    d.getDay()
  ];
  return `${weekday}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const { friends } = useFriends();

  const today = friends.filter((f) => daysUntilBirthday(f) === 0);
  const thisWeek = upcomingWithin(friends, 7).filter((f) => daysUntilBirthday(f) > 0);
  const thisMonth = upcomingWithin(friends, 30);
  const upcoming = upcomingWithin(friends, 30);

  const battery = socialBattery(friends);
  const batteryStatus = scoreStatus(battery);
  const neglected = neglectedFriends(friends).slice(0, 3);

  const openFriend = (id: string) => navigation.navigate('FriendProfile', { id });
  const addFriend = () => navigation.navigate('AddEditFriend');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.date}>{todayLabel()}</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={addFriend} hitSlop={8}>
            <Ionicons name="add" size={26} color={colors.white} />
          </Pressable>
        </View>

        {/* Today's birthdays — celebratory */}
        {today.length > 0 && (
          <View style={styles.todayBlock}>
            <View style={styles.todayHeader}>
              <Text style={styles.todayEmoji}>🎉</Text>
              <Text style={styles.todayTitle}>
                {today.length === 1
                  ? "Today's birthday"
                  : `${today.length} birthdays today`}
              </Text>
            </View>
            {today.map((f) => {
              const age = turningAge(f);
              return (
                <Pressable
                  key={f.id}
                  style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.85 }]}
                  onPress={() => openFriend(f.id)}
                >
                  <Avatar name={f.name} photoUri={f.photoUri} size={58} ringColor={colors.white} />
                  <View style={styles.heroMid}>
                    <Text style={styles.heroName}>{f.name}</Text>
                    <Text style={styles.heroSub}>
                      {age != null ? `Turns ${age} today` : 'Birthday today!'}
                    </Text>
                  </View>
                  <View style={styles.heroAction}>
                    <Ionicons name="happy" size={18} color={colors.primary} />
                    <Text style={styles.heroActionText}>Celebrate</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <Stat label="This week" value={thisWeek.length} color={colors.orange} />
          <Stat label="This month" value={thisMonth.length} color={colors.blue} />
          <Stat label="Friends" value={friends.length} color={colors.purple} />
        </View>

        {/* Social health */}
        {friends.length > 0 && (
          <View style={styles.healthBlock}>
            <Text style={styles.sectionTitle}>Social health</Text>
            <View style={styles.batteryCard}>
              <View style={styles.batteryTop}>
                <Text style={styles.batteryLabel}>Social battery</Text>
                <Text style={[styles.batteryPct, { color: batteryStatus.color }]}>
                  {battery}%
                </Text>
              </View>
              <View style={styles.batteryTrack}>
                <View
                  style={[
                    styles.batteryFill,
                    { width: `${battery}%`, backgroundColor: batteryStatus.color },
                  ]}
                />
              </View>
              <Text style={styles.batterySub}>
                {neglected.length === 0
                  ? "You're on top of your circle — nice. 💚"
                  : `${neglected.length} ${
                      neglected.length === 1 ? 'friend needs' : 'friends need'
                    } a nudge`}
              </Text>
            </View>
            {neglected.map(({ friend, score, daysSince }) => (
              <Pressable
                key={friend.id}
                onPress={() => openFriend(friend.id)}
                style={({ pressed }) => [styles.neglectRow, pressed && { opacity: 0.7 }]}
              >
                <Avatar name={friend.name} photoUri={friend.photoUri} size={40} />
                <View style={styles.neglectMid}>
                  <Text style={styles.neglectName} numberOfLines={1}>
                    {friend.name}
                  </Text>
                  <Text style={styles.neglectSub}>
                    {daysSince > 0
                      ? `${daysSince} day${daysSince === 1 ? '' : 's'} since you reached out`
                      : 'Could use a hello'}
                  </Text>
                </View>
                <ScoreBadge score={score} small />
              </Pressable>
            ))}
          </View>
        )}

        {/* Upcoming */}
        <Text style={styles.sectionTitle}>Upcoming · next 30 days</Text>
        {upcoming.length === 0 ? (
          <EmptyState
            icon="balloon-outline"
            title="No birthdays coming up"
            subtitle="Add a friend and we'll make sure you never miss their day."
          >
            <Button title="Add a friend" icon="add" onPress={addFriend} />
          </EmptyState>
        ) : (
          upcoming.map((f) => (
            <FriendCard key={f.id} friend={f} onPress={() => openFriend(f.id)} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  date: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  todayBlock: {
    marginBottom: spacing.xl,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 6,
  },
  todayEmoji: { fontSize: 18 },
  todayTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadow.floating,
  },
  heroMid: { flex: 1, marginLeft: spacing.md },
  heroName: { fontSize: 19, fontWeight: '800', color: colors.white },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  heroAction: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroActionText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadow.card,
  },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  healthBlock: { marginBottom: spacing.xl },
  batteryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  batteryTop: { flexDirection: 'row', alignItems: 'center' },
  batteryLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  batteryPct: { fontSize: 22, fontWeight: '800' },
  batteryTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.separator,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  batteryFill: { height: '100%', borderRadius: radius.pill },
  batterySub: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm },
  neglectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  neglectMid: { flex: 1 },
  neglectName: { fontSize: 16, fontWeight: '600', color: colors.text },
  neglectSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
