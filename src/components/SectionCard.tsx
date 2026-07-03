import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../lib/theme';
import { Gloss } from './Gloss';

interface Props {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

/** A grouped iOS-style card with an optional uppercase section header. */
export function SectionCard({ title, footer, children, style, noPadding }: Props) {
  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.header}>{title.toUpperCase()}</Text> : null}
      <View style={[styles.card, noPadding && styles.noPad, style]}>
        <Gloss radius={radius.lg} />
        {children}
      </View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

/** A thin separator to place between rows inside a SectionCard. */
export function RowDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
  },
  header: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    ...shadow.card,
  },
  noPad: {
    padding: 0,
  },
  footer: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginVertical: spacing.sm,
  },
});
