import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { type LatLng, type Region } from 'react-native-maps';
import Animated, { FadeOutDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeartButton } from '@/components/heart-button';
import { CloseIcon, StarBoldIcon } from '@/components/icons';
import { PricePin } from '@/components/map/price-pin';
import { TextLink } from '@/components/ui';
import { cardPriceLabel, type Category, type Listing } from '@/data/listings';
import { useFilters } from '@/hooks/use-filters';
import { createStyles, useTheme } from '@/hooks/use-theme';

const CATEGORIES: Category[] = ['homes', 'experiences', 'services'];

type City = 'All' | 'Lagos' | 'Abuja' | 'Accra';

const CITY_REGIONS: Record<Exclude<City, 'All'>, Region> = {
  Lagos: { latitude: 6.49, longitude: 3.42, latitudeDelta: 0.28, longitudeDelta: 0.28 },
  Abuja: { latitude: 9.06, longitude: 7.49, latitudeDelta: 0.14, longitudeDelta: 0.14 },
  Accra: { latitude: 5.565, longitude: -0.17, latitudeDelta: 0.1, longitudeDelta: 0.1 },
};

const CITIES: City[] = ['All', 'Lagos', 'Abuja', 'Accra'];

// West Africa, for when nothing matches the filters.
const FALLBACK_REGION: Region = { latitude: 7.4, longitude: 3.6, latitudeDelta: 6, longitudeDelta: 9 };

/** A region that roughly covers every pin, so the first frame is already close to the fitted view. */
function regionFor(coords: LatLng[]): Region {
  if (coords.length === 0) return FALLBACK_REGION;
  const lats = coords.map((c) => c.latitude);
  const lngs = coords.map((c) => c.longitude);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.05),
    longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.05),
  };
}

export default function MapScreen() {
  const styles = useStyles();
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const category = CATEGORIES.find((c) => c === categoryParam) ?? 'homes';
  const { apply, clearFilters } = useFilters();
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [city, setCity] = useState<City>('All');

  const listings = apply(category);
  const coords = listings.map((l) => l.coords);
  // Derived, so a pin that gets filtered out can't leave a stale card behind.
  const selected = listings.find((l) => l.id === selectedId) ?? null;
  const visibleKey = listings.map((l) => l.id).join(',');

  const edgePadding = { top: insets.top + 120, right: 48, bottom: insets.bottom + 200, left: 48 };

  const fitAll = (animated: boolean) => {
    if (coords.length === 0) return;
    mapRef.current?.fitToCoordinates(coords, { edgePadding, animated });
  };

  // Refit whenever the set of visible pins changes (and once the map is ready to measure).
  useEffect(() => {
    if (mapReady) fitAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, visibleKey]);

  const selectCity = (next: City) => {
    setCity(next);
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (next === 'All') fitAll(true);
    else mapRef.current?.animateToRegion(CITY_REGIONS[next], 450);
  };

  const selectPin = (listing: Listing) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSelectedId(listing.id);
  };

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={regionFor(coords)}
        userInterfaceStyle={scheme}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        onMapReady={() => setMapReady(true)}
        onPress={(e) => {
          // On iOS a marker tap also reaches the map; only a tap on empty map deselects.
          if (e.nativeEvent.action !== 'marker-press') setSelectedId(null);
        }}>
        {listings.map((listing) => {
          const isSelected = listing.id === selected?.id;
          return (
            // Keyed on selection: with tracksViewChanges off, Android only redraws a pin when it remounts.
            <PricePin
              key={`${listing.id}:${isSelected}`}
              listing={listing}
              selected={isSelected}
              onPress={() => selectPin(listing)}
            />
          );
        })}
      </MapView>

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.roundButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close map">
          <CloseIcon size={20} color={colors.text} strokeWidth={2} />
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsScroll}>
          {CITIES.map((name) => {
            const active = name === city;
            return (
              <Pressable
                key={name}
                onPress={() => selectCity(name)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {listings.length === 0 && (
        <View style={styles.emptyWrap} pointerEvents="box-none">
          <View style={styles.emptyPill}>
            <Text style={styles.emptyText}>No stays match your filters</Text>
            <TextLink label="Clear filters" onPress={clearFilters} size={15} />
          </View>
        </View>
      )}

      {selected && (
        <Animated.View
          key={selected.id}
          entering={SlideInDown.springify().damping(18)}
          exiting={FadeOutDown.duration(180)}
          style={[styles.cardWrap, { bottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={() => router.push({ pathname: '/listing/[id]', params: { id: selected.id } })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Open ${selected.title}`}>
            <Image source={selected.images[0]} style={styles.photo} contentFit="cover" transition={200} />
            <View style={styles.cardBody}>
              <Text style={styles.title} numberOfLines={2}>
                {selected.title}
              </Text>
              <View style={styles.ratingRow}>
                <StarBoldIcon size={13} color={colors.text} />
                <Text style={styles.rating}>
                  {selected.rating.toFixed(2)} ({selected.reviews})
                </Text>
              </View>
              <Text style={styles.price} numberOfLines={1}>
                {cardPriceLabel(selected)}
              </Text>
            </View>
            <View style={styles.heart}>
              <HeartButton listingId={selected.id} size={22} variant="plain" toastOffset={170} />
            </View>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: c.overlayButton,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 2px 8px ${c.shadow}`,
  },
  chipsScroll: {
    flexGrow: 1,
    // Keeps the chip shadows from being clipped by the scroll view.
    overflow: 'visible',
  },
  chips: {
    gap: 8,
    paddingRight: 16,
    paddingVertical: 6,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: c.overlayButton,
    boxShadow: `0 2px 8px ${c.shadow}`,
  },
  chipActive: {
    backgroundColor: c.inverse,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
  chipTextActive: {
    color: c.onInverse,
  },
  emptyWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPill: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: c.elevated,
    boxShadow: `0 4px 16px ${c.shadow}`,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  cardWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 20,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: c.elevated,
    boxShadow: `0 4px 16px ${c.shadow}`,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  photo: {
    width: 120,
    height: 120,
    backgroundColor: c.surface,
  },
  cardBody: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 44,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 13,
    color: c.textSecondary,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
  heart: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
}));
