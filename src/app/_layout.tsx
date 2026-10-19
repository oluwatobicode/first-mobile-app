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
import { ReviewsProvider } from '@/hooks/use-reviews';
import { SettingsProvider } from '@/hooks/use-settings';
import { ToastProvider } from '@/hooks/use-toast';
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
        <SettingsProvider>
          <FiltersProvider>
            <ReviewsProvider>
              <ToastProvider>
                <ThemedApp />
              </ToastProvider>
            </ReviewsProvider>
          </FiltersProvider>
        </SettingsProvider>
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

              {/* Listing details */}
              <Stack.Screen name="reviews" options={{ presentation: 'modal' }} />
              <Stack.Screen name="amenities" options={{ presentation: 'modal' }} />
              <Stack.Screen name="photo-tour" />
              <Stack.Screen name="listing-info" options={sheet(0.75)} />

              {/* Wishlists */}
              <Stack.Screen name="save-to-wishlist" options={sheet(0.7)} />
              <Stack.Screen name="wishlist/[listId]" />

              {/* Trips */}
              <Stack.Screen name="trip/[tripId]" />
              <Stack.Screen name="cancel-trip" options={{ presentation: 'modal' }} />
              <Stack.Screen name="receipt" options={{ presentation: 'modal' }} />
              <Stack.Screen name="review" options={{ presentation: 'fullScreenModal' }} />

              {/* Profile, account and hosting */}
              <Stack.Screen name="profile-details" />
              <Stack.Screen name="account/index" />
              <Stack.Screen name="account/personal-info" />
              <Stack.Screen name="account/login-security" />
              <Stack.Screen name="account/payments" />
              <Stack.Screen name="account/notifications" />
              <Stack.Screen name="(host)" options={{ animation: 'fade' }} />
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
