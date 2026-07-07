import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Fredoka_300Light,
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import { Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { installAppFonts } from './src/lib/fonts';

installAppFonts();
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { FriendsProvider } from './src/state/FriendsContext';
import { RootStackParamList, TabParamList } from './src/navigation/types';
import { HomeScreen } from './src/screens/HomeScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { MemoriesScreen } from './src/screens/MemoriesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { FriendProfileScreen } from './src/screens/FriendProfileScreen';
import { AddEditFriendScreen } from './src/screens/AddEditFriendScreen';
import { MemoryViewerScreen } from './src/screens/MemoryViewerScreen';
import { NewMemoryScreen } from './src/screens/NewMemoryScreen';
import { FloatingTabBar } from './src/components/FloatingTabBar';
import { colors } from './src/lib/theme';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.separator,
    primary: colors.primary,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Memories" component={MemoriesScreen} />
      <Tab.Screen name="Profile" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Fredoka_300Light,
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FriendsProvider>
          <NavigationContainer theme={navTheme}>
            <Stack.Navigator
              screenOptions={{
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerTitleStyle: { color: colors.text },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
              <Stack.Screen
                name="FriendProfile"
                component={FriendProfileScreen}
                options={{ headerBackTitle: 'Back' }}
              />
              <Stack.Screen
                name="AddEditFriend"
                component={AddEditFriendScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen
                name="NewMemory"
                component={NewMemoryScreen}
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="MemoryViewer"
                component={MemoryViewerScreen}
                options={{ presentation: 'fullScreenModal', headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="light" />
        </FriendsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
