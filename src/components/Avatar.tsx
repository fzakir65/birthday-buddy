import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colorFromString, colors } from '../lib/theme';

interface Props {
  name: string;
  photoUri?: string | null;
  size?: number;
  ringColor?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, photoUri, size = 52, ringColor }: Props) {
  const radius = size / 2;
  const ringStyle = ringColor
    ? { borderWidth: 2.5, borderColor: ringColor }
    : null;

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={[
          { width: size, height: size, borderRadius: radius },
          ringStyle,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colorFromString(name),
        },
        ringStyle,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.white,
    fontWeight: '700',
  },
});
