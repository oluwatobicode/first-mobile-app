import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HeartButton } from '@/components/heart-button';
import { Skeleton } from '@/components/skeleton';
import { cardPriceLabel, type Listing } from '@/data/listings';
import { createStyles } from '@/hooks/use-theme';

type Props = {
  listing: Listing;
  width: number;
};

export function ListingCard({ listing, width }: Props) {
  const styles = useStyles();
  const [loaded, setLoaded] = useState(false);
  return (
    <Link href={{ pathname: '/listing/[id]', params: { id: listing.id } }} asChild>
      <Pressable style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
        <View style={[styles.photoWrap, { height: width * 0.95 }]}>
          {!loaded && <Skeleton style={StyleSheet.absoluteFill} />}
          <Image
            source={listing.images[0]}
            style={styles.photo}
            contentFit="cover"
            transition={250}
            onLoad={() => setLoaded(true)}
          />
          {listing.guestFavorite && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Guest favorite</Text>
            </View>
          )}
          <View style={styles.heart}>
            <HeartButton listingId={listing.id} />
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {cardPriceLabel(listing)} · ★ {listing.rating.toFixed(2).replace(/0$/, '')}
        </Text>
      </Pressable>
    </Link>
  );
}

const useStyles = createStyles((c) => ({
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  photoWrap: {
    borderRadius: 20,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: c.surface,
  },
  photo: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: c.overlayButton,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.text,
  },
  heart: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  title: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  meta: {
    marginTop: 2,
    fontSize: 14,
    color: c.textSecondary,
  },
}));
