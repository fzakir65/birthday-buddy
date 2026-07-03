import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../navigation/types';
import { useFriends } from '../state/FriendsContext';
import { Avatar } from '../components/Avatar';
import { MemoryImage } from '../components/MemoryImage';
import { colors, radius, spacing } from '../lib/theme';
import { REACTS, firstName, formatMemoryDate } from '../lib/memories';

export function MemoryViewerScreen({ route, navigation }: RootStackScreenProps<'MemoryViewer'>) {
  const { memoryId } = route.params;
  const { getMemory, friends, reactToMemory } = useFriends();
  const memory = getMemory(memoryId);

  if (!memory) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>This memory no longer exists.</Text>
      </SafeAreaView>
    );
  }

  const tagged = memory.friendIds
    .map((id) => friends.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => !!f);

  const openFriend = (id: string) => {
    navigation.goBack();
    navigation.navigate('FriendProfile', { id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="close" size={20} color={colors.white} />
        </Pressable>
        <Text style={styles.date}>{formatMemoryDate(memory)}</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MemoryImage
          gradIndex={memory.gradIndex}
          photoUri={memory.photoUri}
          emoji={memory.emoji}
          emojiSize={90}
          radius={24}
          style={styles.photo}
        >
          {memory.core && (
            <View style={styles.corePill}>
              <Ionicons name="star" size={13} color={colors.white} />
              <Text style={styles.corePillText}>Core memory</Text>
            </View>
          )}
        </MemoryImage>

        <Text style={styles.tagline}>{memory.tagline}</Text>
        {memory.note ? <Text style={styles.note}>{memory.note}</Text> : null}

        {tagged.length > 0 && (
          <View style={styles.chipRow}>
            {tagged.map((f) => (
              <Pressable key={f.id} style={styles.friendChip} onPress={() => openFriend(f.id)}>
                <Avatar name={f.name} photoUri={f.photoUri} size={24} />
                <Text style={styles.friendChipText}>{firstName(f.name)}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.reactRow}>
          {REACTS.map((e) => (
            <Pressable
              key={e}
              style={({ pressed }) => [styles.reactPill, pressed && { transform: [{ scale: 0.94 }] }]}
              onPress={() => reactToMemory(memory.id, e)}
            >
              <Text style={{ fontSize: 16 }}>{e}</Text>
              <Text style={styles.reactCount}>{memory.reactions[e] ?? 0}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  missing: { padding: spacing.xl, color: colors.textSecondary, fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  date: { fontSize: 15, fontWeight: '700', color: colors.white },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2 },
  photo: { aspectRatio: 3 / 4, width: '100%' },
  corePill: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  corePillText: { fontSize: 12, fontWeight: '800', color: colors.white },
  tagline: { fontSize: 24, fontWeight: '800', color: colors.white, lineHeight: 30, marginTop: spacing.xl },
  note: { fontSize: 15, color: colors.noteBody, lineHeight: 22, marginTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  friendChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 10 },
  friendChipText: { fontSize: 14, fontWeight: '600', color: colors.white },
  reactRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  reactPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 13 },
  reactCount: { fontSize: 13, fontWeight: '800', color: colors.white },
});
