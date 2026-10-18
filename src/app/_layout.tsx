import { SolarProvider } from '@solar-icons/react-native/lib/SolarProvider';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { SplashOverlay } from '@/components/splash-overlay';
import { Brand } from '@/constants/theme';
import { AuthProvider } from '@/hooks/use-auth';
import { BookingProvider } from '@/hooks/use-booking';
import { useNotificationObserver } from '@/hooks/use-notification-observer';
import { WishlistProvider } from '@/hooks/use-wishlist';

SplashScreen.preventAutoHideAsync();

// Deep links (and notification taps) land on top of the tabs, so modals still open as sheets.
export const unstable_settings = { initialRouteName: '(tabs)' };

const sheet = (detent: number) => ({
  presentation: 'formSheet' as const,
  sheetAllowedDetents: [detent],
  sheetGrabberVisible: true,
  sheetCornerRadius: 24,
});

export default function RootLayout() {
  useNotificationObserver();

  return (
    <ThemeProvider value={DefaultTheme}>
      <SolarProvider color={Brand.text} size={24} strokeWidth={1.5}>
        <AuthProvider>
        <WishlistProvider>
          <BookingProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Brand.background } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="listing/[id]" />
              <Stack.Screen name="search" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
              <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
              <Stack.Screen name="dates" options={{ presentation: 'modal' }} />
              <Stack.Screen name="country-picker" options={{ presentation: 'modal' }} />

              <Stack.Screen name="booking/index" />
              <Stack.Screen name="booking/guests" options={sheet(0.6)} />
              <Stack.Screen name="booking/pay-with" options={sheet(0.55)} />
              <Stack.Screen name="booking/add-card" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="booking/phone" />
              <Stack.Screen name="booking/verify" options={{ presentation: 'modal' }} />
              <Stack.Screen name="booking/processing" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="booking/pending" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="booking/things-to-do" />
            </Stack>
            <SplashOverlay />
          </BookingProvider>
        </WishlistProvider>
        </AuthProvider>
      </SolarProvider>
    </ThemeProvider>
  );
}
