import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenProps } from '../navigation/types';
import { useFriends } from '../state/FriendsContext';
import { FriendCard } from '../components/FriendCard';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { colors, radius, shadow, spacing } from '../lib/theme';
import { daysUntilBirthday } from '../lib/dates';
import { closenessMeta, FREE_FRIEND_LIMIT } from '../lib/constants';

type Sort = 'upcoming' | 'name' | 'closeness';

const SORTS: { key: Sort; label: string }[] = [
  { key: 'upcoming', label: 'Next up' },
  { key: 'name', label: 'Name' },
  { key: 'closeness', label: 'Vibe' },
];

export function FriendsScreen({ navigation }: TabScreenProps<'Friends'>) {
  const { friends, settings } = useFriends();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('upcoming');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? friends.filter((f) => f.name.toLowerCase().includes(q))
      : friends;
    const arr = [...filtered];
    if (sort === 'name') {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'closeness') {
      arr.sort(
        (a, b) =>
          closenessMeta(b.closeness).weight - closenessMeta(a.closeness).weight ||
          daysUntilBirthday(a) - daysUntilBirthday(b)
      );
    } else {
      arr.sort((a, b) => daysUntilBirthday(a) - daysUntilBirthday(b));
    }
    return arr;
  }, [friends, query, sort]);

  const openFriend = (id: string) => navigation.navigate('FriendProfile', { id });
  const addFriend = () => navigation.navigate('AddEditFriend');

  const nearLimit = !settings.premium && friends.length >= FREE_FRIEND_LIMIT;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <Pressable style={styles.addBtn} onPress={addFriend} hitSlop={8}>
          <Ionicons name="add" size={26} color={colors.white} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
      </View>

      {/* Sort segmented control */}
      <View style={styles.segment}>
        {SORTS.map((s) => {
          const active = s.key === sort;
          return (
            <Pressable
              key={s.key}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => setSort(s.key)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {nearLimit && (
          <View style={styles.limitBanner}>
            <Ionicons name="star" size={16} color={colors.orange} />
            <Text style={styles.limitText}>
              Free plan holds {FREE_FRIEND_LIMIT} friends. Upgrade for unlimited.
            </Text>
          </View>
        )}

        {friends.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No friends yet"
            subtitle="Add the people you care about and never miss their birthday again."
          >
            <Button title="Add your first friend" icon="add" onPress={addFriend} />
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No matches"
            subtitle={`Nobody matches “${query}”.`}
          />
        ) : (
          <>
            <Text style={styles.count}>
              {visible.length} {visible.length === 1 ? 'friend' : 'friends'}
            </Text>
            {visible.map((f) => (
              <FriendCard key={f.id} friend={f} onPress={() => openFriend(f.id)} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { flex: 1, fontSize: 34, fontWeight: '800', color: colors.text },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.separator,
    borderRadius: radius.md,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: colors.card,
    ...shadow.card,
  },
  segmentText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  segmentTextActive: { color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 124 },
  count: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.elevated,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  limitText: { flex: 1, fontSize: 13, color: colors.yellow },
});
