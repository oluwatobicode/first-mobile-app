import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ToggleRow, UnderlineTabs } from '@/components/profile/settings-ui';
import { ScreenHeader } from '@/components/ui';
import { useBooking } from '@/hooks/use-booking';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { createStyles } from '@/hooks/use-theme';

type Tab = 'offers' | 'account';
type PrefKey = 'recommendations' | 'travelTips' | 'priceDrops' | 'messages' | 'accountActivity';

const DEFAULTS: Record<PrefKey, boolean> = {
  recommendations: true,
  travelTips: false,
  priceDrops: true,
  messages: true,
  accountActivity: true,
};

const OFFERS: { key: PrefKey; label: string; hint: string }[] = [
  { key: 'recommendations', label: 'Recommendations', hint: 'Email / Push · Homes and experiences picked for you' },
  { key: 'travelTips', label: 'Travel tips and offers', hint: 'Email / Push · Inspiration for trips around Lagos, Abuja and Accra' },
  { key: 'priceDrops', label: 'Price drops', hint: 'Email / Push / SMS · When a saved home gets cheaper' },
];

export default function NotificationsScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('offers');
  const [prefs, setPrefs] = usePersistedState('notification-prefs', DEFAULTS);
  const { remindersOn, setRemindersOn } = useBooking();

  const toggle = (key: PrefKey) => (on: boolean) => setPrefs((current) => ({ ...current, [key]: on }));

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Notifications" />
      <View style={{ paddingHorizontal: 24 }}>
        <UnderlineTabs
          tabs={[
            { key: 'offers', label: 'Offers and updates' },
            { key: 'account', label: 'Account' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}>
        <Animated.View key={tab} entering={FadeIn.duration(180)}>
          {tab === 'offers' ? (
            <>
              <Text style={styles.heading}>Travel tips and offers</Text>
              <Text style={styles.body}>Inspire your next trip with personalised recommendations and special offers.</Text>
              {OFFERS.map((row, i) => (
                <ToggleRow key={row.key} label={row.label} hint={row.hint} value={prefs[row.key]} onValueChange={toggle(row.key)} last={i === OFFERS.length - 1} />
              ))}
            </>
          ) : (
            <>
              <Text style={styles.heading}>Account activity and policies</Text>
              <Text style={styles.body}>Confirm your bookings, keep track of account activity and learn about important policies.</Text>
              <ToggleRow label="Messages" hint="Email / Push / SMS · From hosts and guests" value={prefs.messages} onValueChange={toggle('messages')} />
              <ToggleRow
                label="Reminders"
                hint="Push · A notification the day before check-in"
                value={remindersOn}
                onValueChange={setRemindersOn}
              />
              <ToggleRow
                label="Account activity"
                hint="Email / SMS · New logins and changes to your details"
                value={prefs.accountActivity}
                onValueChange={toggle('accountActivity')}
                last
              />
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  heading: {
    marginTop: 28,
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
  },
  body: {
    marginTop: 6,
    marginBottom: 4,
    fontSize: 14,
    lineHeight: 20,
    color: c.textSecondary,
  },
}));
