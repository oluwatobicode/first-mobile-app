import { Image } from 'expo-image';
import { Alert, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarSpace } from '@/components/glass-tab-bar';
import { hostListings } from '@/components/host/data';
import { AddIcon, StarBoldIcon } from '@/components/icons';
import { formatPrice, placeOf } from '@/data/listings';
import { createStyles, useTheme } from '@/hooks/use-theme';

export default function HostListingsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const listings = hostListings();

  return (
    <View style={styles.screen}>
      <Animated.ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: tabBarSpace + 16, paddingHorizontal: 24 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Your listings</Text>
          <Pressable
            onPress={() => Alert.alert('Coming soon', 'Creating a new listing isn’t part of this demo yet.')}
            style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.7 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add a listing">
            <AddIcon size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={{ gap: 28 }}>
          {listings.map((listing, i) => (
            <Animated.View key={listing.id} entering={FadeInDown.delay(i * 80).springify().damping(18)}>
              <Pressable
                style={({ pressed }) => pressed && { transform: [{ scale: 0.99 }] }}
                onPress={() => Alert.alert(listing.title, 'Editing listings is coming soon.')}
                accessibilityRole="button">
                <View>
                  <Image source={listing.images[0]} style={styles.image} contentFit="cover" transition={200} />
                  <View style={styles.status}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Listed</Text>
                  </View>
                </View>
                <View style={styles.meta}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listingTitle} numberOfLines={1}>
                      {listing.title}
                    </Text>
                    <Text style={styles.listingCity}>{placeOf(listing).place}</Text>
                  </View>
                  <View style={styles.rating}>
                    <StarBoldIcon size={13} color={colors.text} />
                    <Text style={styles.ratingText}>{listing.rating.toFixed(2)}</Text>
                  </View>
                </View>
                <Text style={styles.price}>
                  {formatPrice(listing.price)} <Text style={styles.priceNote}>night · {listing.reviews} reviews</Text>
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -0.6,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
  },
  image: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: 16,
    backgroundColor: c.surface,
  },
  status: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: c.overlayButton,
    boxShadow: `0 2px 8px ${c.shadow}`,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#008A05',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: c.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 12,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  listingCity: {
    marginTop: 2,
    fontSize: 14,
    color: c.textSecondary,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: c.text,
  },
  price: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  priceNote: {
    fontWeight: '400',
    color: c.textSecondary,
  },
}));
