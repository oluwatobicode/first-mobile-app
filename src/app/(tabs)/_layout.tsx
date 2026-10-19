import { Redirect, router, usePathname } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import type { ColorValue } from 'react-native';

import { GlassTabBar } from '@/components/glass-tab-bar';
import { ChatRoundDotsIcon, HeartIcon, MagnifierIcon, SuitcaseIcon, UserCircleIcon, type SolarIcon } from '@/components/icons';
import { useBooking } from '@/hooks/use-booking';
import { useUnreadCount } from '@/hooks/use-messages';
import { useSettings } from '@/hooks/use-settings';
import { useShake } from '@/hooks/use-shake';
import { useWishlist } from '@/hooks/use-wishlist';

function icon(Icon: SolarIcon) {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon size={26} color={String(color)} strokeWidth={focused ? 2 : 1.5} />;
  }
  return TabIcon;
}

const TAB_PATHS = ['/', '/wishlists', '/trips', '/messages', '/profile'];

export default function TabLayout() {
  const { ids } = useWishlist();
  const { trips } = useBooking();
  const pathname = usePathname();
  const unread = useUnreadCount();
  const { hostMode } = useSettings();

  // Shake for a surprise trip, but only while browsing the tabs (not mid-checkout, not on the surprise itself).
  useShake(() => router.push('/surprise'), TAB_PATHS.includes(pathname));

  // In hosting mode the app opens on the host tabs instead.
  if (hostMode) return <Redirect href={'/today' as never} />;

  return (
    <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Explore', tabBarIcon: icon(MagnifierIcon) }} />
      <Tabs.Screen
        name="wishlists"
        options={{ title: 'Wishlists', tabBarIcon: icon(HeartIcon), tabBarBadge: ids.length || undefined }}
      />
      <Tabs.Screen
        name="trips"
        options={{ title: 'Trips', tabBarIcon: icon(SuitcaseIcon), tabBarBadge: trips.length || undefined }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: 'Messages', tabBarIcon: icon(ChatRoundDotsIcon), tabBarBadge: unread || undefined }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon(UserCircleIcon) }} />
    </Tabs>
  );
}
