import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EmptyState, TabScreen } from '@/components/tab-screen';
import { Brand } from '@/constants/theme';
import { getListing, LISTINGS, placeOf, type Listing } from '@/data/listings';
import { useBooking, type Trip } from '@/hooks/use-booking';
import { fromKey } from '@/lib/dates';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TripsScreen() {
  const { trips } = useBooking();
  const upcoming = trips
    .map((trip) => ({ trip, listing: getListing(trip.listingId) }))
    .filter((t): t is { trip: Trip; listing: Listing } => Boolean(t.listing));

  if (upcoming.length === 0) {
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

  const city = placeOf(upcoming[0].listing).city;
  const nearby = LISTINGS.filter((l) => l.category !== 'homes');

  return (
    <TabScreen title="Trips">
      <Text style={styles.heading}>Upcoming reservations</Text>
      <View style={{ gap: 24 }}>
        {upcoming.map(({ trip, listing }, index) => (
          <Animated.View key={trip.id} entering={FadeInDown.delay(index * 80)}>
            <ReservationCard trip={trip} listing={listing} />
          </Animated.View>
        ))}
      </View>

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
  const { kind, place, city } = placeOf(listing);
  const [region, country] = place.split(', ');
  const start = fromKey(trip.checkIn);
  const end = trip.checkOut ? fromKey(trip.checkOut) : start;
  const sameMonth = start.getMonth() === end.getMonth();

  return (
    <Link href={{ pathname: '/listing/[id]', params: { id: listing.id } }} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.99 }] }]}>
        <View>
          <Image source={listing.images[0]} style={styles.cardImage} contentFit="cover" transition={200} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{trip.status === 'confirmed' ? 'Confirmed' : 'Pending'}</Text>
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

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: Brand.text,
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: Brand.background,
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
    backgroundColor: Brand.background,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
  },
  cardBody: {
    padding: 24,
  },
  city: {
    fontSize: 30,
    fontWeight: '600',
    color: Brand.text,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    marginTop: 6,
    fontSize: 16,
    color: Brand.text,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
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
    borderRightColor: Brand.border,
  },
  dateMonth: {
    fontSize: 20,
    color: Brand.text,
  },
  dateDays: {
    fontSize: 20,
    color: Brand.text,
    fontVariant: ['tabular-nums'],
  },
  dateYear: {
    fontSize: 15,
    color: Brand.text,
  },
  place: {
    fontSize: 19,
    color: Brand.text,
  },
  muted: {
    marginTop: 4,
    fontSize: 14,
    color: Brand.textSecondary,
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
    color: Brand.text,
  },
});
