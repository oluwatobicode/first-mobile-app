import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryTabs } from '@/components/category-tabs';
import { AltArrowRightIcon, MagnifierIcon, TagIcon } from '@/components/icons';
import { ListingCard } from '@/components/listing-card';
import { Brand } from '@/constants/theme';
import { sectionsFor, type Category } from '@/data/listings';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState<Category>('homes');
  const [showFeesToast, setShowFeesToast] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowFeesToast(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const cardWidth = Math.min(width * 0.425, 260);
  const sections = sectionsFor(category);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.push('/search')}
          style={({ pressed }) => [styles.searchPill, pressed && { transform: [{ scale: 0.98 }] }]}>
          <MagnifierIcon size={20} strokeWidth={2} />
          <Text style={styles.searchText}>Start your search</Text>
        </Pressable>

        <CategoryTabs value={category} onChange={setCategory} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: 28, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <Animated.View key={category} entering={FadeInDown.duration(350)}>
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
                renderItem={({ item }) => <ListingCard listing={item} width={cardWidth} />}
                contentContainerStyle={styles.row}
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardWidth + 14}
                decelerationRate="fast"
              />
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {showFeesToast && (
        <Animated.View
          entering={FadeIn.delay(600)}
          exiting={FadeOut}
          style={[styles.toast, { bottom: 24 }]}
          pointerEvents="none">
          <TagIcon size={20} color={Brand.primary} strokeWidth={2} />
          <Text style={styles.toastText}>Prices include all fees</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  header: {
    backgroundColor: '#FBFBFB',
    paddingHorizontal: 24,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    zIndex: 1,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 58,
    borderRadius: 999,
    backgroundColor: Brand.background,
    boxShadow: '0 3px 12px rgba(0,0,0,0.12)',
  },
  searchText: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.text,
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
    color: Brand.text,
    letterSpacing: -0.3,
  },
  row: {
    paddingHorizontal: 24,
    gap: 14,
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
    backgroundColor: Brand.background,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  },
  toastText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
  },
});
