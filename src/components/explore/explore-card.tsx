import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTabBarSpace } from '@/components/glass-tab-bar';
import { HeartButton } from '@/components/heart-button';
import { Skeleton } from '@/components/skeleton';
import { cardPriceLabel, formatPrice, type Listing } from '@/data/listings';
import { createStyles } from '@/hooks/use-theme';

const VAT = 0.075;
const NIGHTS = 2;

/** "₦198,875 total": 2 nights of a home, including 7.5% VAT. Other categories keep their usual label. */
export function explorePriceLabel(listing: Listing, showTotal: boolean) {
  if (!showTotal || listing.category !== 'homes') return cardPriceLabel(listing);
  return `${formatPrice(listing.price * NIGHTS * (1 + VAT))} total`;
}

type Props = {
  listing: Listing;
  width: number;
  /** Show the all-in total instead of the "for 2 nights" price. */
  showTotal?: boolean;
  /** Smaller card for rows like "Recently viewed": no badge, tighter text. */
  compact?: boolean;
};

export function ExploreCard({ listing, width, showTotal = false, compact = false }: Props) {
  const tabBarSpace = useTabBarSpace();
  const styles = useStyles();
  const [loaded, setLoaded] = useState(false);
  return (
    <Link href={{ pathname: '/listing/[id]', params: { id: listing.id } }} asChild>
      <Pressable style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
        <View style={[styles.photoWrap, compact && styles.photoWrapCompact, { height: width * 0.95 }]}>
          {!loaded && <Skeleton style={StyleSheet.absoluteFill} />}
          <Image
            source={listing.images[0]}
            style={styles.photo}
            contentFit="cover"
            transition={250}
            onLoad={() => setLoaded(true)}
          />
          {listing.guestFavorite && !compact && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Guest favorite</Text>
            </View>
          )}
          <View style={[styles.heart, compact && styles.heartCompact]}>
            <HeartButton listingId={listing.id} size={compact ? 22 : 26} toastOffset={tabBarSpace} />
          </View>
        </View>

        <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={compact ? 1 : 2}>
          {listing.title}
        </Text>
        <Text style={[styles.meta, compact && styles.metaCompact]} numberOfLines={1}>
          {showTotal && listing.category === 'homes' ? (
            <Text style={styles.total}>{explorePriceLabel(listing, true)}</Text>
          ) : (
            explorePriceLabel(listing, false)
          )}{' '}
          · ★ {listing.rating.toFixed(2).replace(/0$/, '')}
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
  photoWrapCompact: {
    borderRadius: 14,
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
    boxShadow: `0 1px 4px ${c.shadow}`,
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
  heartCompact: {
    top: 8,
    right: 8,
  },
  title: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  titleCompact: {
    marginTop: 8,
    fontSize: 13,
  },
  meta: {
    marginTop: 2,
    fontSize: 14,
    color: c.textSecondary,
  },
  metaCompact: {
    fontSize: 12,
  },
  total: {
    color: c.text,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
}));
