import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../lib/theme';
import { scoreStatus } from '../lib/score';

/** Hex -> rgba with given alpha (soft tinted background). */
function tint(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface Props {
  score: number;
  /** Also show the status label (e.g. "Elite Bestie") next to the number. */
  showStatus?: boolean;
  small?: boolean;
}

/** Compact friendship-score chip, colour-coded by tier. */
export function ScoreBadge({ score, showStatus = false, small }: Props) {
  const st = scoreStatus(score);
  return (
    <View
      style={[
        styles.badge,
        small && styles.badgeSmall,
        { backgroundColor: tint(st.color, 0.14) },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: st.color }]} />
      <Text style={[styles.score, small && styles.scoreSmall, { color: st.color }]}>{score}</Text>
      {showStatus ? <Text style={[styles.status, { color: st.color }]}>{st.label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  score: { fontSize: 14, fontWeight: '800' },
  scoreSmall: { fontSize: 12 },
  status: { fontSize: 12, fontWeight: '700', marginLeft: 2 },
});
