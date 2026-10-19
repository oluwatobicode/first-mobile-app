import { ClipboardListIcon } from '@solar-icons/react-native/linear/clipboard-list';
import { ShieldCheckIcon } from '@solar-icons/react-native/linear/shield-check';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { HeartButton } from '@/components/heart-button';
import {
  AltArrowLeftIcon,
  AltArrowRightIcon,
  BathIcon,
  BedIcon,
  BoltIcon,
  CalendarMarkIcon,
  CarIcon,
  ChefHatIcon,
  ClockCircleIcon,
  LeafIcon,
  MedalRibbonIcon,
  StarBoldIcon,
  StarIcon,
  UploadIcon,
  UsersGroupRoundedIcon,
  WaterIcon,
  WiFiIcon,
  type SolarIcon,
} from '@/components/icons';
import { amenityCount, highlightAmenities } from '@/components/listing/amenity-catalog';
import { HostCard } from '@/components/listing/host-card';
import { LocationMap } from '@/components/listing/location-map';
import { OutlineButton } from '@/components/listing/outline-button';
import { CATEGORY_ICONS, RatingBars, RatingHeading, ReviewCard, useListingReviews } from '@/components/listing/reviews';
import { Button, FooterBar, TextLink } from '@/components/ui';
import { bedroomsFor, neighbourhoodFor, ratingBreakdown, rulesFor, SAFETY } from '@/data/details';
import { formatPrice, getListing, placeOf, type Listing } from '@/data/listings';
import { isNightly, quoteFor, useBooking } from '@/hooks/use-booking';
import { addDays, formatRange, formatLong } from '@/lib/dates';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { useWishlist } from '@/hooks/use-wishlist';

const HEADER_BAR = 56;
const REVIEW_CARD = 300;
const GAP = 12;

const FEATURE_ICONS: [RegExp, SolarIcon][] = [
  [/bed/i, BedIcon],
  [/bath/i, BathIcon],
  [/wifi/i, WiFiIcon],
  [/pool|ocean|beach/i, WaterIcon],
  [/guest/i, UsersGroupRoundedIcon],
  [/hour|minute/i, ClockCircleIcon],
  [/power|generator/i, BoltIcon],
  [/parking/i, CarIcon],
  [/breakfast|drinks|groceries|kitchen|oils/i, ChefHatIcon],
  [/garden|hammock|street|balcony/i, LeafIcon],
];

function featureIcon(label: string) {
  return FEATURE_ICONS.find(([pattern]) => pattern.test(label))?.[1] ?? StarIcon;
}

export default function ListingScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = getListing(id);

  if (!listing) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.title}>Listing not found</Text>
        <TextLink label="Go back" onPress={() => router.back()} />
      </View>
    );
  }

  return <ListingDetails listing={listing} />;
}

