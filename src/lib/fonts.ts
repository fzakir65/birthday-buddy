import { Text as RNText, StyleSheet } from 'react-native';

/**
 * Fredoka — a rounded, chunky geometric sans (Yubo-style). RN can't derive
 * weights from a static custom font, so each weight is its own family and we
 * map the numeric `fontWeight` from styles to the right one.
 */
export const FREDOKA = {
  light: 'Fredoka_300Light',
  regular: 'Fredoka_400Regular',
  medium: 'Fredoka_500Medium',
  semibold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
};

export function familyForWeight(weight: unknown): string {
  const w = String(weight ?? '400');
  if (w === 'bold' || w === '700' || w === '800' || w === '900') return FREDOKA.bold;
  if (w === '600') return FREDOKA.semibold;
  if (w === '500') return FREDOKA.medium;
  if (w === '100' || w === '200' || w === '300') return FREDOKA.light;
  return FREDOKA.regular;
}

/**
 * Apply Fredoka to every <Text> globally by injecting a weight-matched
 * fontFamily when a style doesn't already specify one. Monkeypatches the
 * Text forwardRef render; if that shape ever changes it no-ops (text just
 * falls back to the system font — no crash).
 */
export function installFredoka(): void {
  const T = RNText as any;
  if (T.__fredokaPatched) return;
  const orig = T.render;
  if (typeof orig !== 'function') return;
  T.render = function (...args: any[]) {
    const props = args[0];
    const flat = (StyleSheet.flatten(props?.style) as any) || {};
    if (!flat.fontFamily) {
      args[0] = { ...props, style: [props?.style, { fontFamily: familyForWeight(flat.fontWeight) }] };
    }
    return orig.apply(this, args);
  };
  T.__fredokaPatched = true;
}
