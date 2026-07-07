import React, { useLayoutEffect } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../navigation/types';
import { useFriends } from '../state/FriendsContext';
import { Avatar } from '../components/Avatar';
import { Pill } from '../components/Pill';
import { SectionCard } from '../components/SectionCard';
import { colors, radius, shadow, spacing } from '../lib/theme';
import {
  countdownLabel,
  currentAge,
  daysUntilBirthday,
  formatMonthDay,
  nextBirthday,
  ordinal,
  turningAge,
} from '../lib/dates';
import { closenessMeta, VAULT_FIELDS } from '../lib/constants';
import {
  appendInteraction,
  computeScore,
  daysSinceLastTouch,
  INTERACTION_TYPES,
  scoreStatus,
} from '../lib/score';
import { Friend, InteractionType } from '../types';

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0];
}

/** Hex -> rgba with given alpha (soft tinted backgrounds). */
function tint(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lastTouchLabel(days: number): string {
  if (days === 0) return 'You connected today';
  if (days === 1) return 'Last connected yesterday';
  if (days < 30) return `Last connected ${days} days ago`;
  if (days < 60) return 'Last connected over a month ago';
  const months = Math.round(days / 30);
  return `Last connected ~${months} months ago`;
}

function templatesFor(friend: Friend): { tone: string; text: string }[] {
  const f = firstName(friend.name);
  const age = turningAge(friend);
  const ageLine = age != null ? ` Happy ${ordinal(age)}!` : '';
  return [
    {
      tone: 'Warm',
      text: `Happy birthday, ${f}! Hope your day is full of all your favourite things.${ageLine} Let's celebrate soon!`,
    },
    {
      tone: 'Heartfelt',
      text: `Happy birthday, ${f}! So grateful to have you in my life. Wishing you a year full of joy and good surprises.`,
    },
    {
      tone: 'Casual',
      text: `Happy bday ${f}! Have an amazing one — drinks on me soon!`,
    },
    {
      tone: 'Funny',
      text: `Happy birthday ${f}! You're not getting older, just leveling up. Legendary status confirmed.`,
    },
  ];
}

export function FriendProfileScreen({
  route,
  navigation,
}: RootStackScreenProps<'FriendProfile'>) {
  const { id } = route.params;
  const { getFriend, deleteFriend, updateFriend, settings } = useFriends();
  const friend = getFriend(id);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: friend ? firstName(friend.name) : 'Friend',
      headerRight: () =>
        friend ? (
          <Pressable
            onPress={() => navigation.navigate('AddEditFriend', { id: friend.id })}
            hitSlop={8}
          >
            <Text style={styles.headerBtn}>Edit</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, friend]);

  if (!friend) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>This friend no longer exists.</Text>
      </SafeAreaView>
    );
  }

  const days = daysUntilBirthday(friend);
  const meta = closenessMeta(friend.closeness);
  const age = currentAge(friend);
  const turning = turningAge(friend);
  const next = nextBirthday(friend);
  const score = computeScore(friend);
  const status = scoreStatus(score);
  const sinceLast = daysSinceLastTouch(friend);
  const vault = friend.vault ?? {};
  const filledVault = VAULT_FIELDS.filter((vf) => vault[vf.key]);

  const logConnection = (type: InteractionType) => {
    updateFriend(friend.id, { interactions: appendInteraction(friend, type) });
  };

  const onShareMessage = async (text: string) => {
    try {
      const result = await Share.share({ message: text });
      // Sharing a birthday message counts as reaching out.
      if (result.action === Share.sharedAction) logConnection('message');
    } catch {
      /* user dismissed */
    }
  };

  const onText = () => {
    const templates = templatesFor(friend);
    onShareMessage(templates[0].text);
  };

  const onCall = async () => {
    // No phone stored in the prototype — contact import arrives in a later phase.
    Alert.alert(
      'Call ' + firstName(friend.name),
      'Phone numbers come with contact import (a later phase). For now, open your dialer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open dialer',
          onPress: () => {
            logConnection('call');
            Linking.openURL('tel:').catch(() => {});
          },
        },
      ]
    );
  };

  const onGift = () => {
    if (settings.premium) {
      Alert.alert(
        'AI gift ideas',
        `Based on ${firstName(friend.name)}'s notes, here are a few:\n\n• A thoughtful experience they'd love\n• Something tied to their hobbies\n• A personalised keepsake\n\n(Wire up the Claude API to make these specific.)`
      );
    } else {
      Alert.alert('Gift ideas', 'AI gift suggestions are a Premium feature. You can still jot ideas below!');
    }
  };

  const onPlan = () => {
    Alert.alert('Plan something', `What would you like to plan for ${firstName(friend.name)}?`, [
      { text: 'Dinner' },
      { text: 'A call' },
      { text: 'Surprise' },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  const addGiftIdea = () => {
    Alert.prompt?.('Add gift idea', undefined, (text) => {
      if (text && text.trim()) {
        updateFriend(friend.id, { giftIdeas: [...friend.giftIdeas, text.trim()] });
      }
    });
  };

  const removeGiftIdea = (idx: number) => {
    updateFriend(friend.id, {
      giftIdeas: friend.giftIdeas.filter((_, i) => i !== idx),
    });
  };

  const logThisYear = () => {
    const year = new Date().getFullYear();
    Alert.prompt?.(
      `What did you do in ${year}?`,
      'e.g. "Sent flowers and a card"',
      (text) => {
        if (text && text.trim()) {
          const others = friend.pastNotes.filter((p) => p.year !== year);
          updateFriend(friend.id, {
            pastNotes: [{ year, note: text.trim() }, ...others],
          });
        }
      }
    );
  };

  const onDelete = () => {
    Alert.alert('Delete friend', `Remove ${friend.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteFriend(friend.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Avatar
            name={friend.name}
            photoUri={friend.photoUri}
            size={96}
            ringColor={days === 0 ? colors.primary : undefined}
          />
          <Text style={styles.name}>{friend.name}</Text>
          <Pill label={meta.label} color={meta.color} />
          <View style={styles.countdownPill}>
            <Ionicons name="gift" size={16} color={colors.primary} />
            <Text style={styles.countdownText}>
              {days === 0 ? 'Birthday today!' : countdownLabel(days)}
            </Text>
          </View>
          <Text style={styles.bday}>
            {formatMonthDay(friend.birthMonth, friend.birthDay)}
            {friend.birthYear ? `, ${friend.birthYear}` : ''}
            {age != null ? ` · currently ${age}` : ''}
            {turning != null ? ` · turning ${turning}` : ''}
          </Text>
        </View>

        {/* Friendship score */}
        <View style={[styles.scoreCard, { borderColor: tint(meta.color, 0.5) }]}>
          <View style={styles.scoreTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scoreLabel}>Friendship score</Text>
              <Text style={[styles.scoreStatus, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
            <Text style={[styles.scoreNumber, { color: status.color }]}>{score}</Text>
          </View>
          <View style={styles.scoreTrack}>
            <View
              style={[styles.scoreFill, { width: `${score}%`, backgroundColor: status.color }]}
            />
          </View>
          <Text style={styles.scoreSub}>{lastTouchLabel(sinceLast)}</Text>

          <Text style={styles.logLabel}>Log a connection</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.logRow}
          >
            {INTERACTION_TYPES.map((it) => (
              <Pressable
                key={it.type}
                onPress={() => logConnection(it.type)}
                style={({ pressed }) => [styles.logBtn, pressed && { opacity: 0.6 }]}
              >
                <View style={[styles.logIcon, { backgroundColor: tint(it.color, 0.14) }]}>
                  <Ionicons name={it.icon} size={20} color={it.color} />
                </View>
                <Text style={styles.logBtnText}>{it.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Action prompts */}
        <Text style={styles.prompt}>What do you want to do?</Text>
        <View style={styles.actions}>
          <ActionButton icon="call" label="Call" color={colors.green} onPress={onCall} />
          <ActionButton icon="chatbubble" label="Text" color={colors.blue} onPress={onText} />
          <ActionButton icon="gift" label="Gift" color={colors.primary} onPress={onGift} />
          <ActionButton icon="sparkles" label="Plan" color={colors.purple} onPress={onPlan} />
        </View>

        {/* Message templates */}
        <SectionCard title="Message templates" footer="Tap to personalise & send via the share sheet.">
          {templatesFor(friend).map((t, i) => (
            <Pressable
              key={i}
              onPress={() => onShareMessage(t.text)}
              style={({ pressed }) => [styles.template, pressed && { opacity: 0.6 }]}
            >
              <View style={styles.templateHead}>
                <Pill label={t.tone} color={colors.indigo} small />
                <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
              </View>
              <Text style={styles.templateText}>{t.text}</Text>
            </Pressable>
          ))}
        </SectionCard>

        {/* Gift ideas */}
        <SectionCard title="Gift ideas">
          {friend.giftIdeas.length === 0 ? (
            <Text style={styles.empty}>No ideas yet — add one below.</Text>
          ) : (
            friend.giftIdeas.map((g, i) => (
              <View key={i} style={styles.giftRow}>
                <Ionicons name="gift-outline" size={18} color={colors.primary} />
                <Text style={styles.giftText}>{g}</Text>
                <Pressable onPress={() => removeGiftIdea(i)} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </Pressable>
              </View>
            ))
          )}
          <Pressable onPress={addGiftIdea} style={styles.addRow}>
            <Ionicons name="add-circle" size={20} color={colors.primary} />
            <Text style={styles.addText}>Add gift idea</Text>
          </Pressable>
        </SectionCard>

        {/* Memory Vault */}
        <SectionCard title="Memory Vault" footer="The little things — tap Edit to add more.">
          {filledVault.length === 0 ? (
            <Text style={styles.empty}>
              Nothing saved yet — add their favourites, allergies and dream gift via Edit.
            </Text>
          ) : (
            filledVault.map((vf) => (
              <View key={vf.key} style={styles.vaultRow}>
                <Ionicons name={vf.icon} size={18} color={colors.purple} />
                <Text style={styles.vaultLabel}>{vf.label}</Text>
                <Text style={styles.vaultValue}>{vault[vf.key]}</Text>
              </View>
            ))
          )}
        </SectionCard>

        {/* Notes */}
        {friend.notes ? (
          <SectionCard title="Notes & preferences">
            <Text style={styles.notes}>{friend.notes}</Text>
          </SectionCard>
        ) : null}

        {/* Past birthdays */}
        <SectionCard title="Birthday history">
          {friend.pastNotes.length === 0 ? (
            <Text style={styles.empty}>No history logged yet.</Text>
          ) : (
            friend.pastNotes
              .slice()
              .sort((a, b) => b.year - a.year)
              .map((p) => (
                <View key={p.year} style={styles.pastRow}>
                  <Text style={styles.pastYear}>{p.year}</Text>
                  <Text style={styles.pastNote}>{p.note}</Text>
                </View>
              ))
          )}
          <Pressable onPress={logThisYear} style={styles.addRow}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={styles.addText}>Log what you did this year</Text>
          </Pressable>
        </SectionCard>

        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={styles.deleteText}>Delete friend</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}>
      <View style={[styles.actionIcon, { backgroundColor: tint(color, 0.16) }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  missing: { padding: spacing.xl, color: colors.textSecondary, fontSize: 16 },
  headerBtn: { color: colors.primary, fontSize: 17, fontWeight: '600' },
  hero: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.sm },
  name: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  countdownText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  bday: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  scoreCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadow.card,
  },
  scoreTop: { flexDirection: 'row', alignItems: 'center' },
  scoreLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.3 },
  scoreStatus: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  scoreNumber: { fontSize: 40, fontWeight: '800' },
  scoreTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.separator,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  scoreFill: { height: '100%', borderRadius: radius.pill },
  scoreSub: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm },
  logLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  logRow: { gap: spacing.md, paddingVertical: 2, paddingRight: spacing.sm },
  logBtn: { alignItems: 'center', gap: 5, width: 56 },
  logIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  vaultLabel: { fontSize: 14, color: colors.textSecondary, width: 104 },
  vaultValue: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500', textAlign: 'right' },
  prompt: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
  action: { alignItems: 'center', flex: 1, gap: 6 },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  actionLabel: { fontSize: 13, color: colors.text, fontWeight: '600' },
  template: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  templateHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  templateText: { fontSize: 15, color: colors.text, lineHeight: 21 },
  empty: { color: colors.textSecondary, fontSize: 15, marginBottom: spacing.sm },
  giftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  giftText: { flex: 1, fontSize: 16, color: colors.text },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md },
  addText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  notes: { fontSize: 15, color: colors.text, lineHeight: 22 },
  pastRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm },
  pastYear: { fontSize: 15, fontWeight: '700', color: colors.primary, width: 48 },
  pastNote: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 21 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  deleteText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
});
