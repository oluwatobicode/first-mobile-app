import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EmptyState, TabScreen } from '@/components/tab-screen';
import { CancelledTripRow, PastTripRow, ReviewPromptCard } from '@/components/trips/trip-rows';
import { statusLabel, withListings } from '@/components/trips/trip-utils';
import { LISTINGS, placeOf, type Listing } from '@/data/listings';
import { useBooking, type Trip } from '@/hooks/use-booking';
import { useReviews } from '@/hooks/use-reviews';
import { fromKey } from '@/lib/dates';
import { createStyles } from '@/hooks/use-theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TripsScreen() {
  const styles = useStyles();
  const { trips } = useBooking();
  const { reviewForTrip } = useReviews();
  const all = withListings(trips);

  if (all.length === 0) {
    return (
      <TabScreen title="Trips">
        <EmptyState
          emoji="🧳"
          heading="No trips booked… yet!"
          body="Time to dust off your bags and start planning your next adventure."
          action={{ label: 'Start searching', onPress: () => router.push('/search') }}
        />
      </TabScreen>
    );
  }

  const upcoming = all.filter(({ trip }) => trip.status !== 'cancelled' && !trip.completed);
  const past = all.filter(({ trip }) => trip.status !== 'cancelled' && trip.completed);
  const cancelled = all.filter(({ trip }) => trip.status === 'cancelled');
  const toReview = past.find(({ trip }) => !reviewForTrip(trip.id));

  const city = placeOf((upcoming[0] ?? all[0]).listing).city;
  const nearby = LISTINGS.filter((l) => l.category !== 'homes');

  return (
    <TabScreen title="Trips">
      {toReview && (
        <Animated.View entering={FadeInDown}>
          <ReviewPromptCard item={toReview} />
        </Animated.View>
      )}

      {upcoming.length > 0 ? (
        <>
          <Text style={styles.heading}>Upcoming reservations</Text>
          <View style={{ gap: 24 }}>
            {upcoming.map(({ trip, listing }, index) => (
              <Animated.View key={trip.id} entering={FadeInDown.delay(index * 80)}>
                <ReservationCard trip={trip} listing={listing} />
              </Animated.View>
            ))}
          </View>
        </>
      ) : (
        <EmptyState
          emoji="🧳"
          heading="No upcoming trips"
          body="Your next adventure is waiting. Find a place and book it in a few taps."
          action={{ label: 'Start searching', onPress: () => router.push('/search') }}
        />
      )}

      {past.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.heading}>Where you’ve been</Text>
          {past.map((item) => (
            <PastTripRow key={item.trip.id} item={item} review={reviewForTrip(item.trip.id)} />
          ))}
        </View>
      )}

      {cancelled.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.heading}>Cancelled</Text>
          {cancelled.map((item) => (
            <CancelledTripRow key={item.trip.id} item={item} />
          ))}
        </View>
      )}

      <Text style={[styles.heading, { marginTop: 40 }]}>Explore things to do near {city}</Text>
      <FlatList
        horizontal
        data={nearby}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -24 }}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/listing/[id]', params: { id: item.id } }} asChild>
            <Pressable style={styles.nearby}>
              <Image source={item.images[0]} style={styles.nearbyImage} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.nearbyTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.muted}>{item.details.split(' · ')[0]}</Text>
              </View>
            </Pressable>
          </Link>
        )}
      />
    </TabScreen>
  );
}

function ReservationCard({ trip, listing }: { trip: Trip; listing: Listing }) {
  const styles = useStyles();
  const { kind, place, city } = placeOf(listing);
  const [region, country] = place.split(', ');
  const start = fromKey(trip.checkIn);
  const end = trip.checkOut ? fromKey(trip.checkOut) : start;
  const sameMonth = start.getMonth() === end.getMonth();

  return (
    <Link href={{ pathname: '/trip/[tripId]', params: { tripId: trip.id } }} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.99 }] }]}>
        <View>
          <Image source={listing.images[0]} style={styles.cardImage} contentFit="cover" transition={200} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{statusLabel(trip)}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.city}>{city}</Text>
          <Text style={styles.cardSubtitle}>
            {kind} hosted by {listing.host.name}
          </Text>
          <View style={styles.rule} />
          <View style={styles.cardFooter}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateMonth}>{MONTHS[start.getMonth()]}</Text>
              <Text style={styles.dateDays}>
                {start.getDate()}
                {trip.checkOut ? ` – ${sameMonth ? '' : `${MONTHS[end.getMonth()]} `}${end.getDate()}` : ''}
              </Text>
              <Text style={styles.dateYear}>{start.getFullYear()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.place}>{region}</Text>
              <Text style={styles.muted}>{country}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const useStyles = createStyles((c) => ({
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: c.text,
    marginBottom: 20,
  },
  section: {
    marginTop: 40,
  },
  card: {
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: c.elevated,
    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  cardImage: {
    height: 200,
  },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: c.background,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  cardBody: {
    padding: 24,
  },
  city: {
    fontSize: 30,
    fontWeight: '600',
    color: c.text,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    marginTop: 6,
    fontSize: 16,
    color: c.text,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
    marginVertical: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  dateBlock: {
    paddingRight: 20,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: c.border,
  },
  dateMonth: {
    fontSize: 20,
    color: c.text,
  },
  dateDays: {
    fontSize: 20,
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  dateYear: {
    fontSize: 15,
    color: c.text,
  },
  place: {
    fontSize: 19,
    color: c.text,
  },
  muted: {
    marginTop: 4,
    fontSize: 14,
    color: c.textSecondary,
  },
  nearby: {
    width: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nearbyImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  nearbyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
}));
