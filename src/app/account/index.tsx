import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShieldCheckIcon } from '@solar-icons/react-native/linear/shield-check';
import { UserIdIcon } from '@solar-icons/react-native/linear/user-id';
import { BellIcon, CardIcon } from '@/components/icons';
import { SettingsRow } from '@/components/profile/settings-ui';
import { ScreenHeader } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { createStyles } from '@/hooks/use-theme';

const go = (path: string) => router.push(path as never);

const PAGES = [
  { Icon: UserIdIcon, label: 'Personal information', hint: 'Provide personal details and how we can reach you', path: '/account/personal-info' },
  { Icon: ShieldCheckIcon, label: 'Login & security', hint: 'Update your password and secure your account', path: '/account/login-security' },
  { Icon: CardIcon, label: 'Payments and payouts', hint: 'Review payments, payouts, coupons and gift cards', path: '/account/payments' },
  { Icon: BellIcon, label: 'Notifications', hint: 'Choose notification preferences and how you want to be contacted', path: '/account/notifications' },
];

/** Account settings hub, for anyone landing on /account. */
export default function AccountScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Account" />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 32 }}>
        <Text style={styles.title}>Account settings</Text>
        {user && (
          <Text style={styles.subtitle}>
            <Text style={styles.strong}>
              {user.firstName} {user.lastName}
            </Text>
            , {user.email}
          </Text>
        )}
        <View style={{ marginTop: 16 }}>
          {PAGES.map((page, i) => (
            <SettingsRow key={page.path} Icon={page.Icon} label={page.label} hint={page.hint} last={i === PAGES.length - 1} onPress={() => go(page.path)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: c.text,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: c.text,
  },
  strong: {
    fontWeight: '700',
  },
}));
