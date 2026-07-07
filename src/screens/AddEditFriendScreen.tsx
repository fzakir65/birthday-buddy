import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootStackScreenProps } from '../navigation/types';
import { useFriends } from '../state/FriendsContext';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { colors, radius, spacing } from '../lib/theme';
import {
  CLOSENESS,
  FREE_FRIEND_LIMIT,
  MONTHS_SHORT,
  REMINDER_OPTIONS,
  VAULT_FIELDS,
} from '../lib/constants';
import { Closeness, MemoryVault } from '../types';

function maxDayFor(month: number, year: number | null): number {
  return new Date(year ?? 2024, month, 0).getDate();
}

export function AddEditFriendScreen({
  route,
  navigation,
}: RootStackScreenProps<'AddEditFriend'>) {
  const editingId = route.params?.id;
  const { getFriend, addFriend, updateFriend, friends, settings } = useFriends();
  const existing = editingId ? getFriend(editingId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(existing?.photoUri ?? null);
  const [month, setMonth] = useState(existing?.birthMonth ?? new Date().getMonth() + 1);
  const [day, setDay] = useState(existing?.birthDay ?? new Date().getDate());
  const [yearText, setYearText] = useState(
    existing?.birthYear ? String(existing.birthYear) : ''
  );
  const [closeness, setCloseness] = useState<Closeness>(existing?.closeness ?? 'friend');
  const [vault, setVault] = useState<MemoryVault>(existing?.vault ?? {});
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [giftText, setGiftText] = useState((existing?.giftIdeas ?? []).join('\n'));
  const [useDefaultReminders, setUseDefaultReminders] = useState(
    existing ? existing.reminderDays.length === 0 : true
  );
  const [reminderDays, setReminderDays] = useState<number[]>(
    existing && existing.reminderDays.length > 0
      ? existing.reminderDays
      : settings.defaultReminderDays
  );

  const yearNum = yearText.trim() ? parseInt(yearText.trim(), 10) : null;
  const maxDay = maxDayFor(month, yearNum);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const setMonthSafe = (m: number) => {
    setMonth(m);
    const max = maxDayFor(m, yearNum);
    if (day > max) setDay(max);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add a picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const toggleReminder = (d: number) => {
    setReminderDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => b - a)
    );
  };

  const setVaultField = (key: keyof MemoryVault, value: string) => {
    setVault((prev) => ({ ...prev, [key]: value }));
  };

  /** Drop blank entries so we never store empty strings. */
  const cleanVault = (): MemoryVault => {
    const out: MemoryVault = {};
    for (const f of VAULT_FIELDS) {
      const v = vault[f.key]?.trim();
      if (v) out[f.key] = v;
    }
    return out;
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter your friend’s name.');
      return;
    }
    if (yearText.trim() && (Number.isNaN(yearNum!) || yearNum! < 1900 || yearNum! > new Date().getFullYear())) {
      Alert.alert('Check the year', 'Enter a valid birth year, or leave it blank.');
      return;
    }
    if (!existing && !settings.premium && friends.length >= FREE_FRIEND_LIMIT) {
      Alert.alert(
        'Free plan limit',
        `The free plan holds ${FREE_FRIEND_LIMIT} friends. Upgrade to Premium for unlimited.`
      );
      return;
    }

    const giftIdeas = giftText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: trimmed,
      birthMonth: month,
      birthDay: day,
      birthYear: yearNum,
      photoUri,
      closeness,
      vault: cleanVault(),
      giftIdeas,
      notes: notes.trim(),
      reminderDays: useDefaultReminders ? [] : reminderDays,
    };

    if (existing) {
      updateFriend(existing.id, payload);
    } else {
      addFriend({ ...payload, pastNotes: [], interactions: [] });
    }
    navigation.goBack();
  };

  // Keep a fresh save handler behind a stable header button.
  const saveRef = useRef(handleSave);
  saveRef.current = handleSave;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: existing ? 'Edit friend' : 'New friend',
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={() => saveRef.current()} hitSlop={8}>
          <Text style={styles.headerSave}>Save</Text>
        </Pressable>
      ),
    });
  }, [navigation, existing]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo */}
          <View style={styles.photoWrap}>
            <Pressable onPress={pickPhoto}>
              <Avatar name={name || '?'} photoUri={photoUri} size={96} />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            </Pressable>
            {photoUri ? (
              <Pressable onPress={() => setPhotoUri(null)}>
                <Text style={styles.removePhoto}>Remove photo</Text>
              </Pressable>
            ) : (
              <Text style={styles.addPhoto}>Add a photo</Text>
            )}
          </View>

          {/* Name */}
          <Field label="Name">
            <TextInput
              style={styles.input}
              placeholder="e.g. Aisha Khan"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </Field>

          {/* Birthday */}
          <Field label="Birthday">
            <Text style={styles.subLabel}>Month</Text>
            <View style={styles.chipWrap}>
              {MONTHS_SHORT.map((m, i) => {
                const on = month === i + 1;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMonthSafe(i + 1)}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{m}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.subLabel}>Day</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayRow}
            >
              {days.map((d) => {
                const on = day === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setDay(d)}
                    style={[styles.dayChip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{d}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.subLabel}>Year (optional — enables age)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1996"
              placeholderTextColor={colors.textTertiary}
              value={yearText}
              onChangeText={(t) => setYearText(t.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
            />
          </Field>

          {/* Vibe (relationship tag) */}
          <Field label="Vibe">
            <View style={styles.chipWrap}>
              {CLOSENESS.map((c) => {
                const on = closeness === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setCloseness(c.key)}
                    style={[
                      styles.chip,
                      on && { backgroundColor: c.color },
                    ]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          {/* Gift ideas */}
          <Field label="Gift ideas">
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder={'One per line\ne.g. Pottery class\nFavourite book'}
              placeholderTextColor={colors.textTertiary}
              value={giftText}
              onChangeText={setGiftText}
              multiline
            />
          </Field>

          {/* Notes */}
          <Field label="Notes (preferences, allergies)">
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="e.g. Allergic to nuts. Loves matcha."
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </Field>

          {/* Memory Vault */}
          <Field label="Memory Vault">
            <Text style={styles.vaultHint}>
              The little things — fill in what you know, leave the rest blank.
            </Text>
            {VAULT_FIELDS.map((vf) => (
              <View key={vf.key} style={styles.vaultRow}>
                <Ionicons name={vf.icon} size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.vaultInput}
                  placeholder={`${vf.label} — ${vf.placeholder}`}
                  placeholderTextColor={colors.textTertiary}
                  value={vault[vf.key] ?? ''}
                  onChangeText={(t) => setVaultField(vf.key, t)}
                />
              </View>
            ))}
          </Field>

          {/* Reminders */}
          <Field label="Reminders">
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Use default schedule</Text>
              <Switch
                value={useDefaultReminders}
                onValueChange={setUseDefaultReminders}
                trackColor={{ true: colors.primary }}
              />
            </View>
            {!useDefaultReminders && (
              <View style={styles.chipWrap}>
                {REMINDER_OPTIONS.map((opt) => {
                  const on = reminderDays.includes(opt.days);
                  return (
                    <Pressable
                      key={opt.days}
                      onPress={() => toggleReminder(opt.days)}
                      style={[styles.chip, on && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Field>

          <Button
            title={existing ? 'Save changes' : 'Add friend'}
            icon="checkmark"
            onPress={handleSave}
            style={{ marginTop: spacing.sm }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  headerCancel: { color: colors.textSecondary, fontSize: 17 },
  headerSave: { color: colors.primary, fontSize: 17, fontWeight: '700' },
  photoWrap: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  addPhoto: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  removePhoto: { color: colors.danger, fontWeight: '500', fontSize: 14 },
  field: { marginBottom: spacing.xl },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm, letterSpacing: 0.3 },
  subLabel: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  vaultHint: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  vaultInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 11,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  chipOn: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  dayRow: { gap: spacing.sm, paddingVertical: 2 },
  dayChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  switchLabel: { fontSize: 16, color: colors.text },
});
