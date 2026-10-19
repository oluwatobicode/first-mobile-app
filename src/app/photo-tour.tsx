import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui';
import { photoRoomsFor } from '@/data/details';
import { getListing, type Listing } from '@/data/listings';
import { createStyles } from '@/hooks/use-theme';

const SIDE = 24;
const GAP = 8;

/** Merges photo entries that share a room name, keeping first-seen order. */
function roomsOf(listing: Listing) {
  const rooms: { room: string; images: string[] }[] = [];
  for (const entry of photoRoomsFor(listing)) {
    const existing = rooms.find((r) => r.room === entry.room);
    if (existing) existing.images.push(...entry.images);
    else rooms.push({ room: entry.room, images: [...entry.images] });
  }
  return rooms;
}

export default function PhotoTourScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = getListing(id);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Photo tour" />
      {listing ? <Tour listing={listing} /> : <Text style={styles.empty}>Listing not found</Text>}
    </View>
  );
}

function Tour({ listing }: { listing: Listing }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const rooms = roomsOf(listing);
  const half = (width - SIDE * 2 - GAP) / 2;

  const openPhoto = (uri: string) =>
    router.push({ pathname: '/gallery', params: { id: listing.id, index: String(Math.max(0, listing.images.indexOf(uri))) } });
  const jumpTo = (room: string) => scrollRef.current?.scrollTo({ y: sectionY.current[room] ?? 0, animated: true });

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {rooms.map(({ room, images }) => (
          <Pressable
            key={room}
            onPress={() => jumpTo(room)}
            accessibilityRole="button"
            accessibilityLabel={`Jump to ${room}`}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
            <Image source={images[0]} style={styles.chipPhoto} contentFit="cover" transition={150} />
            <Text style={styles.chipLabel} numberOfLines={1}>
              {room}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {rooms.map(({ room, images }) => (
        <View
          key={room}
          style={styles.section}
          onLayout={(e) => {
            sectionY.current[room] = e.nativeEvent.layout.y - 12;
          }}>
          <Text style={styles.roomTitle}>{room}</Text>
          <View style={styles.grid}>
            {images.map((uri, i) => {
              // Airbnb's rhythm: a full-width photo, then a pair. A photo left without a partner goes full width too.
              const full = i % 3 === 0 || (i % 3 === 1 && i === images.length - 1);
              const size = full ? { width: width - SIDE * 2, height: (width - SIDE * 2) * 0.66 } : { width: half, height: half };
              return (
                <Pressable
                  key={uri + i}
                  onPress={() => openPhoto(uri)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`${room}, photo ${i + 1}`}>
                  <Image source={uri} style={[styles.photo, size]} contentFit="cover" transition={200} />
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  chips: {
    paddingHorizontal: SIDE,
    paddingVertical: 20,
    gap: 14,
  },
  chip: {
    width: 104,
  },
  chipPhoto: {
    width: 104,
    height: 76,
    borderRadius: 8,
    backgroundColor: c.surface,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: c.text,
    marginTop: 8,
  },
  section: {
    paddingHorizontal: SIDE,
    paddingTop: 20,
  },
  roomTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: c.text,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  photo: {
    borderRadius: 6,
    backgroundColor: c.surface,
  },
  empty: {
    fontSize: 16,
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
}));
