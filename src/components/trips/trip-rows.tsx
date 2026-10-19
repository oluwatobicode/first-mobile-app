import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StarBoldIcon } from '@/components/icons';
import { StarRow } from '@/components/trips/stars';
import type { TripWithListing } from '@/components/trips/trip-utils';
import { formatPrice, placeOf } from '@/data/listings';
import type { Trip } from '@/hooks/use-booking';
import type { GuestReview } from '@/hooks/use-reviews';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { formatRange } from '@/lib/dates';

const openTrip = (trip: Trip) => router.push({ pathname: '/trip/[tripId]', params: { tripId: trip.id } });
const openReview = (trip: Trip, rating?: number) =>
  router.push({ pathname: '/review', params: rating ? { tripId: trip.id, rating: String(rating) } : { tripId: trip.id } });

const datesOf = (trip: Trip) => `${formatRange(trip.checkIn, trip.checkOut)}, ${trip.checkIn.slice(0, 4)}`;

/** "How was your stay?" prompt for the most recent unreviewed stay. */
export function ReviewPromptCard({ item }: { item: TripWithListing }) {
  const styles = useStyles();
  const { trip, listing } = item;
  return (
    <View style={styles.prompt}>
      <View style={styles.promptTop}>
        <Image source={listing.images[0]} style={styles.promptImage} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <Text style={styles.promptTitle}>How was your stay at {listing.title}?</Text>
          <Text style={styles.muted}>Hosted by {listing.host.name} · {datesOf(trip)}</Text>
        </View>
      </View>
      <View style={styles.promptStars}>
        <StarRow value={0} size={34} gap={14} label="Rate your stay" onChange={(rating) => openReview(trip, rating)} />
      </View>
    </View>
  );
}

export function PastTripRow({ item, review }: { item: TripWithListing; review?: GuestReview }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { trip, listing } = item;
  return (
    <Pressable
      onPress={() => openTrip(trip)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${placeOf(listing).city}, ${datesOf(trip)}`}>
      <Image source={listing.images[0]} style={styles.rowImage} contentFit="cover" />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowTitle}>{placeOf(listing).city}</Text>
        <Text style={styles.muted} numberOfLines={1}>
          Hosted by {listing.host.name}
        </Text>
        <Text style={styles.muted}>{datesOf(trip)}</Text>
        {review ? (
          <View style={styles.ratingRow}>
            <StarBoldIcon size={13} color={colors.text} />
            <Text style={styles.ratingText}>You rated {review.rating}.0</Text>
          </View>
        ) : (
          <Pressable onPress={() => openReview(trip)} hitSlop={8} accessibilityRole="link" style={{ alignSelf: 'flex-start' }}>
            <Text style={styles.reviewLink}>Write a review</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export function CancelledTripRow({ item }: { item: TripWithListing }) {
  const styles = useStyles();
  const { trip, listing } = item;
  return (
    <Pressable
      onPress={() => openTrip(trip)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Cancelled trip to ${placeOf(listing).city}`}>
      <Image source={listing.images[0]} style={[styles.rowImage, styles.greyed]} contentFit="cover" />
      <View style={[{ flex: 1, gap: 2 }, styles.greyed]}>
        <Text style={styles.rowTitle}>{placeOf(listing).city}</Text>
        <Text style={styles.muted}>{datesOf(trip)}</Text>
        <Text style={styles.muted}>Cancelled · {formatPrice(trip.refund ?? 0)} refunded</Text>
      </View>
    </Pressable>
  );
}

const useStyles = createStyles((c) => ({
  prompt: {
    padding: 20,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: c.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    boxShadow: `0 6px 20px ${c.shadow}`,
    marginBottom: 36,
  },
  promptTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  promptImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 23,
    color: c.text,
  },
  promptStars: {
    marginTop: 20,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  rowImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: c.surface,
  },
  greyed: {
    opacity: 0.5,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  muted: {
    fontSize: 14,
    color: c.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
  reviewLink: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: c.primary,
  },
}));
