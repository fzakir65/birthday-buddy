import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  Tabs: undefined;
  FriendProfile: { id: string };
  AddEditFriend: { id?: string } | undefined;
  NewMemory: { y: number; m: number; d: number } | undefined;
  MemoryViewer: { memoryId: string };
};

export type TabParamList = {
  Home: undefined;
  Friends: undefined;
  Memories: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
