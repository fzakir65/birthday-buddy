// iOS-flavoured design tokens (system colours, spacing, radii, shadows).

export const colors = {
  // Backgrounds — true-black base with subtly elevated dark cards (Snapchat/Yubo feel)
  bg: '#000000',
  card: '#1C1C1E',
  elevated: '#2C2C2E',

  // Brand — bold red on black
  primary: '#FF3B30',
  primarySoft: '#3A1A18', // dark red tint for soft fills/pills

  // On-tone accent family (black / red / yellow)
  red: '#FF3B30',
  coral: '#FF5C4D',
  orange: '#FF7A1A',
  amber: '#FFB340',
  gold: '#E0A82E',

  // Legacy accent names remapped onto the red/yellow tone so existing
  // screens stay on-palette without per-screen edits.
  blue: '#E0A82E',
  green: '#FFD60A',
  yellow: '#FFD60A',
  purple: '#FF9F0A',
  teal: '#E0A82E',
  indigo: '#FFB340',
  pink: '#FF453A',

  // Text — light on dark
  text: '#FFFFFF',
  textSecondary: '#9A9AA0',
  textTertiary: '#5A5A60',

  // Lines
  separator: '#2A2A2C',
  separatorStrong: '#3A3A3C',

  // Memories / Calendar surfaces
  sheet: '#0E0E10',
  cardInner: '#26262A',
  emptyTile: '#141416',
  emptyTileBorder: '#222226',
  chipIdle: '#2C2C2E',
  tabActivePill: '#2E2E32',
  segmentActive: '#3A3A3E',
  todayRing: '#4A4A50',
  noteBody: '#C9C9CE',
  disabledFuture: '#3F3F46',

  white: '#FFFFFF',
  black: '#000000',
  danger: '#FF453A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const fontSize = {
  caption: 12,
  footnote: 13,
  subhead: 15,
  body: 17,
  headline: 17,
  title3: 20,
  title2: 22,
  title1: 28,
  large: 34,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};

/** Deterministic on-tone colour from a string (for initials avatars).
 *  Dark reds/ambers/browns + neutrals so white initials stay legible. */
const AVATAR_COLORS = [
  '#C0392B',
  '#E0392E',
  '#B45309',
  '#A16207',
  '#854D0E',
  '#7C2D12',
  '#9A3412',
  '#B91C1C',
  '#52525B',
  '#3F3F46',
];

export function colorFromString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
