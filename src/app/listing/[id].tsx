import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeartButton } from '@/components/heart-button';
import {
  AltArrowLeftIcon,
  BathIcon,
  BedIcon,
  BoltIcon,
  CarIcon,
  ChefHatIcon,
  ClockCircleIcon,
  LeafIcon,
  MedalRibbonIcon,
  SnowflakeIcon,
  StarBoldIcon,
  StarIcon,
  UploadIcon,
  UsersGroupRoundedIcon,
  WaterIcon,
  WiFiIcon,
  type SolarIcon,
} from '@/components/icons';
import { Button, FooterBar, TextLink } from '@/components/ui';
import { Brand } from '@/constants/theme';
import { formatPrice, getListing, placeOf, type Listing } from '@/data/listings';
import { isNightly, quoteFor, useBooking } from '@/hooks/use-booking';
import { formatRange } from '@/lib/dates';

const AMENITIES: { Icon: SolarIcon; label: string }[] = [
  { Icon: WiFiIcon, label: 'Fast wifi – 120 Mbps' },
  { Icon: BoltIcon, label: '24/7 power backup' },
  { Icon: SnowflakeIcon, label: 'Air conditioning' },
  { Icon: ChefHatIcon, label: 'Kitchen' },
  { Icon: CarIcon, label: 'Free parking on premises' },
];

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
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [photoIndex, setPhotoIndex] = useState(0);
  const { draftFor } = useBooking();

  const draft = draftFor(listing.id);
  const quote = quoteFor(draft);
  const { kind, place } = placeOf(listing);
  const nightly = isNightly(listing);
  const photoHeight = width * 0.8;

  const openDates = () => router.push({ pathname: '/dates', params: { id: listing.id } });
  const reserve = () => (quote ? router.push({ pathname: '/booking', params: { id: listing.id } }) : openDates());

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: photoHeight }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {listing.images.map((uri) => (
              <Image key={uri} source={uri} style={{ width, height: photoHeight }} contentFit="cover" transition={200} />
            ))}
          </ScrollView>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {photoIndex + 1} / {listing.images.length}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{listing.title}</Text>

          <View style={styles.metaRow}>
            <StarBoldIcon size={16} color={Brand.text} />
            <Text style={styles.meta}>{listing.rating.toFixed(2)} · </Text>
            <Text style={[styles.meta, styles.underline]}>{listing.reviews} reviews</Text>
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
                  <MedalRibbonIcon size={12} color="#FFFFFF" strokeWidth={2} />
                </View>
              )}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.features} style={styles.featuresScroll}>
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

          {nightly && (
            <>
              <View style={styles.rule} />
              <Text style={styles.sectionTitle}>What this place offers</Text>
              {AMENITIES.map(({ Icon, label }) => (
                <View key={label} style={styles.amenity}>
                  <Icon size={26} />
                  <Text style={styles.paragraph}>{label}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.topButtons, { top: insets.top + 8 }]}>
        <RoundButton label="Go back" onPress={() => router.back()}>
          <AltArrowLeftIcon size={22} strokeWidth={2} />
        </RoundButton>
        <View style={styles.topRight}>
          <RoundButton
            label="Share"
            onPress={() => Share.share({ message: `Check out "${listing.title}" – ${formatPrice(listing.price)} ${listing.priceNote}` })}>
            <UploadIcon size={22} strokeWidth={2} />
          </RoundButton>
          <View style={styles.roundButton}>
            <HeartButton listingId={listing.id} size={22} variant="plain" />
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

function RoundButton({ children, onPress, label }: { children: ReactNode; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.roundButton, pressed && { transform: [{ scale: 0.92 }] }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.background,
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
    color: '#FFFFFF',
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
    color: Brand.text,
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
    color: Brand.text,
  },
  underline: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
    marginVertical: 24,
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
    color: Brand.text,
    letterSpacing: -0.3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
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
    backgroundColor: Brand.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresScroll: {
    marginTop: 20,
    marginHorizontal: -24,
  },
  features: {
    paddingHorizontal: 24,
    gap: 12,
  },
  feature: {
    width: 128,
    height: 128,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.border,
    justifyContent: 'space-between',
  },
  featureText: {
    fontSize: 15,
    lineHeight: 20,
    color: Brand.text,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Brand.text,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: Brand.text,
  },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  topButtons: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topRight: {
    flexDirection: 'row',
    gap: 12,
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.text,
  },
  priceNote: {
    fontSize: 16,
    color: Brand.text,
  },
});
