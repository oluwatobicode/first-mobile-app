import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { FormView } from '@/components/form-view';
import { AddIcon, CheckIcon } from '@/components/icons';
import { ScreenHeader } from '@/components/ui';
import { WishlistCover } from '@/components/wishlist/collage';
import { coverImages, savedCount, useSavedToast } from '@/components/wishlist/helpers';
import { WishlistNameFields } from '@/components/wishlist/name-form';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { useWishlist, type Wishlist } from '@/hooks/use-wishlist';

const H_PADDING = 24;
const COLUMN_GAP = 16;

export default function SaveToWishlistSheet() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { id = '', offset } = useLocalSearchParams<{ id: string; offset?: string }>();
  const toastOffset = Number(offset) || 0;
  const { lists, listFor, saveTo, createList } = useWishlist();
  const showSaved = useSavedToast();
  const { width } = useWindowDimensions();
  // With no lists yet there is nothing to pick, so go straight to naming one.
  const [creating, setCreating] = useState(lists.length === 0);
  const current = listFor(id);
  const tile = (Math.min(width, 700) - H_PADDING * 2 - COLUMN_GAP) / 2;

  const done = (listName: string) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
    showSaved(id, listName, toastOffset);
  };

  const pick = (list: Wishlist) => {
    saveTo(id, list.id);
    done(list.name);
  };

  if (creating) {
    const canGoBack = lists.length > 0;
    return (
      <FormView>
        <ScreenHeader
          title="Create wishlist"
          leading={canGoBack ? 'back' : 'close'}
          onLeadingPress={canGoBack ? () => setCreating(false) : undefined}
          safeTop={false}
        />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <WishlistNameFields
            submitLabel="Create"
            onCancel={() => (canGoBack ? setCreating(false) : router.back())}
            onSubmit={(name) => {
              const list = createList(name, id);
              done(list.name);
            }}
          />
        </ScrollView>
      </FormView>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Save to wishlist" leading="close" safeTop={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onPress={() => setCreating(true)}
          style={({ pressed }) => [styles.createRow, pressed && styles.pressed]}
          accessibilityRole="button">
          <View style={styles.createTile}>
            <AddIcon size={30} color={colors.text} strokeWidth={2} />
          </View>
          <Text style={styles.createLabel}>Create new wishlist</Text>
        </Pressable>

        <View style={styles.grid}>
          {lists.map((list) => {
            const selected = current?.id === list.id;
            return (
              <Animated.View key={list.id} entering={FadeIn}>
                <Pressable
                  onPress={() => pick(list)}
                  style={({ pressed }) => [{ width: tile }, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${list.name}, ${savedCount(list.ids.length)}`}>
                  <View>
                    <WishlistCover images={coverImages(list.ids, 1)} size={tile} variant="single" radius={16} />
                    {selected && (
                      <View style={styles.check}>
                        <CheckIcon size={16} color={colors.white} strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.name} numberOfLines={1}>
                    {list.name}
                  </Text>
                  <Text style={styles.count}>{savedCount(list.ids.length)}</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    padding: H_PADDING,
    paddingBottom: 40,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  createTile: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: c.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: COLUMN_GAP,
    rowGap: 22,
  },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: c.white,
  },
  name: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  count: {
    marginTop: 2,
    fontSize: 14,
    color: c.textSecondary,
  },
}));
