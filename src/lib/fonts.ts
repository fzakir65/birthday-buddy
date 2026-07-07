import { Text as RNText, StyleSheet } from 'react-native';

/**
 * Typography mix (Snap/Yubo/BeReal-inspired): a rounded display font for
 * headings and bold UI text, the plain system font (SF Pro on iOS) for body
 * and captions — the "BeReal move".
 *
 * A/B by flipping DISPLAY below (hot-reloads in the browser preview):
 *  - 'baloo'   — Baloo 2 headings + system body. Closest free stand-in for
 *                Yubo's Right Grotesk: rounded but more grown-up than Fredoka.
 *  - 'fredoka' — the previous look: Fredoka on every Text, all weights.
 *  - 'system'  — no custom font anywhere (full BeReal).
 */
export type DisplayFont = 'baloo' | 'fredoka' | 'system';
export const DISPLAY: DisplayFont = 'baloo';

/** Min fontWeight that counts as "display" text in the mix ('baloo' mode). */
const DISPLAY_MIN_WEIGHT = 700;

export const BALOO = {
  bold: 'Baloo2_700Bold',
  extrabold: 'Baloo2_800ExtraBold',
};

export const FREDOKA = {
  light: 'Fredoka_300Light',
  regular: 'Fredoka_400Regular',
  medium: 'Fredoka_500Medium',
  semibold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
};

function weightNum(weight: unknown): number {
  const w = String(weight ?? '400');
  if (w === 'bold') return 700;
  const n = parseInt(w, 10);
  return Number.isNaN(n) ? 400 : n;
}

/** The family to inject for a given fontWeight — undefined = leave on system. */
export function familyForWeight(weight: unknown): string | undefined {
  const n = weightNum(weight);
  if (DISPLAY === 'baloo') {
    if (n < DISPLAY_MIN_WEIGHT) return undefined; // body/captions -> system
    return n >= 800 ? BALOO.extrabold : BALOO.bold;
  }
  if (DISPLAY === 'fredoka') {
    if (n >= 700) return FREDOKA.bold;
    if (n === 600) return FREDOKA.semibold;
    if (n === 500) return FREDOKA.medium;
    if (n <= 300) return FREDOKA.light;
    return FREDOKA.regular;
  }
  return undefined; // 'system'
}

/**
 * Apply the display font globally by injecting a weight-matched fontFamily
 * into every <Text> whose style doesn't already specify one. Monkeypatches the
 * Text forwardRef render; if that shape ever changes it no-ops (text just
 * falls back to the system font — no crash).
 */
export function installAppFonts(): void {
  const T = RNText as any;
  if (T.__fontsPatched) return;
  const orig = T.render;
  if (typeof orig !== 'function') return;
  T.render = function (...args: any[]) {
    const props = args[0];
    const flat = (StyleSheet.flatten(props?.style) as any) || {};
    if (!flat.fontFamily) {
      const family = familyForWeight(flat.fontWeight);
      if (family) {
        args[0] = { ...props, style: [props?.style, { fontFamily: family }] };
      }
    }
    return orig.apply(this, args);
  };
  T.__fontsPatched = true;
}
