import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SolarProvider } from '@solar-icons/react-native/lib/SolarProvider';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { SplashOverlay } from '@/components/splash-overlay';
import { AuthProvider } from '@/hooks/use-auth';
import { BookingProvider } from '@/hooks/use-booking';
import { FiltersProvider } from '@/hooks/use-filters';
import { MessagesProvider } from '@/hooks/use-messages';
import { useNotificationObserver } from '@/hooks/use-notification-observer';
import { AppThemeProvider, useTheme } from '@/hooks/use-theme';
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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <FiltersProvider>
          <ThemedApp />
        </FiltersProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

function ThemedApp() {
  useNotificationObserver();
  const { scheme, colors } = useTheme();
  const navigationTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={{ ...navigationTheme, colors: { ...navigationTheme.colors, background: colors.background, card: colors.background, text: colors.text, border: colors.border, primary: colors.primary } }}>
      <SolarProvider color={colors.text} size={24} strokeWidth={1.5}>
        <AuthProvider>
        <WishlistProvider>
          <BookingProvider>
          <MessagesProvider>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
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

              <Stack.Screen name="filters" options={sheet(0.9)} />
              <Stack.Screen name="map" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="discover" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen
                name="gallery"
                options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
              />
              <Stack.Screen name="surprise" options={{ presentation: 'modal' }} />
              <Stack.Screen name="chat/[tripId]" />
            </Stack>
            <SplashOverlay />
          </MessagesProvider>
          </BookingProvider>
        </WishlistProvider>
        </AuthProvider>
      </SolarProvider>
    </ThemeProvider>
  );
}
