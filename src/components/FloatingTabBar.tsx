import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, radius } from '../lib/theme';
import { Gloss } from './Gloss';
import { useFriends } from '../state/FriendsContext';
import type { TabParamList } from '../navigation/types';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Friends: 'people',
  Memories: 'apps',
};

/** Floating pill tab bar with a center camera button (opens New Memory for today). */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { memoriesSeen } = useFriends();

  const go = (routeName: keyof TabParamList, index: number) => {
    const focused = state.index === index;
    const event = navigation.emit({ type: 'tabPress', target: state.routes[index].key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(routeName as never);
  };

  const openCamera = () => {
    const t = new Date();
    (navigation.navigate as any)('NewMemory', { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() });
  };

  const item = (index: number) => {
    const route = state.routes[index];
    const name = route.name as keyof TabParamList;
    const focused = state.index === index;
    const isProfile = name === 'Profile';
    const isMemories = name === 'Memories';
    return (
      <Pressable key={route.key} style={styles.itemWrap} onPress={() => go(name, index)} hitSlop={6}>
        <View style={[styles.item, focused && styles.itemActive]}>
          {focused && <Gloss radius={radius.pill} strength={0.09} />}
          <View>
            {isProfile ? (
              <LinearGradient colors={['#B45309', '#854D0E']} style={styles.avatar}>
                <Gloss radius={11} strength={0.3} span={0.5} />
                <Text style={styles.avatarText}>ME</Text>
              </LinearGradient>
            ) : (
              <Ionicons name={ICONS[name]} size={22} color={colors.white} />
            )}
            {isMemories && !memoriesSeen ? <View style={styles.redDot} /> : null}
          </View>
          <Text style={styles.label}>{name}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { bottom: insets.bottom + 14 }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <Gloss radius={radius.pill} strength={0.06} span={0.7} />
        {item(0)}
        {item(1)}
        <Pressable style={styles.camera} onPress={openCamera} hitSlop={6}>
          <Gloss radius={27} strength={0.4} span={0.5} />
          <Ionicons name="camera" size={26} color={colors.black} />
        </Pressable>
        {item(2)}
        {item(3)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 12, right: 12, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(18,18,20,0.96)',
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.65,
    shadowRadius: 34,
    elevation: 12,
  },
  itemWrap: { flex: 1, alignItems: 'center' },
  item: { alignItems: 'center', gap: 2, paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill },
  itemActive: { backgroundColor: colors.tabActivePill },
  label: { fontSize: 11, fontWeight: '700', color: colors.white },
  avatar: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 9, fontWeight: '800', color: colors.white },
  redDot: {
    position: 'absolute',
    top: -3,
    right: -4,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#121214',
  },
  camera: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
});
