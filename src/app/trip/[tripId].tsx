import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BillListIcon } from '@solar-icons/react-native/linear/bill-list';
import { KeyIcon } from '@solar-icons/react-native/linear/key';

import {
  AltArrowDownIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon,
  ChatRoundDotsIcon,
  HomeIcon,
  MapPointIcon,
  StarIcon,
  WiFiIcon,
  type SolarIcon,
} from '@/components/icons';
import { statusLabel } from '@/components/trips/trip-utils';
import { ScreenHeader } from '@/components/ui';
import { hostDetailsFor, neighbourhoodFor, rulesFor } from '@/data/details';
import { getListing, placeOf, type Listing } from '@/data/listings';
import { useBooking, type Trip } from '@/hooks/use-booking';
import { useReviews } from '@/hooks/use-reviews';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { formatDay, formatLong, toKey } from '@/lib/dates';

const GATE_CODE = '4821';

export default function TripDetailScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { trips } = useBooking();
  const trip = trips.find((t) => t.id === tripId);
  const listing = trip ? getListing(trip.listingId) : undefined;
  if (!trip || !listing) return <ScreenHeader title="Trip not found" />;
  return <TripDetail trip={trip} listing={listing} />;
}

/** "Apartment in Lekki Phase 1" → "Lekki Phase 1" */
function neighbourhoodName(listing: Listing) {
  return listing.title.split(' in ')[1] ?? '';
}

function wifiFor(listing: Listing) {
  return { network: `${listing.host.name}'s Place 5G`, password: `${listing.host.name.toLowerCase()}${String(listing.price).slice(0, 4)}` };
}

