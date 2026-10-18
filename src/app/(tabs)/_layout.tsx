import { Tabs } from 'expo-router/tabs';
import { StyleSheet, type ColorValue } from 'react-native';

import { ChatRoundDotsIcon, HeartIcon, MagnifierIcon, SuitcaseIcon, UserCircleIcon, type SolarIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { useBooking } from '@/hooks/use-booking';
import { useWishlist } from '@/hooks/use-wishlist';

function icon(Icon: SolarIcon) {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon size={26} color={String(color)} strokeWidth={focused ? 2 : 1.5} />;
  }
  return TabIcon;
}

export default function TabLayout() {
  const { ids } = useWishlist();
  const { trips } = useBooking();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: Brand.textSecondary,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
        tabBarBadgeStyle: styles.badge,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Explore', tabBarIcon: icon(MagnifierIcon) }} />
      <Tabs.Screen
        name="wishlists"
        options={{ title: 'Wishlists', tabBarIcon: icon(HeartIcon), tabBarBadge: ids.length || undefined }}
      />
      <Tabs.Screen
        name="trips"
        options={{ title: 'Trips', tabBarIcon: icon(SuitcaseIcon), tabBarBadge: trips.length || undefined }}
      />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: icon(ChatRoundDotsIcon) }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon(UserCircleIcon) }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Brand.background,
    borderTopColor: Brand.border,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: Brand.primary,
    fontSize: 10,
  },
});
