import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { FriendsProvider } from './src/state/FriendsContext';
import { RootStackParamList, TabParamList } from './src/navigation/types';
import { HomeScreen } from './src/screens/HomeScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { FriendProfileScreen } from './src/screens/FriendProfileScreen';
import { AddEditFriendScreen } from './src/screens/AddEditFriendScreen';
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

const TAB_ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Friends: 'people',
  Calendar: 'calendar',
  Settings: 'settings',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.separator },
        tabBarIcon: ({ color, size, focused }) => {
          const base = TAB_ICONS[route.name];
          const name = (focused ? base : `${base}-outline`) as keyof typeof Ionicons.glyphMap;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
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
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="light" />
        </FriendsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
