import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradAt } from '../lib/memories';
import { colors } from '../lib/theme';

interface Props {
  gradIndex: number;
  photoUri?: string | null;
  /** Centered emoji (the memory's icon). */
  emoji?: string;
  emojiSize?: number;
  radius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * A memory "photo": renders the real image when `photoUri` is set, otherwise a
 * placeholder that approximates the mock's radial-over-diagonal gradient with a
 * diagonal LinearGradient base plus a soft directional highlight glow.
 */
export function MemoryImage({
  gradIndex,
  photoUri,
  emoji,
  emojiSize = 26,
  radius = 14,
  style,
  children,
}: Props) {
  const g = gradAt(gradIndex);
  return (
    <View style={[styles.wrap, { borderRadius: radius }, style]}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.fill} resizeMode="cover" />
      ) : (
        <>
          <LinearGradient
            colors={g.colors}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.fill}
          />
          {/* soft highlight glow from the spec corner */}
          <LinearGradient
            colors={[g.highlight, 'transparent']}
            start={{ x: g.hx, y: g.hy }}
            end={{ x: 1 - g.hx, y: g.hy + 0.7 }}
            style={styles.fill}
          />
        </>
      )}
      {emoji ? (
        <View style={styles.center} pointerEvents="none">
          <Text style={{ fontSize: emojiSize }}>{emoji}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const absoluteFill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.emptyTile },
  fill: absoluteFill,
  center: { ...absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
