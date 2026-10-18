import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HeartButton } from '@/components/heart-button';
import { Brand } from '@/constants/theme';
import { cardPriceLabel, type Listing } from '@/data/listings';

type Props = {
  listing: Listing;
  width: number;
};

export function ListingCard({ listing, width }: Props) {
  return (
    <Link href={{ pathname: '/listing/[id]', params: { id: listing.id } }} asChild>
      <Pressable style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
        <View style={[styles.photoWrap, { height: width * 0.95 }]}>
          <Image source={listing.images[0]} style={styles.photo} contentFit="cover" transition={250} />
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

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  photoWrap: {
    borderRadius: 20,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: Brand.surface,
  },
  photo: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.text,
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
    color: Brand.text,
  },
  meta: {
    marginTop: 2,
    fontSize: 14,
    color: Brand.textSecondary,
  },
});
