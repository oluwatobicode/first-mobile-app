import { BroomIcon } from '@solar-icons/react-native/linear/broom';
import { ChatRoundLineIcon } from '@solar-icons/react-native/linear/chat-round-line';
import { CheckCircleIcon } from '@solar-icons/react-native/linear/check-circle';
import { KeyIcon } from '@solar-icons/react-native/linear/key';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { MapPointIcon, StarBoldIcon, TagIcon, type SolarIcon } from '@/components/icons';
import { reviewsFor, type REVIEW_CATEGORIES, type Review } from '@/data/details';
import type { Listing } from '@/data/listings';
import { useReviews } from '@/hooks/use-reviews';
import { createStyles, useTheme } from '@/hooks/use-theme';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const CATEGORY_ICONS: Record<(typeof REVIEW_CATEGORIES)[number], SolarIcon> = {
  Cleanliness: BroomIcon,
  Accuracy: CheckCircleIcon,
  'Check-in': KeyIcon,
  Communication: ChatRoundLineIcon,
  Location: MapPointIcon,
  Value: TagIcon,
};

export type ShownReview = Review & { mine?: boolean };

/** Generated reviews with the guest's own reviews of this listing on top. */
export function useListingReviews(listing: Listing, count?: number) {
  const { reviewsForListing } = useReviews();
  const mine: ShownReview[] = reviewsForListing(listing.id).map((r) => {
    const date = new Date(r.createdAt);
    return {
      id: r.id,
      name: r.name,
      initial: r.name[0]?.toUpperCase() ?? '?',
      date: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
      rating: r.rating,
      text: r.text,
      yearsOnApp: 0,
      mine: true,
    };
  });
  const reviews: ShownReview[] = [...mine, ...reviewsFor(listing, count)];
  return { reviews, total: listing.reviews + mine.length };
}

export function Stars({ rating, size = 10 }: { rating: number; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 1 }} accessibilityLabel={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarBoldIcon key={n} size={size} color={n <= Math.round(rating) ? colors.text : colors.border} />
      ))}
    </View>
  );
}

/** One side of the "Guest favorite" laurel wreath. */
function Laurel({ height, flipped }: { height: number; flipped?: boolean }) {
  const { colors } = useTheme();
  const leaves = Array.from({ length: 7 }, (_, i) => {
    const angle = (112 + i * 22) * (Math.PI / 180);
    return { x: 40 + 32 * Math.cos(angle), y: 40 - 32 * Math.sin(angle), rotate: 155 - (112 + i * 22) };
  });
  return (
    <Svg width={height / 2} height={height} viewBox="0 0 40 80" style={flipped && { transform: [{ scaleX: -1 }] }}>
      <Path d="M29 70 A32 32 0 0 1 29 10" stroke={colors.text} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      {leaves.map((leaf, i) => (
        <Ellipse
          key={i}
          cx={leaf.x}
          cy={leaf.y}
          rx={3.4}
          ry={7.5}
          fill={colors.text}
          transform={`rotate(${leaf.rotate} ${leaf.x} ${leaf.y})`}
        />
      ))}
    </Svg>
  );
}

/** Airbnb's rating heading: laurels for guest favorites, "★ 4.97 · 214 reviews" otherwise. */
export function RatingHeading({ listing, total, compact }: { listing: Listing; total: number; compact?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  if (listing.guestFavorite) {
    return (
      <View style={styles.favorite}>
        <View style={styles.favoriteRow}>
          <Laurel height={compact ? 70 : 92} />
          <Text style={[styles.favoriteScore, compact && { fontSize: 52, lineHeight: 60 }]}>{listing.rating.toFixed(2)}</Text>
          <Laurel height={compact ? 70 : 92} flipped />
        </View>
        <Text style={styles.favoriteTitle}>Guest favorite</Text>
        <Text style={styles.favoriteText}>
          One of the most loved homes on Airbnb based on ratings, reviews and reliability
        </Text>
        <Text style={styles.favoriteCount}>{total} reviews</Text>
      </View>
    );
  }
  return (
    <View style={styles.headingRow}>
      <StarBoldIcon size={22} color={colors.text} />
      <Text style={styles.heading}>
        {listing.rating.toFixed(2)} · {total} reviews
      </Text>
    </View>
  );
}

export function RatingBars({ stars }: { stars: number[] }) {
  const styles = useStyles();
  return (
    <View style={{ gap: 4 }}>
      {stars.map((share, i) => (
        <View key={i} style={styles.barRow}>
          <Text style={styles.barLabel}>{5 - i}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(share * 100)}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

type CardProps = {
  review: ShownReview;
  /** `card` is the fixed-size tile in the listing carousel, `row` is a full-width list entry. */
  variant?: 'card' | 'row';
  onShowMore?: () => void;
  style?: StyleProp<ViewStyle>;
};

const LONG_REVIEW = 100;

export function ReviewCard({ review, variant = 'card', onShowMore, style }: CardProps) {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text.length > LONG_REVIEW;
  const showMore = () => (onShowMore ? onShowMore() : setExpanded(true));

  const person = (
    <View style={styles.person}>
      <View style={[styles.avatar, review.mine && styles.avatarMine]}>
        <Text style={[styles.avatarText, review.mine && styles.avatarTextMine]}>{review.initial}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {review.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {review.mine ? 'Your review' : `${review.yearsOnApp} ${review.yearsOnApp === 1 ? 'year' : 'years'} on Airbnb`}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[variant === 'card' ? styles.card : styles.row, style]}>
      {variant === 'row' && person}
      <View style={styles.starsRow}>
        <Stars rating={review.rating} />
        <Text style={styles.date}> · {review.date}</Text>
      </View>
      <Text style={styles.text} numberOfLines={expanded ? undefined : 3}>
        {review.text}
      </Text>
      {isLong && !expanded && (
        <Pressable onPress={showMore} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'flex-start' }}>
          <Text style={styles.more}>Show more</Text>
        </Pressable>
      )}
      {variant === 'card' && <View style={{ flex: 1 }} />}
      {variant === 'card' && person}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  favorite: {
    alignItems: 'center',
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  favoriteScore: {
    fontSize: 64,
    lineHeight: 72,
    fontWeight: '700',
    color: c.text,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  favoriteTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: c.text,
    marginTop: 4,
  },
  favoriteText: {
    fontSize: 15,
    lineHeight: 21,
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
  favoriteCount: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
    marginTop: 10,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: c.text,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    width: 10,
    fontSize: 12,
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.border,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: c.inverse,
  },
  card: {
    width: 300,
    minHeight: 220,
    padding: 20,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: c.border,
    backgroundColor: c.background,
    gap: 8,
  },
  row: {
    paddingVertical: 20,
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    color: c.text,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: c.text,
  },
  more: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
    textDecorationLine: 'underline',
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.inverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMine: {
    backgroundColor: c.primary,
  },
  avatarText: {
    color: c.onInverse,
    fontSize: 17,
    fontWeight: '700',
  },
  avatarTextMine: {
    color: c.white,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  sub: {
    fontSize: 13,
    color: c.textSecondary,
    marginTop: 1,
  },
}));
