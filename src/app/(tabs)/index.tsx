import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, ScrollView, Switch, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapIcon } from '@solar-icons/react-native/linear/map';
import { TuningIcon } from '@solar-icons/react-native/linear/tuning';

import { CATEGORY_STRIP_HEIGHT, CategoryStrip } from '@/components/explore/category-strip';
import { ExploreCard } from '@/components/explore/explore-card';
import { ExploreTabs, TABS_COLLAPSED_HEIGHT, TABS_EXPANDED_HEIGHT } from '@/components/explore/explore-tabs';
import { Inspiration } from '@/components/explore/inspiration';
import { useTripWhen } from '@/components/explore/trip-when';
import { useTabBarSpace } from '@/components/glass-tab-bar';
import { AltArrowRightIcon, HomeSmileBoldIcon, MagnifierIcon, TagIcon } from '@/components/icons';
import { ListingCardSkeleton } from '@/components/skeleton';
import { TextLink } from '@/components/ui';
import { CATEGORY_TAGS, tagsFor, type CategoryTag } from '@/data/details';
import { getListing, type Category, type Listing } from '@/data/listings';
import { useFilters } from '@/hooks/use-filters';
import { useSettings } from '@/hooks/use-settings';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { useWishlist } from '@/hooks/use-wishlist';

const PULL_DISTANCE = 80;

// Header geometry. Everything is a fixed height so the collapse can run purely on the UI thread.
const PILL_EXPANDED = 58;
const PILL_COLLAPSED = 48;
const COLLAPSE_DISTANCE = PILL_EXPANDED - PILL_COLLAPSED + (TABS_EXPANDED_HEIGHT - TABS_COLLAPSED_HEIGHT);
const RECENT_CARD = 132;

/** Stable pseudo-random order for a given seed, so "refresh" reshuffles the stays. */
function shuffled(listings: Listing[], seed: number) {
  if (seed === 0) return listings;
  const score = (id: string) => {
    let hash = seed;
    for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
    return hash;
  };
  return [...listings].sort((a, b) => score(a.id) - score(b.id));
}

function groupBySection(listings: Listing[]) {
  const sections = new Map<string, Listing[]>();
  for (const listing of listings) sections.set(listing.section, [...(sections.get(listing.section) ?? []), listing]);
  return [...sections.entries()].map(([title, data]) => ({ title, data }));
}

