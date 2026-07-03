import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Friend } from '../types';
import { Avatar } from './Avatar';
import { ScoreBadge } from './ScoreBadge';
import { Gloss } from './Gloss';
import { colors, radius, shadow, spacing } from '../lib/theme';
import {
  countdownLabel,
  daysUntilBirthday,
  formatMonthDayShort,
  turningAge,
} from '../lib/dates';
import { closenessMeta } from '../lib/constants';
import { computeScore } from '../lib/score';

interface Props {
  friend: Friend;
  onPress: () => void;
}

export function FriendCard({ friend, onPress }: Props) {
  const days = daysUntilBirthday(friend);
  const meta = closenessMeta(friend.closeness);
  const today = days === 0;
  const soon = days > 0 && days <= 7;

  const badgeColor = today ? colors.primary : soon ? colors.orange : colors.textSecondary;
  const age = turningAge(friend);
  const score = computeScore(friend);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        today && styles.cardToday,
        pressed && styles.pressed,
      ]}
    >
      <Gloss radius={radius.lg} />
      <Avatar
        name={friend.name}
        photoUri={friend.photoUri}
        size={50}
        ringColor={today ? colors.primary : undefined}
      />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {friend.name}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.dot, { backgroundColor: meta.color }]} />
          <Text style={styles.sub} numberOfLines={1}>
            {meta.label} · {formatMonthDayShort(friend.birthMonth, friend.birthDay)}
            {age != null ? ` · turns ${age}` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <View style={styles.rightStack}>
          {today ? (
            <View style={styles.todayBadge}>
              <Ionicons name="gift" size={14} color={colors.white} />
              <Text style={styles.todayText}>Today</Text>
            </View>
          ) : (
            <Text style={[styles.countdown, { color: badgeColor }]}>
              {countdownLabel(days)}
            </Text>
          )}
          <ScoreBadge score={score} small />
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardToday: {
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.7,
  },
  middle: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  sub: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightStack: {
    alignItems: 'flex-end',
    gap: 5,
  },
  countdown: {
    fontSize: 13,
    fontWeight: '600',
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  todayText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
});
