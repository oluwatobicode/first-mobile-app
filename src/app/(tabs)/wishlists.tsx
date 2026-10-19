import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarSpace } from '@/components/glass-tab-bar';
import { CloseIcon } from '@/components/icons';
import { EmptyState, TabScreen } from '@/components/tab-screen';
import { TextLink } from '@/components/ui';
import { WishlistCover } from '@/components/wishlist/collage';
import { coverImages, savedCount } from '@/components/wishlist/helpers';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { useWishlist, type Wishlist } from '@/hooks/use-wishlist';

const H_PADDING = 24;
const COLUMN_GAP = 16;

export default function WishlistsScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const { width } = useWindowDimensions();
  const { lists, recentlyViewed, deleteList } = useWishlist();
  const [editMode, setEditMode] = useState(false);
  // Leaving edit mode is implied once there's nothing left to delete.
  const editing = editMode && lists.length > 0;
  const tile = (Math.min(width, 800) - H_PADDING * 2 - COLUMN_GAP) / 2;

  if (lists.length === 0 && recentlyViewed.length === 0) {
    return (
      <TabScreen title="Wishlists">
        <EmptyState
          emoji="💖"
          heading="Create your first wishlist"
          body="As you explore, tap the heart icon to save your favorite homes and experiences here."
          action={{ label: 'Start exploring', onPress: () => router.navigate('/') }}
        />
      </TabScreen>
    );
  }

  const confirmDelete = (list: Wishlist) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Delete this wishlist?', `“${list.name}” will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteList(list.id) },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: tabBarSpace + 16, paddingHorizontal: H_PADDING }}>
      <View style={styles.topRow}>
        {lists.length > 0 && <TextLink label={editing ? 'Done' : 'Edit'} onPress={() => setEditMode(!editing)} />}
      </View>
      <Text style={styles.title}>Wishlists</Text>

      <View style={styles.grid}>
        {recentlyViewed.length > 0 && (
          <Animated.View layout={LinearTransition} style={editing && styles.dimmed}>
            <Tile
              width={tile}
              name="Recently viewed"
              subtitle={recentlyViewed.length === 1 ? '1 stay' : `${recentlyViewed.length} stays`}
              images={coverImages(recentlyViewed)}
              disabled={editing}
              onPress={() => router.push({ pathname: '/wishlist/[listId]', params: { listId: 'recent' } })}
            />
          </Animated.View>
        )}
        {lists.map((list) => (
          <Animated.View key={list.id} entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
            <Tile
              width={tile}
              name={list.name}
              subtitle={savedCount(list.ids.length)}
              images={coverImages(list.ids)}
              disabled={editing}
              onPress={() => router.push({ pathname: '/wishlist/[listId]', params: { listId: list.id } })}
            />
            {editing && <DeleteBadge name={list.name} onPress={() => confirmDelete(list)} />}
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

type TileProps = {
  width: number;
  name: string;
  subtitle: string;
  images: string[];
  disabled?: boolean;
  onPress: () => void;
};

function Tile({ width, name, subtitle, images, disabled, onPress }: TileProps) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${subtitle}`}>
      <View style={styles.cover}>
        <WishlistCover images={images} size={width} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function DeleteBadge({ name, onPress }: { name: string; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Animated.View entering={ZoomIn.springify().damping(14)} exiting={ZoomOut.duration(150)} style={styles.badge}>
      <Pressable
        onPress={onPress}
        hitSlop={10}
        style={styles.badgeButton}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${name}`}>
        <CloseIcon size={16} color={colors.text} strokeWidth={2.5} />
      </Pressable>
    </Animated.View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  topRow: {
    height: 28,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -0.6,
    marginTop: 4,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: COLUMN_GAP,
    rowGap: 26,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  dimmed: {
    opacity: 0.4,
  },
  cover: {
    borderRadius: 20,
    borderCurve: 'continuous',
    boxShadow: `0 2px 10px ${c.shadow}`,
  },
  name: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    color: c.textSecondary,
  },
  badge: {
    position: 'absolute',
    top: -8,
    left: -8,
  },
  badgeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: c.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: c.border,
    boxShadow: `0 2px 8px ${c.shadow}`,
  },
}));