export default function ExploreScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const { width } = useWindowDimensions();
  const { filters, setFilters, apply, activeCount, clearFilters } = useFilters();
  const { recentlyViewed } = useWishlist();
  const { displayTotalPrice, setDisplayTotalPrice } = useSettings();
  const tripWhen = useTripWhen();
  const [category, setCategory] = useState<Category>('homes');
  const [tag, setTag] = useState<CategoryTag | null>(null);
  const [showFeesToast, setShowFeesToast] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seed, setSeed] = useState(0);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);
  const collapse = useSharedValue(0);
  const bounce = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowFeesToast(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const isHomes = category === 'homes';
  const activeTag = isHomes ? tag : null;
  const headerHeight = insets.top + 8 + PILL_EXPANDED + TABS_EXPANDED_HEIGHT + (isHomes ? CATEGORY_STRIP_HEIGHT : 0);
  const cardWidth = Math.min(width * 0.425, 260);
  const inCategory = apply(category);
  const tagged = activeTag ? inCategory.filter((l) => tagsFor(l).includes(activeTag)) : inCategory;
  const results = shuffled(tagged, seed);
  const sections = groupBySection(results);
  const recent = isHomes ? recentlyViewed.map(getListing).filter((l): l is Listing => Boolean(l)) : [];
  const tagLabel = CATEGORY_TAGS.find((t) => t.key === activeTag)?.label;
  const searchSummary = [
    filters.where,
    tripWhen,
    filters.guests ? `${filters.guests} guest${filters.guests > 1 ? 's' : ''}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  const onPickInspiration = (where: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setFilters({ where });
    scrollToTop();
  };

  const onToggleTotal = (on: boolean) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setDisplayTotalPrice(on);
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bounce.set(withRepeat(withSequence(withTiming(-14, { duration: 260 }), withSpring(0, { damping: 6 })), -1));
    setTimeout(() => {
      setSeed(Date.now() % 100000);
      setRefreshing(false);
      bounce.set(withTiming(0, { duration: 150 }));
    }, 1400);
  };

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
    collapse.set(interpolate(e.contentOffset.y, [0, COLLAPSE_DISTANCE], [0, 1], Extrapolation.CLAMP));
  });

  // The big search pill shrinks into a compact one as you scroll.
  const pillStyle = useAnimatedStyle(() => ({
    height: interpolate(collapse.value, [0, 1], [PILL_EXPANDED, PILL_COLLAPSED]),
    paddingHorizontal: interpolate(collapse.value, [0, 1], [20, 14]),
  }));
  const pillTextStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(collapse.value, [0, 1], [16, 14]),
  }));
  const pillIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(collapse.value, [0, 1], [1, 0.85]) }],
  }));

  // The house grows in as you pull down, and bounces while refreshing.
  const houseStyle = useAnimatedStyle(() => {
    const pull = Math.max(0, -scrollY.value);
    return {
      opacity: interpolate(pull, [10, PULL_DISTANCE * 0.7], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: bounce.value },
        { scale: interpolate(pull, [0, PULL_DISTANCE], [0.4, 1], Extrapolation.CLAMP) },
        { rotate: `${interpolate(pull, [0, PULL_DISTANCE * 1.5], [-20, 10], Extrapolation.CLAMP)}deg` },
      ],
    };
  });

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.searchRow}>
          <Pressable
            onPress={() => router.push('/search')}
            style={({ pressed }) => [{ flex: 1 }, pressed && { transform: [{ scale: 0.98 }] }]}
            accessibilityRole="search">
            <Animated.View style={[styles.searchPill, pillStyle]}>
              <Animated.View style={pillIconStyle}>
                <MagnifierIcon size={20} strokeWidth={2} />
              </Animated.View>
              <View style={{ flexShrink: 1 }}>
                <Animated.Text style={[styles.searchText, pillTextStyle]} numberOfLines={1}>
                  {searchSummary || 'Start your search'}
                </Animated.Text>
              </View>
            </Animated.View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/filters')}
            style={({ pressed }) => [styles.filterButton, pressed && { transform: [{ scale: 0.94 }] }]}
            accessibilityRole="button"
            accessibilityLabel={activeCount ? `Filters, ${activeCount} on` : 'Filters'}>
            <TuningIcon size={20} color={colors.text} strokeWidth={1.8} />
            {activeCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <ExploreTabs value={category} onChange={setCategory} progress={collapse} />
        {isHomes && <CategoryStrip value={tag} onChange={setTag} />}
      </View>

      <View style={{ flex: 1 }}>
        <Animated.View style={[styles.house, { top: headerHeight + 14 }, houseStyle]} pointerEvents="none">
          <HomeSmileBoldIcon size={36} color={colors.primary} />
        </Animated.View>

        <Animated.ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: headerHeight + 24, paddingBottom: tabBarSpace + 70 }}
          scrollIndicatorInsets={{ top: headerHeight }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="transparent"
              colors={[colors.primary]}
              progressViewOffset={headerHeight}
            />
          }>
          {activeCount > 0 && (
            <Animated.View entering={FadeIn} style={styles.resultsBar}>
              <Text style={styles.resultsText}>
                {results.length} {results.length === 1 ? 'stay' : 'stays'} match your filters
              </Text>
              <TextLink label="Clear" onPress={clearFilters} size={15} />
            </Animated.View>
          )}

          {activeCount === 0 && !refreshing && (
            <Pressable
              onPress={() => router.push('/discover')}
              style={({ pressed }) => [styles.discover, pressed && { transform: [{ scale: 0.98 }] }]}
              accessibilityRole="button">
              <Text style={styles.discoverEmoji}>🃏</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.discoverTitle}>Can’t decide?</Text>
                <Text style={styles.discoverBody}>Swipe through stays – right to save, left to skip.</Text>
              </View>
              <AltArrowRightIcon size={20} strokeWidth={2.2} />
            </Pressable>
          )}

          {isHomes && (
            <View style={styles.totalCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.totalTitle}>Display total price</Text>
                <Text style={styles.totalBody}>Includes all fees, before taxes</Text>
              </View>
              <Switch
                value={displayTotalPrice}
                onValueChange={onToggleTotal}
                trackColor={{ false: colors.border, true: colors.text }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.border}
                accessibilityLabel="Display total price"
              />
            </View>
          )}

          {recent.length > 0 && !refreshing && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recently viewed</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
                {recent.map((listing) => (
                  <ExploreCard key={listing.id} listing={listing} width={RECENT_CARD} showTotal={displayTotalPrice} compact />
                ))}
              </ScrollView>
            </View>
          )}

          {refreshing ? (
            [0, 1].map((row) => (
              <View key={row} style={styles.section}>
                <View style={[styles.sectionHeader, { height: 26 }]} />
                <View style={[styles.row, { flexDirection: 'row' }]}>
                  <ListingCardSkeleton width={cardWidth} />
                  <ListingCardSkeleton width={cardWidth} />
                </View>
              </View>
            ))
          ) : results.length === 0 && activeTag && inCategory.length > 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>{CATEGORY_TAGS.find((t) => t.key === activeTag)?.emoji}</Text>
              <Text style={styles.emptyTitle}>No {tagLabel?.toLowerCase()} here yet</Text>
              <Text style={styles.emptyBody}>Try another category, or see every home.</Text>
              <TextLink label="Show all homes" onPress={() => setTag(null)} />
            </View>
          ) : results.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No exact matches</Text>
              <Text style={styles.emptyBody}>Try changing or removing some of your filters.</Text>
              <TextLink label="Clear all filters" onPress={clearFilters} />
            </View>
          ) : (
            <Animated.View key={`${category}-${activeTag ?? 'all'}-${seed}`} entering={FadeInDown.duration(350)}>
              {sections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Pressable style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <AltArrowRightIcon size={20} strokeWidth={2.2} />
                  </Pressable>
                  <FlatList
                    horizontal
                    data={section.data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <ExploreCard listing={item} width={cardWidth} showTotal={displayTotalPrice} />}
                    contentContainerStyle={styles.row}
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={cardWidth + 14}
                    decelerationRate="fast"
                  />
                </View>
              ))}
            </Animated.View>
          )}

          {!refreshing && <Inspiration onPick={onPickInspiration} />}
        </Animated.ScrollView>
      </View>

      {showFeesToast && (
        <Animated.View
          entering={FadeIn.delay(600)}
          exiting={FadeOut}
          style={[styles.toast, { bottom: tabBarSpace + 64 }]}
          pointerEvents="none">
          <TagIcon size={20} color={colors.primary} strokeWidth={2} />
          <Text style={styles.toastText}>Prices include all fees</Text>
        </Animated.View>
      )}

      <Pressable
        onPress={() => router.push({ pathname: '/map', params: { category } })}
        style={({ pressed }) => [styles.mapButton, { bottom: tabBarSpace + 4 }, pressed && { transform: [{ scale: 0.95 }] }]}
        accessibilityRole="button"
        accessibilityLabel="Show map">
        <Text style={styles.mapText}>Map</Text>
        <MapIcon size={18} color={colors.onInverse} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: c.header,
    paddingHorizontal: 24,
    boxShadow: `0 2px 6px ${c.shadow}`,
    zIndex: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 999,
    backgroundColor: c.elevated,
    boxShadow: `0 3px 12px ${c.shadow}`,
  },
  searchText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: c.inverse,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: c.header,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: c.onInverse,
  },
  house: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
  },
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 20,
  },
  resultsText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  discover: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 24,
    marginBottom: 28,
    padding: 16,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: c.surface,
  },
  discoverEmoji: {
    fontSize: 30,
  },
  discoverTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
  },
  discoverBody: {
    marginTop: 2,
    fontSize: 14,
    color: c.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: c.text,
    letterSpacing: -0.3,
  },
  row: {
    paddingHorizontal: 24,
    gap: 14,
  },
  recentRow: {
    paddingHorizontal: 24,
    gap: 12,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.elevated,
  },
  totalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  totalBody: {
    marginTop: 2,
    fontSize: 13,
    color: c.textSecondary,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
  },
  emptyBody: {
    fontSize: 15,
    textAlign: 'center',
    color: c.textSecondary,
    marginBottom: 8,
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: c.elevated,
    boxShadow: `0 4px 16px ${c.shadow}`,
  },
  toastText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  mapButton: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 46,
    borderRadius: 23,
    backgroundColor: c.inverse,
    boxShadow: `0 6px 18px ${c.shadow}`,
  },
  mapText: {
    fontSize: 15,
    fontWeight: '700',
    color: c.onInverse,
  },
}));
