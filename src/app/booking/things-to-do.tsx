import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { HeartButton } from '@/components/heart-button';
import { StarBoldIcon } from '@/components/icons';
import { Button, FooterBar, ScreenHeader, TextLink } from '@/components/ui';
import { formatPrice, getListing, LISTINGS, placeOf } from '@/data/listings';
import { useBooking } from '@/hooks/use-booking';
import { createStyles, useTheme } from '@/hooks/use-theme';

export default function ThingsToDoScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { trips } = useBooking();
  const { width } = useWindowDimensions();
  const trip = trips.find((t) => t.id === tripId);
  const listing = trip && getListing(trip.listingId);
  const city = listing ? placeOf(listing).city : 'Lagos';

  // Prefer activities in the same city, then fill in with the rest.
  const activities = LISTINGS.filter((l) => l.category !== 'homes' && l.id !== listing?.id).sort(
    (a, b) => Number(placeOf(b).city === city) - Number(placeOf(a).city === city)
  );
  const cardWidth = (width - 24 * 2 - 16) / 2;
  const leaveTo = (href: '/trips' | '/') => {
    router.dismissAll();
    router.navigate(href);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader bordered={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Looking for things to do in {city}?</Text>
        <Text style={styles.body}>
          Here are some hosted events and activities happening during your trip. Check out unique tours, cooking classes,
          and more.
        </Text>

        <View style={styles.grid}>
          {activities.map((item, index) => (
            <Animated.View key={item.id} entering={FadeInDown.delay(index * 60)} style={{ width: cardWidth }}>
              <Link href={{ pathname: '/listing/[id]', params: { id: item.id } }} asChild>
                <Pressable>
                  <View style={[styles.photo, { height: cardWidth * 1.33 }]}>
                    <Image source={item.images[0]} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                    <View style={styles.heart}>
                      <HeartButton listingId={item.id} toastOffset={90} />
                    </View>
                  </View>
                  <View style={styles.rating}>
                    <StarBoldIcon size={14} color={colors.text} />
                    <Text style={styles.small}>
                      {item.rating.toFixed(1)} <Text style={styles.muted}>({item.reviews})</Text>
                    </Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.small}>
                    <Text style={styles.bold}>From {formatPrice(item.price)}</Text> / {item.priceNote.replace('per ', '')}
                  </Text>
                </Pressable>
              </Link>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
      <FooterBar>
        <TextLink label="Not now" onPress={() => leaveTo('/trips')} size={17} />
        <Button label="See more" tone="dark" onPress={() => leaveTo('/')} style={{ minWidth: 150 }} />
      </FooterBar>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    padding: 24,
    paddingTop: 8,
    gap: 18,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: c.text,
    letterSpacing: -0.6,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
    color: c.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    rowGap: 28,
    marginTop: 12,
  },
  photo: {
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: c.surface,
  },
  heart: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  cardTitle: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 21,
    color: c.text,
  },
  small: {
    marginTop: 4,
    fontSize: 15,
    color: c.text,
  },
  muted: {
    color: c.textSecondary,
  },
  bold: {
    fontWeight: '700',
  },
}));
