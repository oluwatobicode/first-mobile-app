import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform, Pressable, Switch, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { DocumentTextIcon } from '@solar-icons/react-native/linear/document-text';
import { RestartIcon } from '@solar-icons/react-native/linear/restart';
import { ShieldCheckIcon } from '@solar-icons/react-native/linear/shield-check';
import { TransferHorizontalIcon } from '@solar-icons/react-native/linear/transfer-horizontal';
import { UserIdIcon } from '@solar-icons/react-native/linear/user-id';
import { useTabBarSpace } from '@/components/glass-tab-bar';
import { SwitchPill, useModeSwitch } from '@/components/host/mode-switch';
import {
  AltArrowRightIcon,
  BellIcon,
  CardIcon,
  HomeSmileIcon,
  QuestionCircleIcon,
  SettingsIcon,
  Translation2Icon,
} from '@/components/icons';
import { Avatar, SettingsRow, SettingsSection } from '@/components/profile/settings-ui';
import { EmptyState, TabScreen } from '@/components/tab-screen';
import { TextLink } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { useBooking } from '@/hooks/use-booking';
import { clearPersistedState, usePersistedState } from '@/hooks/use-persisted-state';
import { createStyles, useTheme, type ThemePreference } from '@/hooks/use-theme';
import { sendTestNotification } from '@/lib/notifications';

const go = (path: string) => router.push(path as never);

