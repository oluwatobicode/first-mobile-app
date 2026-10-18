import { UndoLeftIcon } from '@solar-icons/react-native/linear/undo-left';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SwipeCard, type SwipeCardHandle, type SwipeDirection } from '@/components/discover/swipe-card';
import { CloseIcon, HeartBoldIcon } from '@/components/icons';
import { Button, ScreenHeader } from '@/components/ui';
import { LISTINGS, type Listing } from '@/data/listings';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { useWishlist } from '@/hooks/use-wishlist';

type Swipe = { id: string; direction: SwipeDirection; savedHere: boolean };

/** Homes first, then experiences and services. */
const ORDERED = [...LISTINGS.filter((l) => l.category === 'homes'), ...LISTINGS.filter((l) => l.category !== 'homes')];

export default function DiscoverScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isSaved, toggle } = useWishlist();

  // Skip what's already in the wishlist.
  const [deck, setDeck] = useState(() => ORDERED.filter((l) => !isSaved(l.id)));
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<Swipe[]>([]);
  const [entering, setEntering] = useState<{ id: string; direction: SwipeDirection } | null>(null);
  const [round, setRound] = useState(0);

  const progress = useSharedValue(0);
  const topCard = useRef<SwipeCardHandle>(null);
  const busy = useRef(false);

  const current = deck[index];
  const next = deck[index + 1];
  const savedCount = history.filter((swipe) => swipe.savedHere).length;

  const onCommit = (direction: SwipeDirection) => {
    busy.current = true;
    if (Platform.OS === 'web') return;
    if (direction === 1) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onGone = (listing: Listing, direction: SwipeDirection) => {
    const savedHere = direction === 1 && !isSaved(listing.id);
    if (savedHere) toggle(listing.id);
    setHistory((h) => [...h, { id: listing.id, direction, savedHere }]);
    setEntering(null);
    setIndex((i) => i + 1);
    busy.current = false;
  };

  const swipe = (direction: SwipeDirection) => {
    if (busy.current) return;
    topCard.current?.swipe(direction);
  };

  const undo = () => {
    const last = history.at(-1);
    if (!last || busy.current || index === 0) return;
    if (last.savedHere && isSaved(last.id)) toggle(last.id);
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setHistory((h) => h.slice(0, -1));
    setEntering({ id: last.id, direction: last.direction });
    setIndex((i) => i - 1);
  };

  const startOver = () => {
    // If everything is saved already, show the whole catalog again.
    const fresh = ORDERED.filter((l) => !isSaved(l.id));
    setDeck(fresh.length > 0 ? fresh : ORDERED);
    setIndex(0);
    setHistory([]);
    setEntering(null);
    setRound((r) => r + 1);
    progress.set(0);
  };

  const open = (id: string) => router.push({ pathname: '/listing/[id]', params: { id } });

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Discover"
        leading="close"
        bordered={false}
        trailing={<Text style={styles.counter}>{savedCount} saved</Text>}
      />

      {current ? (
        <>
          <View style={styles.deck}>
            {[next, current].map((listing) => {
              if (!listing) return null;
              const isTop = listing.id === current.id;
              return (
                <SwipeCard
                  key={`${round}:${listing.id}`}
                  ref={isTop ? topCard : undefined}
                  listing={listing}
                  isTop={isTop}
                  progress={progress}
                  enterFrom={entering?.id === listing.id ? entering.direction : undefined}
                  onCommit={onCommit}
                  onGone={(direction) => onGone(listing, direction)}
                  onPress={() => open(listing.id)}
                />
              );
            })}
          </View>

          <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Pressable
              onPress={undo}
              disabled={history.length === 0}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Undo last swipe"
              style={({ pressed }) => [
                styles.round,
                styles.small,
                history.length === 0 && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <UndoLeftIcon size={22} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => swipe(-1)}
              accessibilityRole="button"
              accessibilityLabel="Skip"
              style={({ pressed }) => [styles.round, styles.large, pressed && styles.pressed]}>
              <CloseIcon size={30} color={colors.text} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={() => swipe(1)}
              accessibilityRole="button"
              accessibilityLabel="Save to wishlist"
              style={({ pressed }) => [styles.round, styles.large, styles.save, pressed && styles.pressed]}>
              <HeartBoldIcon size={30} color={colors.white} />
            </Pressable>
            {/* Mirrors the undo button so the two main buttons stay centered. */}
            <View style={styles.small} />
          </View>
        </>
      ) : (
        <View style={[styles.empty, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.emoji}>🏝️</Text>
          <Text style={styles.emptyTitle}>You’ve seen them all</Text>
          <Text style={styles.emptyBody}>
            {savedCount > 0
              ? `You saved ${savedCount} ${savedCount === 1 ? 'place' : 'places'} this round. They're waiting in your wishlist.`
              : 'Nothing caught your eye this time. Start over for another look.'}
          </Text>
          <View style={styles.emptyButtons}>
            <Button
              label="See wishlist"
              onPress={() => {
                router.dismissAll();
                router.navigate('/wishlists');
              }}
            />
            <Button label="Start over" tone="dark" onPress={startOver} />
          </View>
        </View>
      )}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  counter: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textSecondary,
  },
  deck: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  round: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: c.elevated,
    borderWidth: 0.5,
    borderColor: c.border,
    boxShadow: `0 4px 14px ${c.shadow}`,
  },
  small: {
    width: 48,
    height: 48,
  },
  large: {
    width: 68,
    height: 68,
  },
  save: {
    borderWidth: 0,
    backgroundColor: c.gradientSolid,
    experimental_backgroundImage: c.gradient,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 64,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '700',
    color: c.text,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    color: c.textSecondary,
    textAlign: 'center',
  },
  emptyButtons: {
    marginTop: 28,
    alignSelf: 'stretch',
    gap: 12,
  },
}));