function ListingDetails({ listing }: { listing: Listing }) {
  const styles = useStyles();
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [pastPhotos, setPastPhotos] = useState(false);
  const [areaExpanded, setAreaExpanded] = useState(false);
  const { draftFor, trips } = useBooking();
  const { markViewed } = useWishlist();
  const { reviews, total } = useListingReviews(listing);

  const draft = draftFor(listing.id);
  const quote = quoteFor(draft);
  const { kind, place } = placeOf(listing);
  const nightly = isNightly(listing);
  const photoHeight = width * 0.8;
  const breakdown = ratingBreakdown(listing);
  const rules = rulesFor(listing);
  const amenities = highlightAmenities(listing);
  const isHome = listing.category === 'homes';

  // markViewed changes identity on every provider render, so it must not be an effect dependency.
  const recordView = useEffectEvent(() => markViewed(listing.id));
  useEffect(() => {
    recordView();
  }, [listing.id]);

  // The header bar finishes fading in exactly when the photos slide under it.
  const scrollY = useSharedValue(0);
  const threshold = photoHeight - insets.top - HEADER_BAR;
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  useAnimatedReaction(
    () => scrollY.value > threshold,
    (past, previous) => {
      if (past !== previous) scheduleOnRN(setPastPhotos, past);
    }
  );
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [threshold - 80, threshold], [0, 1], Extrapolation.CLAMP),
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [threshold, threshold + 40], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [threshold, threshold + 40], [6, 0], Extrapolation.CLAMP) }],
  }));

  const openDates = () => router.push({ pathname: '/dates', params: { id: listing.id } });
  const reserve = () => (quote ? router.push({ pathname: '/booking', params: { id: listing.id } }) : openDates());
  const openReviews = () => router.push({ pathname: '/reviews', params: { id: listing.id } });
  const openInfo = (section: 'rules' | 'safety' | 'cancellation') =>
    router.push({ pathname: '/listing-info', params: { id: listing.id, section } });

  const messageHost = () => {
    const forListing = trips.filter((t) => t.listingId === listing.id);
    const trip = forListing.find((t) => t.status !== 'cancelled') ?? forListing[0];
    if (trip) {
      router.push({ pathname: '/chat/[tripId]', params: { tripId: trip.id } });
      return;
    }
    Alert.alert(`Book first to message ${listing.host.name}`, `Once you request a booking, you can chat with ${listing.host.name} right here.`, [
      { text: 'Not now', style: 'cancel' },
      { text: nightly ? 'Choose dates' : 'Reserve', onPress: reserve },
    ]);
  };

  const cancellationSummary = draft.checkIn
    ? `Free cancellation before ${formatLong(addDays(draft.checkIn, -7))}`
    : 'Free cancellation up to 7 days before check-in';

  return (
    <View style={styles.screen}>
      <StatusBar style={pastPhotos ? (scheme === 'dark' ? 'light' : 'dark') : 'light'} />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <View style={{ height: photoHeight }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {listing.images.map((uri, i) => (
              <Pressable
                key={uri}
                accessibilityRole="imagebutton"
                accessibilityLabel={`Open photo ${i + 1} of ${listing.images.length}`}
                onPress={() => router.push({ pathname: '/gallery', params: { id: listing.id, index: String(i) } })}>
                <Image source={uri} style={{ width, height: photoHeight }} contentFit="cover" transition={200} />
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.counter, pressed && { transform: [{ scale: 0.95 }] }]}
            onPress={() => router.push({ pathname: '/photo-tour', params: { id: listing.id } })}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Show all photos">
            <Text style={styles.counterText}>
              {photoIndex + 1} / {listing.images.length}
            </Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{listing.title}</Text>

          <View style={styles.metaRow}>
            <StarBoldIcon size={16} color={colors.text} />
            <Text style={styles.meta}>{listing.rating.toFixed(2)} · </Text>
            <Pressable onPress={openReviews} hitSlop={6}>
              <Text style={[styles.meta, styles.underline]}>{total} reviews</Text>
            </Pressable>
            {listing.host.superhost && (
              <>
                <Text style={styles.meta}> · </Text>
                <MedalRibbonIcon size={16} />
                <Text style={styles.meta}> Superhost</Text>
              </>
            )}
          </View>
          <Text style={styles.meta}>{place}</Text>

          <View style={styles.rule} />

          <View style={styles.hostRow}>
            <Text style={styles.hostTitle}>
              {kind} {nightly ? 'hosted' : 'led'} by {listing.host.name}
            </Text>
            <View>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{listing.host.name.split(' ').pop()?.[0]}</Text>
              </View>
              {listing.host.superhost && (
                <View style={styles.superhostBadge}>
                  <MedalRibbonIcon size={12} color={colors.white} strokeWidth={2} />
                </View>
              )}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail} style={styles.bleed}>
            {listing.details.split(' · ').map((label) => {
              const Icon = featureIcon(label);
              return (
                <View key={label} style={styles.feature}>
                  <Icon size={30} />
                  <Text style={styles.featureText}>{label}</Text>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.rule} />

          <Text style={styles.sectionTitle}>About this {nightly ? 'place' : 'experience'}</Text>
          <Text style={styles.paragraph}>
            Bright, cozy and close to everything you need. Perfect for a weekend away with friends or a quiet work
            trip. Check-in is self-service, and {listing.host.name} usually replies within an hour.
          </Text>

          {isHome && (
            <>
              <View style={styles.rule} />
              <Text style={styles.sectionTitle}>Where you’ll sleep</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail} style={styles.bleed}>
                {bedroomsFor(listing).map((room, i) => (
                  <View key={room.name + i} style={styles.room}>
                    <Image source={listing.images[i % listing.images.length]} style={styles.roomPhoto} contentFit="cover" transition={200} />
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomBeds}>{room.beds}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {nightly && (
            <>
              <View style={styles.rule} />
              <Text style={styles.sectionTitle}>What this place offers</Text>
              {amenities.map(({ Icon, label }) => (
                <View key={label} style={styles.amenity}>
                  <Icon size={26} />
                  <Text style={styles.paragraph}>{label}</Text>
                </View>
              ))}
              <OutlineButton
                label={`Show all ${amenityCount(listing)} amenities`}
                onPress={() => router.push({ pathname: '/amenities', params: { id: listing.id } })}
                style={styles.sectionButton}
              />
            </>
          )}

          <View style={styles.rule} />

          <RatingHeading listing={listing} total={total} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scores} style={styles.bleed}>
            <View style={[styles.score, { width: 130 }]}>
              <Text style={styles.scoreLabel}>Overall rating</Text>
              <RatingBars stars={breakdown.stars} />
            </View>
            {breakdown.scores.map(({ label, score }) => {
              const Icon = CATEGORY_ICONS[label];
              return (
                <View key={label} style={styles.score}>
                  <Text style={styles.scoreLabel}>{label}</Text>
                  <Text style={styles.scoreValue}>{score.toFixed(1)}</Text>
                  <View style={styles.scoreIcon}>
                    <Icon size={28} />
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <FlatList
            data={reviews}
            keyExtractor={(r) => r.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={REVIEW_CARD + GAP}
            decelerationRate="fast"
            style={styles.bleed}
            contentContainerStyle={styles.rail}
            renderItem={({ item }) => <ReviewCard review={item} onShowMore={openReviews} style={{ width: REVIEW_CARD }} />}
          />
          <OutlineButton label={`Show all ${total} reviews`} onPress={openReviews} style={styles.sectionButton} />

          <View style={styles.rule} />

          <Text style={styles.sectionTitle}>Where you’ll be</Text>
          <LocationMap listing={listing} />
          <Text style={styles.placeName}>{place}</Text>
          <Text style={styles.paragraph} numberOfLines={areaExpanded ? undefined : 2}>
            {neighbourhoodFor(listing)}
          </Text>
          {!areaExpanded && (
            <View style={styles.moreLink}>
              <TextLink label="Show more" onPress={() => setAreaExpanded(true)} />
            </View>
          )}

          <View style={styles.rule} />

          <Text style={styles.sectionTitle}>Meet your host</Text>
          <HostCard listing={listing} onMessage={messageHost} />

          <View style={styles.rule} />

          <Text style={styles.sectionTitle}>Things to know</Text>
          <InfoRow
            Icon={ClipboardListIcon}
            title="House rules"
            summary={`Check-in after ${rules.checkIn} · ${rules.maxGuests} guests maximum`}
            onPress={() => openInfo('rules')}
          />
          <InfoRow Icon={ShieldCheckIcon} title="Safety & property" summary={SAFETY.slice(0, 2).join(' · ')} onPress={() => openInfo('safety')} />
          <InfoRow Icon={CalendarMarkIcon} title="Cancellation policy" summary={cancellationSummary} onPress={() => openInfo('cancellation')} />
        </View>
      </Animated.ScrollView>

      <View style={[styles.header, { height: insets.top + HEADER_BAR, paddingTop: insets.top }]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.headerBar, barStyle]} />
        <View style={styles.headerRow}>
          <RoundButton label="Go back" onPress={() => router.back()} scrollY={scrollY} threshold={threshold}>
            <AltArrowLeftIcon size={22} strokeWidth={2} />
          </RoundButton>
          <Animated.Text style={[styles.headerTitle, titleStyle]} numberOfLines={1}>
            {listing.title}
          </Animated.Text>
          <View style={styles.headerRight}>
            <RoundButton
              label="Share"
              scrollY={scrollY}
              threshold={threshold}
              onPress={() => Share.share({ message: `Check out "${listing.title}" – ${formatPrice(listing.price)} ${listing.priceNote}` })}>
              <UploadIcon size={22} strokeWidth={2} />
            </RoundButton>
            <RoundButton scrollY={scrollY} threshold={threshold}>
              <HeartButton listingId={listing.id} size={22} variant="plain" toastOffset={90} />
            </RoundButton>
          </View>
        </View>
      </View>

      <FooterBar>
        <View style={{ flex: 1 }}>
          {quote ? (
            <>
              <Text style={styles.price}>{formatPrice(quote.subtotal)}</Text>
              <Text style={styles.priceNote}>Total before taxes</Text>
            </>
          ) : (
            <Text style={styles.priceNote}>
              <Text style={styles.price}>{formatPrice(listing.price)}</Text> {listing.priceNote}
            </Text>
          )}
          <View style={{ marginTop: 4, alignSelf: 'flex-start' }}>
            <TextLink
              label={draft.checkIn ? formatRange(draft.checkIn, draft.checkOut) : 'Add dates'}
              onPress={openDates}
              size={15}
            />
          </View>
        </View>
        <Button label="Reserve" onPress={reserve} style={{ minWidth: 150 }} />
      </FooterBar>
    </View>
  );
}

type RoundButtonProps = {
  children: ReactNode;
  scrollY: SharedValue<number>;
  threshold: number;
  /** Without it the child handles the press itself (the heart). */
  onPress?: () => void;
  label?: string;
};

/** Floating circle over the photo that melts into a plain icon once the header bar is in. */
function RoundButton({ children, onPress, label, scrollY, threshold }: RoundButtonProps) {
  const styles = useStyles();
  const circleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [threshold - 80, threshold], [1, 0], Extrapolation.CLAMP),
  }));
  const circle = <Animated.View style={[StyleSheet.absoluteFill, styles.roundCircle, circleStyle]} />;

  if (!onPress) {
    return (
      <View style={styles.roundButton}>
        {circle}
        {children}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.roundButton, pressed && { transform: [{ scale: 0.92 }] }]}>
      {circle}
      {children}
    </Pressable>
  );
}

function InfoRow({ Icon, title, summary, onPress }: { Icon: SolarIcon; title: string; summary: string; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.infoRow, pressed && { opacity: 0.6 }]}>
      <Icon size={26} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoSummary} numberOfLines={1}>
          {summary}
        </Text>
      </View>
      <AltArrowRightIcon size={20} color={colors.text} />
    </Pressable>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  counter: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(34,34,34,0.75)',
  },
  counterText: {
    color: c.white,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  body: {
    paddingTop: 28,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: c.text,
    letterSpacing: -0.6,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  meta: {
    fontSize: 15,
    lineHeight: 22,
    color: c.text,
  },
  underline: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
    marginVertical: 28,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  hostTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    color: c.text,
    letterSpacing: -0.3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: c.inverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: c.onInverse,
    fontSize: 22,
    fontWeight: '700',
  },
  superhostBadge: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: c.primary,
    borderWidth: 2,
    borderColor: c.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bleed: {
    marginTop: 20,
    marginHorizontal: -24,
  },
  rail: {
    paddingHorizontal: 24,
    gap: GAP,
  },
  feature: {
    width: 128,
    height: 128,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    justifyContent: 'space-between',
  },
  featureText: {
    fontSize: 15,
    lineHeight: 20,
    color: c.text,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: c.text,
    marginBottom: 12,
  },
  sectionButton: {
    marginTop: 24,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: c.text,
  },
  room: {
    width: 220,
  },
  roomPhoto: {
    width: 220,
    height: 150,
    borderRadius: 12,
    backgroundColor: c.surface,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
    marginTop: 10,
  },
  roomBeds: {
    fontSize: 14,
    color: c.textSecondary,
    marginTop: 2,
  },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  scores: {
    paddingHorizontal: 24,
  },
  score: {
    width: 110,
    paddingRight: 16,
    marginRight: 16,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: c.border,
    gap: 6,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  scoreIcon: {
    marginTop: 16,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
    marginTop: 20,
    marginBottom: 8,
  },
  moreLink: {
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  infoSummary: {
    fontSize: 14,
    color: c.textSecondary,
    marginTop: 2,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Transparent over the photo, so swipes and taps between the buttons reach the pager.
    pointerEvents: 'box-none',
  },
  headerBar: {
    backgroundColor: c.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
  },
  headerTitle: {
    position: 'absolute',
    left: 116,
    right: 116,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  roundButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundCircle: {
    borderRadius: 21,
    backgroundColor: c.overlayButton,
    boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
  },
  priceNote: {
    fontSize: 16,
    color: c.text,
  },
}));
