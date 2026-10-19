import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { createStyles } from '@/hooks/use-theme';

type Destination = { name: string; subtitle: string; where: string };

const TABS = ['Popular', 'Beach', 'Culture', 'Outdoors'] as const;
type Tab = (typeof TABS)[number];

const DESTINATIONS: Record<Tab, Destination[]> = {
  Popular: [
    { name: 'Lekki', subtitle: 'Apartments', where: 'Lekki' },
    { name: 'Ikoyi', subtitle: 'Condos', where: 'Ikoyi' },
    { name: 'Victoria Island', subtitle: 'Studios', where: 'Victoria Island' },
    { name: 'Maitama', subtitle: 'Villas', where: 'Maitama' },
    { name: 'Wuse', subtitle: 'Flats', where: 'Wuse' },
    { name: 'Osu', subtitle: 'Guest rooms', where: 'Osu' },
  ],
  Beach: [
    { name: 'Labadi', subtitle: 'Beach houses', where: 'Labadi' },
    { name: 'Lekki', subtitle: 'Beachfront flats', where: 'Lekki' },
    { name: 'Elegushi', subtitle: 'Beach huts', where: 'Lagos' },
    { name: 'Tarkwa Bay', subtitle: 'Island stays', where: 'Lagos' },
    { name: 'Kokrobite', subtitle: 'Surf cabins', where: 'Accra' },
    { name: 'Badagry', subtitle: 'Coastal homes', where: 'Lagos' },
  ],
  Culture: [
    { name: 'Osu', subtitle: 'Art & nightlife', where: 'Osu' },
    { name: 'Ikoyi', subtitle: 'Galleries', where: 'Ikoyi' },
    { name: 'Asokoro', subtitle: 'Historic homes', where: 'Asokoro' },
    { name: 'Jamestown', subtitle: 'Old Accra', where: 'Accra' },
    { name: 'Victoria Island', subtitle: 'Live music', where: 'Victoria Island' },
    { name: 'Abuja', subtitle: 'Museums', where: 'Abuja' },
  ],
  Outdoors: [
    { name: 'Asokoro', subtitle: 'Garden homes', where: 'Asokoro' },
    { name: 'Maitama', subtitle: 'Hillside villas', where: 'Maitama' },
    { name: 'Obudu', subtitle: 'Mountain cabins', where: 'Obudu' },
    { name: 'Aburi', subtitle: 'Botanical retreats', where: 'Accra' },
    { name: 'Lekki', subtitle: 'Conservation trails', where: 'Lekki' },
    { name: 'Abuja', subtitle: 'Rock views', where: 'Abuja' },
  ],
};

/** "Inspiration for future getaways" footer: tap a place to search there. */
export function Inspiration({ onPick }: { onPick: (where: string) => void }) {
  const styles = useStyles();
  const [tab, setTab] = useState<Tab>('Popular');

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Inspiration for future getaways</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((t) => {
          const active = t === tab;
          return (
            <Pressable
              key={t}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setTab(t);
              }}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t}</Text>
              <View style={[styles.tabLine, active && styles.tabLineActive]} />
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.divider} />

      <Animated.View key={tab} entering={FadeIn.duration(220)} style={styles.grid}>
        {DESTINATIONS[tab].map((d) => (
          <Pressable
            key={`${d.name}-${d.subtitle}`}
            onPress={() => onPick(d.where)}
            style={({ pressed }) => [styles.cell, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel={`Search ${d.name}, ${d.subtitle}`}>
            <Text style={styles.name} numberOfLines={1}>
              {d.name}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {d.subtitle}
            </Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  wrap: {
    marginTop: 8,
    paddingTop: 28,
    paddingBottom: 12,
    backgroundColor: c.surface,
  },
  title: {
    paddingHorizontal: 24,
    fontSize: 21,
    fontWeight: '700',
    color: c.text,
    letterSpacing: -0.3,
  },
  tabs: {
    paddingHorizontal: 24,
    gap: 22,
    marginTop: 14,
  },
  tab: {
    alignItems: 'stretch',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: c.textSecondary,
    paddingBottom: 10,
  },
  tabTextActive: {
    color: c.text,
    fontWeight: '700',
  },
  tabLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  tabLineActive: {
    backgroundColor: c.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  cell: {
    width: '50%',
    paddingVertical: 12,
    paddingRight: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    color: c.textSecondary,
  },
}));
