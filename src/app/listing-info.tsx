import { ConfettiIcon } from '@solar-icons/react-native/linear/confetti';
import { DangerTriangleIcon } from '@solar-icons/react-native/linear/danger-triangle';
import { FireIcon } from '@solar-icons/react-native/linear/fire';
import { ForbiddenCircleIcon } from '@solar-icons/react-native/linear/forbidden-circle';
import { MonitorCameraIcon } from '@solar-icons/react-native/linear/monitor-camera';
import { PawIcon } from '@solar-icons/react-native/linear/paw';
import { SirenIcon } from '@solar-icons/react-native/linear/siren';
import { SleepingIcon } from '@solar-icons/react-native/linear/sleeping';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClockCircleIcon, UsersGroupRoundedIcon, type SolarIcon } from '@/components/icons';
import { ScreenHeader } from '@/components/ui';
import { rulesFor, SAFETY } from '@/data/details';
import { getListing, type Listing } from '@/data/listings';
import { useBooking } from '@/hooks/use-booking';
import { addDays, formatLong } from '@/lib/dates';
import { createStyles } from '@/hooks/use-theme';

type Section = 'rules' | 'safety' | 'cancellation';

const TITLES: Record<Section, string> = {
  rules: 'House rules',
  safety: 'Safety & property',
  cancellation: 'Cancellation policy',
};

const SAFETY_ICONS: [RegExp, SolarIcon][] = [
  [/carbon/i, DangerTriangleIcon],
  [/smoke/i, SirenIcon],
  [/camera/i, MonitorCameraIcon],
  [/fire/i, FireIcon],
];

export default function ListingInfoScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; section?: string }>();
  const listing = getListing(params.id);
  const section: Section = params.section === 'safety' || params.section === 'cancellation' ? params.section : 'rules';

  return (
    <View style={styles.screen}>
      <ScreenHeader title={TITLES[section]} leading="close" safeTop={false} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {!listing ? (
          <Text style={styles.paragraph}>Listing not found</Text>
        ) : section === 'rules' ? (
          <Rules listing={listing} />
        ) : section === 'safety' ? (
          <Safety />
        ) : (
          <Cancellation listing={listing} />
        )}
      </ScrollView>
    </View>
  );
}

function Rules({ listing }: { listing: Listing }) {
  const styles = useStyles();
  const rules = rulesFor(listing);
  return (
    <>
      <Text style={styles.lead}>You’ll be staying in someone’s home, so please treat it with care and respect.</Text>
      <Text style={styles.groupTitle}>Checking in and out</Text>
      <Row Icon={ClockCircleIcon} label={`Check-in after ${rules.checkIn}`} />
      <Row Icon={ClockCircleIcon} label={`Checkout before ${rules.checkOut}`} />
      <Text style={styles.groupTitle}>During your stay</Text>
      <Row Icon={UsersGroupRoundedIcon} label={`${rules.maxGuests} guests maximum`} />
      <Row Icon={PawIcon} label={rules.pets ? 'Pets allowed' : 'No pets'} />
      <Row Icon={SleepingIcon} label={`Quiet hours ${rules.quietHours}`} />
      <Row Icon={ForbiddenCircleIcon} label={rules.smoking ? 'Smoking allowed' : 'No smoking'} />
      <Row Icon={ConfettiIcon} label={rules.parties ? 'Events allowed' : 'No parties or events'} />
    </>
  );
}

function Safety() {
  const styles = useStyles();
  return (
    <>
      <Text style={styles.lead}>Avoid surprises by looking over these important details about the property.</Text>
      <Text style={styles.groupTitle}>Safety devices</Text>
      {SAFETY.map((label) => (
        <Row key={label} Icon={SAFETY_ICONS.find(([pattern]) => pattern.test(label))?.[1] ?? DangerTriangleIcon} label={label} />
      ))}
      <Text style={styles.note}>
        The host has told us about these devices. Exterior cameras only cover entrances and are never inside the home.
      </Text>
    </>
  );
}

function Cancellation({ listing }: { listing: Listing }) {
  const styles = useStyles();
  const { draftFor } = useBooking();
  const { checkIn } = draftFor(listing.id);
  const freeUntil = checkIn ? formatLong(addDays(checkIn, -7)) : null;

  return (
    <>
      <Text style={styles.lead}>
        {freeUntil
          ? `Cancel before ${freeUntil} for a full refund.`
          : 'Free cancellation up to 7 days before check-in. Add your dates to see the exact deadlines.'}
      </Text>
      <View style={styles.timeline}>
        <Step
          when={freeUntil ? `Before ${freeUntil}` : 'More than 7 days before check-in'}
          title="Full refund"
          detail="Get back 100% of what you paid."
        />
        <Step
          when={checkIn ? `Before check-in on ${formatLong(checkIn)}` : 'Within 7 days of check-in'}
          title="Partial refund"
          detail="Get back 50% of every night. No refund of the service fee."
        />
        <Step when="After check-in" title="No refund" detail="Nights already started can’t be refunded." last />
      </View>
      <Text style={styles.note}>Cleaning fees are refunded if you cancel before check-in.</Text>
    </>
  );
}

function Row({ Icon, label }: { Icon: SolarIcon; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Icon size={24} />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
  );
}

function Step({ when, title, detail, last }: { when: string; title: string; detail: string; last?: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.step, !last && styles.stepBorder]}>
      <Text style={styles.when}>{when}</Text>
      <View style={{ flex: 1.4 }}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  lead: {
    fontSize: 16,
    lineHeight: 24,
    color: c.textSecondary,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
    marginTop: 28,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: c.text,
  },
  paragraph: {
    fontSize: 16,
    color: c.text,
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
    color: c.textSecondary,
    marginTop: 20,
  },
  timeline: {
    marginTop: 20,
  },
  step: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 18,
  },
  stepBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  when: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  stepDetail: {
    fontSize: 14,
    lineHeight: 20,
    color: c.textSecondary,
    marginTop: 2,
  },
}));
