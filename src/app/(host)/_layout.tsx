import { Tabs } from 'expo-router/tabs';
import type { ColorValue } from 'react-native';

import { CalendarIcon } from '@solar-icons/react-native/linear/calendar';
import { ClipboardListIcon } from '@solar-icons/react-native/linear/clipboard-list';
import { HamburgerMenuIcon } from '@solar-icons/react-native/linear/hamburger-menu';
import { GlassTabBar } from '@/components/glass-tab-bar';
import { GUEST_THREADS } from '@/components/host/data';
import { ChatRoundDotsIcon, HomeIcon, type SolarIcon } from '@/components/icons';

function icon(Icon: SolarIcon) {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon size={26} color={String(color)} strokeWidth={focused ? 2 : 1.5} />;
  }
  return TabIcon;
}

const UNREAD = GUEST_THREADS.filter((t) => t.unread).length;

/** Hosting mode: its own tab group, swapped in for the guest tabs by "Switch to hosting". */
export default function HostLayout() {
  return (
    <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="today" options={{ title: 'Today', tabBarIcon: icon(ClipboardListIcon) }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: icon(CalendarIcon) }} />
      <Tabs.Screen name="listings" options={{ title: 'Listings', tabBarIcon: icon(HomeIcon) }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox', tabBarIcon: icon(ChatRoundDotsIcon), tabBarBadge: UNREAD || undefined }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu', tabBarIcon: icon(HamburgerMenuIcon) }} />
    </Tabs>
  );
}
