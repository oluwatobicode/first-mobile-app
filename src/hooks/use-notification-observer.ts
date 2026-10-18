import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/** Opens the screen a notification points at (its `data.url`) when it's tapped, including from a cold start. */
export function useNotificationObserver() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    function open(response: Notifications.NotificationResponse | null) {
      const url = response?.notification.request.content.data?.url;
      if (typeof url !== 'string' || response?.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      router.navigate(url as Href);
      Notifications.clearLastNotificationResponse();
    }

    open(Notifications.getLastNotificationResponse());
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, []);
}
