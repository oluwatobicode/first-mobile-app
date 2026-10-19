import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { hostReservations, HOST_TIPS, MONTHLY_EARNINGS, type Reservation, type ReservationStatus } from '@/components/host/data';
import { Avatar } from '@/components/profile/settings-ui';
import { TabScreen } from '@/components/tab-screen';
import { formatPrice, getListing } from '@/data/listings';
import { useAuth } from '@/hooks/use-auth';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { formatRange, nightsBetween, todayKey } from '@/lib/dates';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SEGMENTS: { key: ReservationStatus; label: string }[] = [
  { key: 'checkingOut', label: 'Checking out' },
  { key: 'hosting', label: 'Currently hosting' },
  { key: 'arriving', label: 'Arriving soon' },
  { key: 'upcoming', label: 'Upcoming' },
];

const EMPTY_COPY: Record<ReservationStatus, string> = {
  checkingOut: 'You don’t have any guests checking out today or tomorrow.',
  hosting: 'You don’t have any guests staying with you right now.',
  arriving: 'You don’t have any guests arriving today or tomorrow.',
  upcoming: 'You don’t have any upcoming reservations.',
};

function statusLine(reservation: Reservation) {
  const today = todayKey();
  if (reservation.status === 'hosting') {
    const left = nightsBetween(today, reservation.checkOut);
    return `Checks out in ${left} ${left === 1 ? 'day' : 'days'}`;
  }
  const until = nightsBetween(today, reservation.checkIn);
  if (until <= 0) return 'Arrives today';
  if (until === 1) return 'Arrives tomorrow';
  return `In ${until} days`;
}

/** Last six month labels, ending with this month. */
function monthLabels(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => MONTHS[(now.getMonth() - (count - 1 - i) + 12) % 12]);
}