export default function ProfileScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { remindersOn, setRemindersOn } = useBooking();
  const [translate, setTranslate] = usePersistedState('auto-translate', true);
  const { switchTo, overlay } = useModeSwitch();
  const tabBarSpace = useTabBarSpace();

  const resetDemo = () =>
    Alert.alert('Reset demo data?', 'This clears trips, wishlists, reviews, accounts and settings saved on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await clearPersistedState();
          Alert.alert('Demo data cleared', 'Close and reopen the app (or reload it in Expo Go) to start fresh.');
        },
      },
    ]);

  return (
    <View style={styles.screen}>
      <TabScreen title="Profile">
        {user ? (
          <Animated.View entering={FadeIn}>
            <Pressable
              onPress={() => go('/profile-details')}
              style={({ pressed }) => [styles.profileRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${user.firstName}, show profile`}>
              <Avatar name={user.firstName} size={64} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user.firstName}</Text>
                <Text style={styles.muted}>Show profile</Text>
              </View>
              <AltArrowRightIcon size={22} color={colors.text} />
            </Pressable>

            <Pressable
              onPress={() => switchTo('hosting')}
              style={({ pressed }) => [styles.promo, pressed && { transform: [{ scale: 0.99 }] }]}
              accessibilityRole="button"
              accessibilityLabel="Become a host. It’s easy to start hosting and earn extra income.">
              <View style={{ flex: 1 }}>
                <Text style={styles.promoTitle}>Become a host</Text>
                <Text style={styles.promoBody}>It’s easy to start hosting and earn extra income.</Text>
              </View>
              <Text style={styles.promoEmoji}>🏡</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            <EmptyState
              emoji="👋🏾"
              heading="Log in to start planning your next trip"
              body="Save homes, message hosts and keep track of your trips in one place."
              action={{ label: 'Log in', onPress: () => router.push('/login') }}
            />
            <Pressable onPress={() => router.push('/email')} style={styles.signUp}>
              <Text style={styles.signUpText}>
                Don’t have an account? <Text style={styles.signUpLink}>Sign up</Text>
              </Text>
            </Pressable>
          </>
        )}

        <SettingsSection title="Settings">
          {user && (
            <>
              <SettingsRow Icon={UserIdIcon} label="Personal information" onPress={() => go('/account/personal-info')} />
              <SettingsRow Icon={ShieldCheckIcon} label="Login & security" onPress={() => go('/account/login-security')} />
              <SettingsRow Icon={CardIcon} label="Payments and payouts" onPress={() => go('/account/payments')} />
              <SettingsRow Icon={BellIcon} label="Notifications" onPress={() => go('/account/notifications')} />
            </>
          )}
          <SettingsRow
            Icon={BellIcon}
            label="Trip reminders"
            hint="A notification the day before check-in"
            trailing={
              <Switch value={remindersOn} onValueChange={setRemindersOn} trackColor={{ true: colors.text }} accessibilityLabel="Trip reminders" />
            }
          />
          <SettingsRow
            Icon={BellIcon}
            label="Send a test notification"
            onPress={async () => {
              if (Platform.OS === 'web') return Alert.alert('Notifications', 'Notifications only work on a phone.');
              const sent = await sendTestNotification();
              if (!sent) Alert.alert('Notifications are off', 'Turn them on for Expo Go in your phone’s Settings to get trip updates.');
            }}
          />
          <View style={styles.appearance}>
            <View style={styles.appearanceHeader}>
              <SettingsIcon size={24} color={colors.text} />
              <Text style={styles.rowLabel}>Appearance</Text>
            </View>
            <ThemePicker />
          </View>
          <SettingsRow
            Icon={Translation2Icon}
            label="Translation"
            hint="Automatically translate reviews and descriptions to English"
            last
            trailing={<Switch value={translate} onValueChange={setTranslate} trackColor={{ true: colors.text }} accessibilityLabel="Translation" />}
          />
        </SettingsSection>

        <SettingsSection title="Hosting">
          <SettingsRow
            Icon={TransferHorizontalIcon}
            label="Switch to hosting"
            onPress={user ? () => switchTo('hosting') : () => router.push('/login')}
          />
          <SettingsRow
            Icon={HomeSmileIcon}
            label="List your space"
            last
            onPress={() => Alert.alert('Coming soon', 'Listing a new place isn’t part of this demo yet.')}
          />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsRow
            Icon={QuestionCircleIcon}
            label="Get help"
            onPress={() => Alert.alert('Get help', 'Our support team is available 24/7. In this demo, nothing is sent.')}
          />
          <SettingsRow
            Icon={DocumentTextIcon}
            label="Terms of Service"
            onPress={() => WebBrowser.openBrowserAsync('https://www.airbnb.com/help/article/2908')}
          />
          <SettingsRow Icon={RestartIcon} label="Reset demo data" hint="Start over with a fresh app" last onPress={resetDemo} />
        </SettingsSection>

        {user && (
          <View style={styles.logout}>
            <TextLink
              label="Log out"
              onPress={() =>
                Alert.alert('Log out?', 'You can log back in any time.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Log out', style: 'destructive', onPress: signOut },
                ])
              }
            />
          </View>
        )}
        <Text style={styles.version}>Version 1.0.0 · Demo</Text>
        {/* Room for the floating "Switch to hosting" pill. */}
        {user && <View style={{ height: 64 }} />}
      </TabScreen>

      {user && (
        <Animated.View entering={FadeInDown.delay(200).springify().damping(16)} style={[styles.pillWrap, { bottom: tabBarSpace }]} pointerEvents="box-none">
          <SwitchPill label="Switch to hosting" onPress={() => switchTo('hosting')} />
        </Animated.View>
      )}
      {overlay}
    </View>
  );
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** System / Light / Dark segmented control. The choice is saved on the device. */
function ThemePicker() {
  const styles = useStyles();
  const { preference, setPreference } = useTheme();
  return (
    <View style={styles.segments} accessibilityRole="radiogroup">
      {THEME_OPTIONS.map((option) => {
        const selected = preference === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => setPreference(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}>
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  pressed: {
    opacity: 0.6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
  },
  muted: {
    marginTop: 2,
    fontSize: 14,
    color: c.textSecondary,
  },
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: c.elevated,
    boxShadow: `0 6px 20px ${c.shadow}`,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.text,
  },
  promoBody: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: c.textSecondary,
  },
  promoEmoji: {
    fontSize: 56,
  },
  signUp: {
    marginTop: 16,
  },
  signUpText: {
    fontSize: 14,
    color: c.textSecondary,
  },
  signUpLink: {
    color: c.text,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  appearance: {
    paddingVertical: 18,
    gap: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
  },
  appearanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: c.text,
  },
  segments: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    backgroundColor: c.surface,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: c.elevated,
    boxShadow: `0 1px 4px ${c.shadow}`,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '500',
    color: c.textSecondary,
  },
  segmentTextSelected: {
    fontWeight: '700',
    color: c.text,
  },
  logout: {
    marginTop: 28,
    alignSelf: 'flex-start',
  },
  version: {
    marginTop: 24,
    fontSize: 12,
    color: c.textSecondary,
  },
  pillWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
}));
