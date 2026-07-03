import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TabScreenProps } from '../navigation/types';
import { useFriends } from '../state/FriendsContext';
import { SectionCard, RowDivider } from '../components/SectionCard';
import { colors, radius, spacing } from '../lib/theme';
import { REMINDER_OPTIONS } from '../lib/constants';
import { NotificationStyle } from '../types';
import { sendTestNotification } from '../lib/notifications';

function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${period}`;
}

const STYLES: { key: NotificationStyle; label: string; premium: boolean }[] = [
  { key: 'push', label: 'Push', premium: false },
  { key: 'sms', label: 'SMS', premium: true },
  { key: 'email', label: 'Email', premium: true },
];

export function SettingsScreen({ navigation }: TabScreenProps<'Profile'>) {
  const {
    settings,
    updateSettings,
    notifPermission,
    enableNotifications,
    scheduledCount,
    refreshScheduledCount,
    resetDemoData,
    friends,
    memories,
  } = useFriends();

  const toggleReminderDay = (days: number) => {
    const has = settings.defaultReminderDays.includes(days);
    const next = has
      ? settings.defaultReminderDays.filter((d) => d !== days)
      : [...settings.defaultReminderDays, days].sort((a, b) => b - a);
    updateSettings({ defaultReminderDays: next });
  };

  const changeHour = (delta: number) => {
    const h = (settings.notificationHour + delta + 24) % 24;
    updateSettings({ notificationHour: h });
  };

  const pickStyle = (s: NotificationStyle, premium: boolean) => {
    if (premium && !settings.premium) {
      Alert.alert('Premium feature', `${s.toUpperCase()} reminders are part of Premium.`);
      return;
    }
    updateSettings({ notificationStyle: s });
  };

  const onEnableNotifs = async () => {
    const granted = await enableNotifications();
    if (!granted) {
      Alert.alert(
        'Notifications off',
        'Enable notifications for Birthday Buddy in iOS Settings to get reminders.'
      );
    }
  };

  const onTest = async () => {
    if (!notifPermission) {
      const granted = await enableNotifications();
      if (!granted) {
        Alert.alert('Allow notifications first to see a test.');
        return;
      }
    }
    await sendTestNotification();
    await refreshScheduledCount();
    Alert.alert('Test sent', 'A sample reminder will appear in ~5 seconds.');
  };

  const togglePremium = () => {
    if (settings.premium) {
      updateSettings({ premium: false });
      return;
    }
    Alert.alert(
      'Birthday Buddy Premium',
      'Unlimited friends, AI messages & gift ideas, SMS reminders, and full history — $2.99/mo.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Unlock (demo)', onPress: () => updateSettings({ premium: true }) },
      ]
    );
  };

  const comingSoon = (what: string) =>
    Alert.alert(what, 'Planned for a later phase. This is a prototype build.');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        {/* User header card */}
        <View style={styles.userCard}>
          <LinearGradient colors={['#B45309', '#854D0E']} style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>ME</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>You</Text>
            <Text style={styles.userSub}>
              {friends.length} {friends.length === 1 ? 'friend' : 'friends'} · {memories.length}{' '}
              {memories.length === 1 ? 'memory' : 'memories'}
            </Text>
          </View>
        </View>

        {/* Premium */}
        <Pressable onPress={togglePremium} style={styles.premiumCard}>
          <Ionicons name="star" size={26} color={colors.black} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.premiumTitle}>
              {settings.premium ? 'Premium active' : 'Birthday Buddy Premium'}
            </Text>
            <Text style={styles.premiumSub}>
              {settings.premium
                ? 'Thanks! Tap to turn off (demo).'
                : 'Unlimited friends · AI messages · SMS · $2.99/mo'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.6)" />
        </Pressable>

        {/* Default reminder schedule */}
        <SectionCard
          title="Default reminders"
          footer="Applied to friends without a custom schedule. Tap to toggle."
        >
          <View style={styles.chipWrap}>
            {REMINDER_OPTIONS.map((opt) => {
              const on = settings.defaultReminderDays.includes(opt.days);
              return (
                <Pressable
                  key={opt.days}
                  onPress={() => toggleReminderDay(opt.days)}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {/* Notification time + quiet hours */}
        <SectionCard title="Timing">
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Reminder time</Text>
            <View style={styles.stepper}>
              <Pressable onPress={() => changeHour(-1)} hitSlop={8} style={styles.stepBtn}>
                <Ionicons name="remove" size={18} color={colors.primary} />
              </Pressable>
              <Text style={styles.stepValue}>{formatHour(settings.notificationHour)}</Text>
              <Pressable onPress={() => changeHour(1)} hitSlop={8} style={styles.stepBtn}>
                <Ionicons name="add" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </View>
          <RowDivider />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Quiet hours</Text>
            <Text style={styles.rowValue}>
              {formatHour(settings.quietHoursStart)} – {formatHour(settings.quietHoursEnd)}
            </Text>
          </View>
        </SectionCard>

        {/* Notification style */}
        <SectionCard title="Notification style">
          <View style={styles.chipWrap}>
            {STYLES.map((s) => {
              const on = settings.notificationStyle === s.key;
              const locked = s.premium && !settings.premium;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => pickStyle(s.key, s.premium)}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>
                    {s.label}
                    {locked ? '  🔒' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {/* Notifications status */}
        <SectionCard title="Notifications">
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Permission</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: notifPermission ? colors.green : colors.orange },
                ]}
              />
              <Text style={styles.rowValue}>{notifPermission ? 'Granted' : 'Off'}</Text>
            </View>
          </View>
          {!notifPermission && (
            <>
              <RowDivider />
              <Pressable onPress={onEnableNotifs} style={styles.linkRow}>
                <Text style={styles.link}>Enable notifications</Text>
              </Pressable>
            </>
          )}
          <RowDivider />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Scheduled reminders</Text>
            <Text style={styles.rowValue}>{scheduledCount}</Text>
          </View>
          <RowDivider />
          <Pressable onPress={onTest} style={styles.linkRow}>
            <Ionicons name="notifications-outline" size={18} color={colors.primary} />
            <Text style={styles.link}>Send a test notification</Text>
          </Pressable>
        </SectionCard>

        {/* Integrations (phased) */}
        <SectionCard title="Connect" footer="Coming in a later phase.">
          <IntegrationRow icon="people-outline" label="Import phone contacts" onPress={() => comingSoon('Import contacts')} />
          <RowDivider />
          <IntegrationRow icon="logo-facebook" label="Connect Facebook" onPress={() => comingSoon('Connect Facebook')} />
          <RowDivider />
          <IntegrationRow icon="logo-instagram" label="Connect Instagram" onPress={() => comingSoon('Connect Instagram')} />
          <RowDivider />
          <IntegrationRow icon="cloud-upload-outline" label="Backup & sync" onPress={() => comingSoon('Backup & sync')} />
        </SectionCard>

        {/* Data */}
        <SectionCard title="Data">
          <Pressable
            onPress={() =>
              Alert.alert('Reset demo data', 'Restore the sample friends and default settings?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: () => resetDemoData() },
              ])
            }
            style={styles.linkRow}
          >
            <Ionicons name="refresh" size={18} color={colors.danger} />
            <Text style={[styles.link, { color: colors.danger }]}>Reset demo data</Text>
          </Pressable>
        </SectionCard>

        <Text style={styles.version}>Birthday Buddy · Prototype v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function IntegrationRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.intRow}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <Text style={styles.intLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 124 },
  title: { fontSize: 34, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: spacing.xl,
  },
  userAvatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 18, fontWeight: '800', color: colors.white },
  userName: { fontSize: 18, fontWeight: '700', color: colors.text },
  userSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  premiumTitle: { color: colors.black, fontSize: 17, fontWeight: '700' },
  premiumSub: { color: 'rgba(0,0,0,0.7)', fontSize: 13, marginTop: 2 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.elevated,
  },
  chipOn: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  rowLabel: { fontSize: 16, color: colors.text },
  rowValue: { fontSize: 16, color: colors.textSecondary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontSize: 16, fontWeight: '600', color: colors.text, minWidth: 76, textAlign: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 },
  link: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  intRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 4 },
  intLabel: { flex: 1, fontSize: 16, color: colors.text },
  version: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: spacing.sm,
  },
});
