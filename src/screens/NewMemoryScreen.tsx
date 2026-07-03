import React, { useLayoutEffect, useRef, useState } from 'react';
import {
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
import { MemoryImage } from '../components/MemoryImage';
import { colors, radius, spacing } from '../lib/theme';
import { GRADS, MEMOJI, firstName, formatMemoryDate } from '../lib/memories';

export function NewMemoryScreen({ route, navigation }: RootStackScreenProps<'NewMemory'>) {
  const today = new Date();
  const y = route.params?.y ?? today.getFullYear();
  const m = route.params?.m ?? today.getMonth() + 1;
  const d = route.params?.d ?? today.getDate();

  const { friends, addMemory } = useFriends();

  const [gradIndex, setGradIndex] = useState(0);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [emoji, setEmoji] = useState('📸');
  const [tagline, setTagline] = useState('');
  const [note, setNote] = useState('');
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [core, setCore] = useState(false);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const toggleFriend = (id: string) =>
    setFriendIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = () => {
    addMemory({
      y,
      m,
      d,
      gradIndex,
      photoUri,
      emoji,
      tagline: tagline.trim() || 'untitled moment',
      note: note.trim(),
      friendIds,
      core,
      reactions: {},
    });
    // Land on the Memories tab so the new moment is visible.
    navigation.navigate('Tabs', { screen: 'Memories' } as never);
  };

  const saveRef = useRef(save);
  saveRef.current = save;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.grabber} />
      <View style={styles.head}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.headTitle}>New memory</Text>
        <Pressable onPress={() => saveRef.current()} hitSlop={8}>
          <Text style={styles.save}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.dateLabel}>{formatMemoryDate({ y, m, d })}</Text>

          {/* Preview / photo picker */}
          <Pressable onPress={pickPhoto}>
            <MemoryImage
              gradIndex={gradIndex}
              photoUri={photoUri}
              emoji={photoUri ? undefined : emoji}
              emojiSize={54}
              radius={20}
              style={styles.preview}
            >
              {!photoUri && (
                <Text style={styles.previewHint}>photo goes here — camera later</Text>
              )}
            </MemoryImage>
          </Pressable>

          {/* Gradient swatches */}
          <View style={styles.swatchRow}>
            {GRADS.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => { setGradIndex(i); setPhotoUri(null); }}
                style={[styles.swatch, { borderColor: i === gradIndex ? colors.white : 'transparent' }]}
              >
                <MemoryImage gradIndex={i} radius={10} style={{ flex: 1 }} />
              </Pressable>
            ))}
          </View>

          {/* Emoji picker */}
          <View style={styles.emojiWrap}>
            {MEMOJI.map((e) => {
              const on = e === emoji;
              return (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={[styles.emojiBtn, { backgroundColor: on ? colors.primarySoft : colors.card, borderColor: on ? colors.primary : 'transparent' }]}
                >
                  <Text style={{ fontSize: 20 }}>{e}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>TAGLINE</Text>
          <TextInput
            style={styles.input}
            placeholder="main character moment was…"
            placeholderTextColor={colors.textTertiary}
            value={tagline}
            onChangeText={setTagline}
          />

          <Text style={styles.label}>NOTE</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="what happened? spill 👀"
            placeholderTextColor={colors.textTertiary}
            value={note}
            onChangeText={setNote}
            multiline
          />

          <Text style={styles.label}>WHO WAS THERE</Text>
          <View style={styles.chipWrap}>
            {friends.map((f) => {
              const on = friendIds.includes(f.id);
              return (
                <Pressable
                  key={f.id}
                  onPress={() => toggleFriend(f.id)}
                  style={[styles.friendChip, { backgroundColor: on ? colors.primary : colors.card }]}
                >
                  <Text style={[styles.friendChipText, { color: on ? colors.white : colors.textSecondary }]}>
                    {firstName(f.name)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.coreRow}>
            <Text style={styles.coreLabel}>✨ Mark as core memory</Text>
            <Switch value={core} onValueChange={setCore} trackColor={{ true: colors.primary }} />
          </View>

          <Pressable style={styles.cta} onPress={save}>
            <Text style={styles.ctaText}>Save memory</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sheet },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.chipIdle, marginTop: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  cancel: { fontSize: 17, color: colors.textSecondary },
  headTitle: { fontSize: 17, fontWeight: '700', color: colors.white },
  save: { fontSize: 17, fontWeight: '700', color: colors.primary },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2 },
  dateLabel: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  preview: { height: 190, alignItems: 'center', justifyContent: 'center' },
  previewHint: { position: 'absolute', bottom: 12, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: 'rgba(255,255,255,0.6)' },
  swatchRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  swatch: { flex: 1, height: 42, borderRadius: 12, borderWidth: 2, overflow: 'hidden' },
  emojiWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  emojiBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.5, marginTop: spacing.xl, marginBottom: spacing.sm },
  input: { backgroundColor: colors.card, borderRadius: 12, padding: 12, fontSize: 16, color: colors.white },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  friendChip: { borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 14 },
  friendChipText: { fontSize: 14, fontWeight: '600' },
  coreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl },
  coreLabel: { fontSize: 16, color: colors.white },
  cta: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: spacing.xl },
  ctaText: { fontSize: 17, fontWeight: '700', color: colors.white },
});
