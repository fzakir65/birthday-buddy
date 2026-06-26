import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Asset } from 'expo-asset';
import { Friend, Settings } from '../types';
import { nextBirthday, turningAge } from './dates';
import { closenessMeta } from './constants';

/**
 * Local-notification scheduling for birthday reminders.
 *
 * Strategy: this is a prototype, so we cancel and re-schedule every reminder
 * whenever data changes or the app opens. Each reminder is a one-shot DATE
 * trigger for the *next* occurrence of the birthday; re-running keeps the
 * pipeline full for the coming year. (A production build would use a push
 * service / recurring server jobs — see README.)
 */

let handlerConfigured = false;

/**
 * Rich "picture banner" notifications (iOS).
 *
 * iOS local notifications can carry an image attachment — it shows as a large
 * picture when the banner is expanded (Snapchat-style), with the title/subtitle/body
 * stacked in the text box. This works in Expo Go for *local* notifications (no
 * Notification Service Extension needed — that's only for remote push images).
 *
 * The image must be a local `file://` URL. We use the friend's photo when they have
 * one, otherwise a bundled default image resolved to a cached local file.
 */

let defaultImageUri: string | null = null;

/** Resolve the bundled fallback image to a cached local file:// URL (once). */
async function getDefaultNotificationImage(): Promise<string | null> {
  if (defaultImageUri) return defaultImageUri;
  try {
    const asset = Asset.fromModule(require('../../assets/icon.png'));
    await asset.downloadAsync();
    defaultImageUri = asset.localUri ?? asset.uri ?? null;
    return defaultImageUri;
  } catch (e) {
    console.warn('default notification image failed', e);
    return null;
  }
}

function utiForUri(uri: string): string {
  return uri.toLowerCase().includes('.png') ? 'public.png' : 'public.jpeg';
}

/** Build the iOS image attachment (friend photo, else the default). iOS-only. */
async function buildAttachments(friend: Friend) {
  if (Platform.OS !== 'ios') return undefined;
  const uri = friend.photoUri || (await getDefaultNotificationImage());
  if (!uri) return undefined;
  return [{ identifier: 'friend-photo', url: uri, type: utiForUri(uri) }];
}

export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('birthdays', {
    name: 'Birthday reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF3B30',
  });
}

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) {
    // Simulators can register but won't deliver; still allow scheduling on iOS sim.
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return req.granted;
}

function reminderDaysFor(friend: Friend, settings: Settings): number[] {
  return friend.reminderDays.length > 0
    ? friend.reminderDays
    : settings.defaultReminderDays;
}

function messageFor(friend: Friend, daysBefore: number, settings: Settings) {
  const age = turningAge(friend);
  const turning = age != null ? ` (turning ${age})` : '';
  if (daysBefore === 0) {
    return {
      title: `🎂 It's ${friend.name}'s birthday today!`,
      body: `Say happy birthday${turning}. Tap to call, text, or pick a gift idea.`,
    };
  }
  if (daysBefore === 1) {
    return {
      title: `${friend.name}'s birthday is tomorrow 🎉`,
      body: `Get ready${turning}. Open Birthday Buddy to plan something.`,
    };
  }
  return {
    title: `${friend.name}'s birthday is in ${daysBefore} days`,
    body: `${friend.name} turns the page soon${turning}. Time to plan a gift or message.`,
  };
}

/** Cancel everything and re-schedule reminders for all friends. */
export async function rescheduleAll(
  friends: Friend[],
  settings: Settings
): Promise<number> {
  if (Platform.OS === 'web') return 0;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('cancel notifications failed', e);
    return 0;
  }

  const now = Date.now();
  let scheduled = 0;

  for (const friend of friends) {
    const bday = nextBirthday(friend);
    for (const daysBefore of reminderDaysFor(friend, settings)) {
      const when = new Date(bday);
      when.setDate(when.getDate() - daysBefore);
      when.setHours(settings.notificationHour, 0, 0, 0);
      if (when.getTime() <= now) continue; // already passed

      const { title, body } = messageFor(friend, daysBefore, settings);
      const attachments = await buildAttachments(friend);
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            subtitle: closenessMeta(friend.closeness).label,
            body,
            data: { friendId: friend.id, daysBefore },
            ...(attachments ? { attachments } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: when,
            ...(Platform.OS === 'android' ? { channelId: 'birthdays' } : {}),
          },
        });
        scheduled += 1;
      } catch (e) {
        console.warn('schedule failed', e);
      }
    }
  }
  return scheduled;
}

/** Fire a test notification a few seconds out so the user can see it work. */
export async function sendTestNotification(): Promise<void> {
  const image = Platform.OS === 'ios' ? await getDefaultNotificationImage() : null;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🎂 It's Aisha's birthday in 3 days",
      subtitle: 'Day One 💎',
      body: "This is how a reminder looks — tap to plan a gift or message. We've got your back!",
      ...(image ? { attachments: [{ identifier: 'demo', url: image, type: 'public.png' }] } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      ...(Platform.OS === 'android' ? { channelId: 'birthdays' } : {}),
    },
  });
}

export async function countScheduled(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.length;
}