function openDirections(listing: Listing) {
  const { latitude: lat, longitude: lng } = listing.coords;
  const label = encodeURIComponent(listing.title);
  const url = Platform.select({
    ios: `https://maps.apple.com/?ll=${lat},${lng}&q=${label}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  });
  Linking.openURL(url).catch(() => {});
}

function TripDetail({ trip, listing }: { trip: Trip; listing: Listing }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { completeTrip } = useBooking();
  const { reviewForTrip } = useReviews();
  const toast = useToast();
  const [rulesOpen, setRulesOpen] = useState(false);

  const rules = rulesFor(listing);
  const host = hostDetailsFor(listing);
  const wifi = wifiFor(listing);
  const { place } = placeOf(listing);
  const area = neighbourhoodName(listing);
  const address = area && !place.startsWith(area) ? `${area}, ${place}` : place;

  const cancelled = trip.status === 'cancelled';
  const confirmed = trip.status === 'confirmed';
  const active = !cancelled && !trip.completed;
  const reviewed = Boolean(reviewForTrip(trip.id));
  const checkOut = trip.checkOut ?? trip.checkIn;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View>
          <Image source={listing.images[0]} style={[styles.hero, cancelled && styles.heroCancelled]} contentFit="cover" transition={200} />
          <View style={[styles.badge, cancelled && styles.badgeCancelled]}>
            <Text style={[styles.badgeText, cancelled && styles.badgeTextCancelled]}>{statusLabel(trip)}</Text>
          </View>
        </View>

        <Animated.View entering={FadeIn.duration(250)} style={styles.card}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.subtitle}>
            {placeOf(listing).kind} hosted by {listing.host.name}
          </Text>

          <View style={styles.dates}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Check-in</Text>
              <Text style={styles.dateValue}>{formatDay(trip.checkIn)}</Text>
              <Text style={styles.dateTime}>{rules.checkIn}</Text>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Checkout</Text>
              <Text style={styles.dateValue}>{formatDay(checkOut)}</Text>
              <Text style={styles.dateTime}>{rules.checkOut}</Text>
            </View>
          </View>

          {cancelled && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                You cancelled this reservation{trip.cancelledAt ? ` on ${formatLong(toKey(new Date(trip.cancelledAt)))}` : ''}.
              </Text>
            </View>
          )}

          {trip.completed && !cancelled && !reviewed && (
            <Section Icon={StarIcon} title="Write a review" subtitle={`Tell future guests about ${listing.host.name}'s place`} onPress={() => router.push({ pathname: '/review', params: { tripId: trip.id } })} />
          )}

          <Section Icon={MapPointIcon} title="Getting there" subtitle={address}>
            <Text style={styles.body}>{neighbourhoodFor(listing)}</Text>
            <Pressable onPress={() => openDirections(listing)} hitSlop={8} accessibilityRole="link" style={styles.inlineLink}>
              <Text style={styles.link}>Get directions</Text>
            </Pressable>
          </Section>

          {active && (
            <Section Icon={KeyIcon} title="Check-in method" subtitle="Self check-in with a smart lock">
              {confirmed ? (
                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>Gate code</Text>
                  <Text style={styles.code}>{GATE_CODE}</Text>
                </View>
              ) : (
                <Text style={styles.body}>Your gate code appears here once {listing.host.name} confirms the reservation.</Text>
              )}
            </Section>
          )}

          {active && (
            <Section Icon={WiFiIcon} title="Wifi">
              <View style={styles.kv}>
                <Text style={styles.kvKey}>Network</Text>
                <Text style={styles.kvValue} selectable>
                  {wifi.network}
                </Text>
              </View>
              <View style={styles.kv}>
                <Text style={styles.kvKey}>Password</Text>
                <Text style={styles.kvValue} selectable>
                  {wifi.password}
                </Text>
              </View>
            </Section>
          )}

          <Section
            Icon={HomeIcon}
            title="House rules"
            subtitle={`Check-in after ${rules.checkIn} · Checkout before ${rules.checkOut}`}
            expanded={rulesOpen}
            onPress={() => setRulesOpen((open) => !open)}>
            {rulesOpen && (
              <View style={{ gap: 6 }}>
                <Text style={styles.body}>{rules.maxGuests} guests maximum</Text>
                <Text style={styles.body}>{rules.pets ? 'Pets allowed' : 'No pets'}</Text>
                <Text style={styles.body}>No smoking · No parties or events</Text>
                <Text style={styles.body}>Quiet hours {rules.quietHours}</Text>
              </View>
            )}
          </Section>

          <Section
            Icon={ChatRoundDotsIcon}
            title="Message your host"
            subtitle={`${listing.host.name} typically responds ${host.responseTime}`}
            onPress={() => router.push({ pathname: '/chat/[tripId]', params: { tripId: trip.id } })}
          />
          <Section Icon={HomeIcon} title="Show listing" subtitle={listing.title} onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })} />
          <Section Icon={BillListIcon} title="Get receipt" onPress={() => router.push({ pathname: '/receipt', params: { tripId: trip.id } })} last />

          {active && (
            <Pressable
              onPress={() => router.push({ pathname: '/cancel-trip', params: { tripId: trip.id } })}
              style={({ pressed }) => [styles.cancelButton, pressed && { transform: [{ scale: 0.98 }] }]}
              accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel reservation</Text>
            </Pressable>
          )}

          {active && (
            <Pressable
              onPress={() => {
                completeTrip(trip.id);
                toast.show({ message: 'Trip marked as completed – you can review it now' });
              }}
              style={styles.demo}
              hitSlop={8}
              accessibilityRole="button">
              <Text style={styles.demoText}>Demo: mark trip as completed</Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>

      <Pressable
        onPress={() => router.back()}
        style={[styles.back, { top: insets.top + 8 }]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back">
        <AltArrowLeftIcon size={20} color={colors.text} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

type SectionProps = {
  Icon: SolarIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  expanded?: boolean;
  last?: boolean;
  children?: ReactNode;
};

function Section({ Icon, title, subtitle, onPress, expanded, last, children }: SectionProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const Chevron = expanded ? AltArrowDownIcon : AltArrowRightIcon;
  const header = (
    <View style={styles.sectionHeader}>
      <Icon size={26} color={colors.text} />
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {onPress && <Chevron size={20} color={colors.textSecondary} />}
    </View>
  );
  return (
    <View style={[styles.section, last && styles.sectionLast]}>
      {onPress ? (
        <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.6 }} accessibilityRole="button" accessibilityState={expanded === undefined ? undefined : { expanded }}>
          {header}
        </Pressable>
      ) : (
        header
      )}
      {children && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  hero: {
    height: 320,
    backgroundColor: c.surface,
  },
  heroCancelled: {
    opacity: 0.6,
  },
  back: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.overlayButton,
    boxShadow: `0 2px 8px ${c.shadow}`,
  },
  badge: {
    position: 'absolute',
    left: 16,
    bottom: 44,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: c.background,
  },
  badgeCancelled: {
    backgroundColor: c.errorBg,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  badgeTextCancelled: {
    color: c.error,
  },
  card: {
    marginTop: -28,
    paddingHorizontal: 24,
    paddingTop: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: c.background,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: c.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: c.textSecondary,
  },
  dates: {
    flexDirection: 'row',
    marginTop: 24,
    paddingVertical: 20,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.inputBorder,
  },
  dateCol: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 4,
  },
  dateDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
  },
  dateValue: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
  },
  dateTime: {
    fontSize: 15,
    color: c.text,
  },
  notice: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: c.errorBg,
  },
  noticeText: {
    fontSize: 15,
    color: c.error,
    fontWeight: '600',
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  sectionLast: {
    borderBottomWidth: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: c.text,
  },
  sectionSubtitle: {
    marginTop: 3,
    fontSize: 14,
    color: c.textSecondary,
  },
  sectionBody: {
    marginTop: 14,
    marginLeft: 42,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: c.text,
  },
  inlineLink: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
    textDecorationLine: 'underline',
  },
  codeBox: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: c.surface,
  },
  codeLabel: {
    fontSize: 12,
    color: c.textSecondary,
  },
  code: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 6,
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  kvKey: {
    fontSize: 15,
    color: c.textSecondary,
  },
  kvValue: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  cancelButton: {
    marginTop: 16,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: c.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.error,
  },
  demo: {
    marginTop: 24,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: c.inputBorder,
  },
  demoText: {
    fontSize: 13,
    color: c.textSecondary,
  },
}));
