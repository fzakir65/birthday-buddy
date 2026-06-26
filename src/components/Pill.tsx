import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../lib/theme';

interface Props {
  label: string;
  color?: string;
  /** solid = filled background, soft = tinted background + coloured text */
  variant?: 'solid' | 'soft';
  small?: boolean;
}

/** Hex -> rgba with given alpha (for soft tinted backgrounds). */
function tint(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function Pill({ label, color = colors.blue, variant = 'soft', small }: Props) {
  const solid = variant === 'solid';
  return (
    <View
      style={[
        styles.pill,
        small && styles.pillSmall,
        { backgroundColor: solid ? color : tint(color, 0.14) },
      ]}
    >
      <Text
        style={[
          styles.text,
          small && styles.textSmall,
          { color: solid ? colors.white : color },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 11,
  },
});
