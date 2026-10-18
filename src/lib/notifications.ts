import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

import { placeOf, type Listing } from '@/data/listings';
import { addDays, formatRange, fromKey, todayKey } from '@/lib/dates';

// Local notifications only: the app schedules them on the device, so they work in Expo Go.
// Remote push would need a development build, EAS credentials and a server.

const CHANNEL_ID = 'trips';

/** How long the "host" takes to accept a request-to-book, so the demo is quick to try. */
export const HOST_REPLY_SECONDS = 20;

// Show banners even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Asks once, sets up the Android channel, and returns whether we may notify. */
export async function ensureNotificationPermission() {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Trips and reminders',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#FF385C',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === IosAuthorizationStatus.PROVISIONAL) return true;
  if (!current.canAskAgain) return false;

  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return asked.granted || asked.ios?.status === IosAuthorizationStatus.PROVISIONAL;
}

function schedule(content: Notifications.NotificationContentInput, trigger: Notifications.NotificationTriggerInput) {
  return Notifications.scheduleNotificationAsync({
    content: { sound: true, ...content },
    trigger: trigger && Platform.OS === 'android' ? { ...trigger, channelId: CHANNEL_ID } : trigger,
  });
}

type TripInfo = { id: string; checkIn: string; checkOut: string | null; instant: boolean };

/** Everything a new booking triggers. Returns the scheduled ids so they can be cancelled later. */
export async function notifyTripBooked(trip: TripInfo, listing: Listing, remindersOn: boolean) {
  if (!(await ensureNotificationPermission())) return [];

  const { city } = placeOf(listing);
  const dates = formatRange(trip.checkIn, trip.checkOut);
  const data = { url: '/trips', tripId: trip.id };
  const ids: string[] = [];

  ids.push(
    await schedule(
      trip.instant
        ? { title: `You’re going to ${city}! 🎉`, body: `${listing.title} is booked for ${dates}.`, data }
        : { title: `Request sent to ${listing.host.name}`, body: `We’ll let you know as soon as they reply about ${dates}.`, data },
      null
    )
  );

  if (!trip.instant) {
    ids.push(
      await schedule(
        { title: `${listing.host.name} accepted your request`, body: `Your stay at ${listing.title} is confirmed. Time to pack! 🧳`, data },
        { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: HOST_REPLY_SECONDS }
      )
    );
  }

  // Check-in reminder at 9am the day before, if that's still in the future.
  const dayBefore = addDays(trip.checkIn, -1);
  if (remindersOn && dayBefore >= todayKey()) {
    const date = fromKey(dayBefore);
    date.setHours(9, 0, 0, 0);
    if (date.getTime() > Date.now()) {
      ids.push(
        await schedule(
          {
            title: `Check-in is tomorrow in ${city}`,
            body: `${listing.host.name} is expecting you at ${listing.title}. Check-in details are in Trips.`,
            data,
          },
          { type: Notifications.SchedulableTriggerInputTypes.DATE, date }
        )
      );
    }
  }

  return ids;
}

export async function sendTestNotification() {
  if (!(await ensureNotificationPermission())) return false;
  await schedule(
    { title: 'Notifications are on 🔔', body: 'You’ll hear about booking updates and check-in reminders here.', data: { url: '/profile' } },
    { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 }
  );
  return true;
}

export function cancelNotifications(ids: string[]) {
  return Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
