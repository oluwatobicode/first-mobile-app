import { router } from 'expo-router';
import { Alert, View } from 'react-native';

import { BookIcon } from '@solar-icons/react-native/linear/book';
import { ChartIcon } from '@solar-icons/react-native/linear/chart';
import { GraphUpIcon } from '@solar-icons/react-native/linear/graph-up';
import { UsersGroupTwoRoundedIcon } from '@solar-icons/react-native/linear/users-group-two-rounded';
import { SwitchPill, useModeSwitch } from '@/components/host/mode-switch';
import { AddIcon, BanknoteIcon, QuestionCircleIcon, SettingsIcon, UserCircleIcon } from '@/components/icons';
import { SettingsRow, SettingsSection } from '@/components/profile/settings-ui';
import { TabScreen } from '@/components/tab-screen';

const soon = (title: string) => () => Alert.alert(title, 'This part of hosting mode is coming soon.');
const go = (path: string) => () => router.push(path as never);

export default function HostMenuScreen() {
  const { switchTo, overlay } = useModeSwitch();
  return (
    <View style={{ flex: 1 }}>
      <TabScreen title="Menu">
        <SwitchPill label="Switch to travelling" onPress={() => switchTo('travelling')} style={{ alignSelf: 'stretch', justifyContent: 'center', height: 54 }} />

        <SettingsSection title="Hosting">
          <SettingsRow Icon={BanknoteIcon} label="Earnings" hint="₦1,245,000 this month" onPress={soon('Earnings')} />
          <SettingsRow Icon={ChartIcon} label="Insights" hint="Views, bookings and reviews" onPress={soon('Insights')} />
          <SettingsRow Icon={BookIcon} label="Guidebooks" hint="Share your favourite spots with guests" onPress={soon('Guidebooks')} />
          <SettingsRow Icon={GraphUpIcon} label="Explore hosting resources" onPress={soon('Hosting resources')} />
          <SettingsRow Icon={UsersGroupTwoRoundedIcon} label="Find a co-host" onPress={soon('Co-hosting')} />
          <SettingsRow Icon={AddIcon} label="Create a new listing" last onPress={soon('New listing')} />
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingsRow Icon={UserCircleIcon} label="Account settings" onPress={go('/account')} />
          <SettingsRow Icon={BanknoteIcon} label="Payouts" onPress={go('/account/payments?tab=payouts')} />
          <SettingsRow Icon={SettingsIcon} label="Notifications" onPress={go('/account/notifications')} />
          <SettingsRow
            Icon={QuestionCircleIcon}
            label="Get help"
            last
            onPress={() => Alert.alert('Get help', 'Our host support team is available 24/7. In this demo, nothing is sent.')}
          />
        </SettingsSection>
      </TabScreen>
      {overlay}
    </View>
  );
}
