import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  /** Match the parent's border radius so the sheen clips cleanly. */
  radius?: number;
  /** Opacity of the top highlight (0..1). Circles/buttons want more. */
  strength?: number;
  /** How far down the sheen fades (0..1 of height). */
  span?: number;
  style?: ViewStyle;
}

/**
 * A glossy sheen overlay — a soft top-down white highlight that makes a flat
 * dark card or circle read as glassy/glossy. Drop it in as the FIRST child of a
 * relatively-positioned container (it sits behind the content, above the fill).
 */
export function Gloss({ radius = 16, strength = 0.07, span = 0.55, style }: Props) {
  return (
    <View pointerEvents="none" style={[styles.wrap, { borderRadius: radius }, style]}>
      <LinearGradient
        colors={[`rgba(255,255,255,${strength})`, 'rgba(255,255,255,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: span }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
});