export default function TodayScreen() {
  const styles = useStyles();
  const { user } = useAuth();
  const reservations = hostReservations();
  const [segment, setSegment] = useState<ReservationStatus>('hosting');
  const visible = reservations.filter((r) => r.status === segment);

  return (
    <TabScreen title={`Welcome back, ${user?.firstName ?? 'host'}`}>
      <Text style={styles.sectionTitle}>Your reservations</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
        {SEGMENTS.map((s) => {
          const count = reservations.filter((r) => r.status === s.key).length;
          const selected = s.key === segment;
          return (
            <Pressable
              key={s.key}
              onPress={() => {
                if (!selected && Platform.OS !== 'web') Haptics.selectionAsync();
                setSegment(s.key);
              }}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {s.label} ({count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Animated.View key={segment} entering={FadeIn.duration(200)}>
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🗓️</Text>
            <Text style={styles.emptyText}>{EMPTY_COPY[segment]}</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
            contentContainerStyle={styles.cards}
            snapToInterval={292}
            decelerationRate="fast">
            {visible.map((r, i) => (
              <Animated.View key={r.id} entering={FadeInDown.delay(i * 70)}>
                <ReservationCard reservation={r} />
              </Animated.View>
            ))}
          </ScrollView>
        )}
      </Animated.View>

      <EarningsCard />

      <Text style={[styles.sectionTitle, { marginTop: 36 }]}>Tips & updates</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.cards}
        snapToInterval={252}
        decelerationRate="fast">
        {HOST_TIPS.map((tip) => (
          <Pressable key={tip.id} style={({ pressed }) => [styles.tip, pressed && { opacity: 0.8 }]} onPress={() => Alert.alert(tip.title, tip.body)}>
            <Text style={styles.tipEmoji}>{tip.emoji}</Text>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipBody} numberOfLines={3}>
              {tip.body}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </TabScreen>
  );
}

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const styles = useStyles();
  const listing = getListing(reservation.listingId);
  const first = reservation.guest.split(' ')[0];
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}
      onPress={() =>
        Alert.alert(reservation.guest, `${reservation.guests} ${reservation.guests === 1 ? 'guest' : 'guests'} from ${reservation.from}\n${listing?.title ?? ''}`)
      }
      accessibilityRole="button">
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardStatus}>{statusLine(reservation)}</Text>
          <Text style={styles.cardGuest}>{first}</Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {formatRange(reservation.checkIn, reservation.checkOut)} · {reservation.guests} {reservation.guests === 1 ? 'guest' : 'guests'}
          </Text>
        </View>
        <Avatar name={reservation.guest} size={48} />
      </View>
      <View style={styles.cardListing}>
        {listing && <Image source={listing.images[0]} style={styles.cardImage} contentFit="cover" />}
        <Text style={styles.cardListingTitle} numberOfLines={1}>
          {listing?.title}
        </Text>
      </View>
    </Pressable>
  );
}

function EarningsCard() {
  const styles = useStyles();
  const { colors } = useTheme();
  const labels = monthLabels(MONTHLY_EARNINGS.length);
  const max = Math.max(...MONTHLY_EARNINGS);
  const thisMonth = MONTHLY_EARNINGS[MONTHLY_EARNINGS.length - 1];
  const lastMonth = MONTHLY_EARNINGS[MONTHLY_EARNINGS.length - 2];
  const change = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  return (
    <View style={styles.earnings} accessibilityLabel={`Your earnings this month: ${formatPrice(thisMonth)}`}>
      <Text style={styles.earningsLabel}>Your earnings this month</Text>
      <Text style={styles.earningsValue}>{formatPrice(thisMonth)}</Text>
      <Text style={styles.earningsChange}>
        {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% vs {labels[labels.length - 2]}
      </Text>
      <View style={styles.chart}>
        {MONTHLY_EARNINGS.map((amount, i) => {
          const current = i === MONTHLY_EARNINGS.length - 1;
          return (
            <View key={labels[i]} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <Animated.View
                  entering={FadeInDown.delay(150 + i * 60).springify().damping(15)}
                  style={[styles.bar, { height: `${Math.max(8, (amount / max) * 100)}%`, backgroundColor: current ? colors.primary : colors.border }]}
                />
              </View>
              <Text style={[styles.barLabel, current && styles.barLabelCurrent]}>{labels[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  bleed: {
    marginHorizontal: -24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: c.text,
    marginBottom: 14,
  },
  chips: {
    paddingHorizontal: 24,
    gap: 8,
    paddingBottom: 18,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
  },
  chipSelected: {
    borderColor: c.text,
    borderWidth: 2,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: c.text,
  },
  chipTextSelected: {
    fontWeight: '700',
  },
  empty: {
    padding: 28,
    gap: 10,
    alignItems: 'center',
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: c.surface,
  },
  emptyEmoji: {
    fontSize: 34,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    color: c.textSecondary,
  },
  cards: {
    paddingHorizontal: 24,
    gap: 12,
    paddingVertical: 4,
  },
  card: {
    width: 280,
    padding: 18,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: c.border,
    backgroundColor: c.elevated,
    boxShadow: `0 4px 14px ${c.shadow}`,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  cardStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: c.primary,
  },
  cardGuest: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
  },
  cardMeta: {
    marginTop: 2,
    fontSize: 14,
    color: c.textSecondary,
  },
  cardListing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: c.border,
  },
  cardImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: c.surface,
  },
  cardListingTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: c.text,
  },
  earnings: {
    marginTop: 36,
    padding: 20,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: c.surface,
  },
  earningsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: c.textSecondary,
  },
  earningsValue: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  earningsChange: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    height: 130,
    marginTop: 20,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    color: c.textSecondary,
  },
  barLabelCurrent: {
    fontWeight: '700',
    color: c.text,
  },
  tip: {
    width: 240,
    padding: 18,
    gap: 6,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: c.border,
    backgroundColor: c.elevated,
  },
  tipEmoji: {
    fontSize: 28,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
  },
  tipBody: {
    fontSize: 14,
    lineHeight: 20,
    color: c.textSecondary,
  },
}));
