import { router } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AltArrowRightIcon, BellIcon, GlobalIcon, HomeIcon, QuestionCircleIcon, SettingsIcon, type SolarIcon } from '@/components/icons';
import { EmptyState, TabScreen } from '@/components/tab-screen';
import { TextLink } from '@/components/ui';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useBooking } from '@/hooks/use-booking';
import { sendTestNotification } from '@/lib/notifications';

const ROWS: { Icon: SolarIcon; label: string }[] = [
  { Icon: SettingsIcon, label: 'Account settings' },
  { Icon: GlobalIcon, label: 'Language & currency' },
  { Icon: QuestionCircleIcon, label: 'Get help' },
  { Icon: HomeIcon, label: 'Become a host' },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { trips, remindersOn, setRemindersOn } = useBooking();

  return (
    <TabScreen title="Profile">
      {user ? (
        <Animated.View entering={FadeIn}>
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.firstName[0]}</Text>
            </View>
            <Text style={styles.name}>{user.firstName}</Text>
            <Text style={styles.muted}>Guest</Text>
            <View style={styles.stats}>
              <Stat value={trips.length} label={trips.length === 1 ? 'Trip' : 'Trips'} />
              <View style={styles.statDivider} />
              <Stat value={0} label="Reviews" />
              <View style={styles.statDivider} />
              <Stat value={new Date().getFullYear() - Number(user.birthday.slice(-4))} label="Years old" />
            </View>
          </View>
          <View style={styles.details}>
            <Detail label="Email" value={user.email} />
            {user.phone && <Detail label="Phone" value={`${user.phone.country.dial} ${user.phone.number}`} />}
          </View>
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

      <View style={styles.list}>
        <View style={styles.row}>
          <BellIcon size={24} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Trip reminders</Text>
            <Text style={styles.rowHint}>A notification the day before check-in</Text>
          </View>
          <Switch
            value={remindersOn}
            onValueChange={setRemindersOn}
            trackColor={{ true: Brand.text }}
            accessibilityLabel="Trip reminders"
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
          onPress={async () => {
            if (Platform.OS === 'web') return Alert.alert('Notifications', 'Notifications only work on a phone.');
            const sent = await sendTestNotification();
            if (!sent) Alert.alert('Notifications are off', 'Turn them on for Expo Go in your phone’s Settings to get trip updates.');
          }}>
          <BellIcon size={24} />
          <Text style={styles.rowLabel}>Send a test notification</Text>
          <AltArrowRightIcon size={20} color={Brand.textSecondary} />
        </Pressable>
        {ROWS.map((row) => (
          <Pressable key={row.label} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
            <row.Icon size={24} />
            <Text style={styles.rowLabel}>{row.label}</Text>
            <AltArrowRightIcon size={20} color={Brand.textSecondary} />
          </Pressable>
        ))}
      </View>

      {user && (
        <View style={{ marginTop: 28, alignSelf: 'flex-start' }}>
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
    </TabScreen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: Brand.background,
    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Brand.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '700',
  },
  name: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '700',
    color: Brand.text,
  },
  muted: {
    fontSize: 14,
    color: Brand.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.text,
  },
  statLabel: {
    fontSize: 12,
    color: Brand.text,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Brand.border,
  },
  details: {
    marginTop: 24,
    gap: 14,
  },
  detail: {
    gap: 2,
  },
  detailValue: {
    fontSize: 16,
    color: Brand.text,
  },
  signUp: {
    marginTop: 16,
  },
  signUpText: {
    fontSize: 14,
    color: Brand.textSecondary,
  },
  signUpLink: {
    color: Brand.text,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  list: {
    marginTop: 36,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: Brand.text,
  },
  rowHint: {
    marginTop: 2,
    fontSize: 13,
    color: Brand.textSecondary,
  },
});
