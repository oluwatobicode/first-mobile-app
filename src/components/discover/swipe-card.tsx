import { Image } from 'expo-image';
import { useEffect, useImperativeHandle, type Ref } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { cardPriceLabel, placeOf, type Listing } from '@/data/listings';
import { createStyles } from '@/hooks/use-theme';

/** 1 = right (save), -1 = left (skip). */
export type SwipeDirection = 1 | -1;

export type SwipeCardHandle = {
  swipe: (direction: SwipeDirection) => void;
};

type Props = {
  listing: Listing;
  /** Only the top card is interactive; the one behind peeks out, scaled down. */
  isTop: boolean;
  /** How far the top card has travelled (0 → 1). Written by the top card, read by the one behind. */
  progress: SharedValue<number>;
  /** When set, the card mounts off screen on that side and springs back in (undo). */
  enterFrom?: SwipeDirection;
  /** Fired the moment a swipe is committed (good for haptics). */
  onCommit: (direction: SwipeDirection) => void;
  /** Fired once the card is fully off screen. */
  onGone: (direction: SwipeDirection) => void;
  onPress: () => void;
  ref?: Ref<SwipeCardHandle>;
};

const MAX_ROTATION = 12;
const VELOCITY_THRESHOLD = 800;

export function SwipeCard({ listing, isTop, progress, enterFrom, onCommit, onGone, onPress, ref }: Props) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const offscreen = width * 1.5;

  const translateX = useSharedValue(enterFrom ? enterFrom * offscreen : 0);
  const translateY = useSharedValue(0);
  const leaving = useSharedValue(false);

  useEffect(() => {
    if (enterFrom) translateX.set(withSpring(0, { damping: 18, stiffness: 160 }));
  }, [enterFrom, translateX]);

  // The top card drives how far the next card has grown into place.
  useAnimatedReaction(
    () => translateX.value,
    (x) => {
      if (isTop) progress.set(Math.min(1, Math.abs(x) / (width * 0.5)));
    },
    [isTop, width]
  );

  const fly = (direction: SwipeDirection, velocityY: number) => {
    'worklet';
    leaving.set(true);
    translateY.set(withTiming(translateY.value + velocityY * 0.15, { duration: 260 }));
    translateX.set(
      withTiming(direction * offscreen, { duration: 260 }, (finished) => {
        if (finished) scheduleOnRN(onGone, direction);
      })
    );
  };

  useImperativeHandle(ref, () => ({
    swipe: (direction) => {
      onCommit(direction);
      fly(direction, 0);
    },
  }));

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((event) => {
      if (leaving.value) return;
      translateX.set(event.translationX);
      translateY.set(event.translationY);
    })
    .onEnd((event) => {
      if (leaving.value) return;
      const x = event.translationX;
      const flicked = Math.abs(event.velocityX) > VELOCITY_THRESHOLD && Math.sign(event.velocityX) === Math.sign(x);
      if (Math.abs(x) > width * 0.3 || flicked) {
        const direction: SwipeDirection = x > 0 ? 1 : -1;
        scheduleOnRN(onCommit, direction);
        fly(direction, event.velocityY);
      } else {
        translateX.set(withSpring(0, { damping: 15, stiffness: 180 }));
        translateY.set(withSpring(0, { damping: 15, stiffness: 180 }));
      }
    });

  const tap = Gesture.Tap()
    .enabled(isTop)
    .onEnd((_event, success) => {
      if (success && !leaving.value) scheduleOnRN(onPress);
    });

  const gesture = Gesture.Race(pan, tap);

  const cardStyle = useAnimatedStyle(() => {
    if (!isTop) {
      return {
        transform: [
          { translateY: interpolate(progress.value, [0, 1], [18, 0]) },
          { scale: interpolate(progress.value, [0, 1], [0.95, 1]) },
        ],
      };
    }
    const rotate = interpolate(translateX.value, [-width / 2, 0, width / 2], [-MAX_ROTATION, 0, MAX_ROTATION], Extrapolation.CLAMP);
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate}deg` }],
    };
  });

  const saveStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, width * 0.25], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-width * 0.25, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const { place } = placeOf(listing);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.card, cardStyle]}
        accessible={isTop}
        accessibilityRole="button"
        accessibilityLabel={`${listing.title}, ${place}`}
        accessibilityHint="Swipe right to save, left to skip, tap to open">
        <View style={styles.clip}>
          <Image source={listing.images[0]} style={styles.photo} contentFit="cover" transition={200} recyclingKey={listing.id} />
          <View style={styles.scrim} />

          {listing.guestFavorite && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Guest favorite</Text>
            </View>
          )}

          <Animated.View style={[styles.stamp, styles.stampSave, saveStampStyle]} pointerEvents="none">
            <Text style={[styles.stampText, styles.stampSaveText]}>SAVE</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampNope, nopeStampStyle]} pointerEvents="none">
            <Text style={[styles.stampText, styles.stampNopeText]}>NOPE</Text>
          </Animated.View>

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {listing.title}
            </Text>
            <Text style={styles.place} numberOfLines={1}>
              {place}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.price} numberOfLines={1}>
                {cardPriceLabel(listing)}
              </Text>
              <Text style={styles.rating}>★ {listing.rating.toFixed(2).replace(/0$/, '')}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const useStyles = createStyles((c) => ({
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: c.surface,
    boxShadow: `0 10px 30px ${c.shadow}`,
  },
  clip: {
    flex: 1,
    borderRadius: 24,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  photo: {
    flex: 1,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    experimental_backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.85) 100%)',
  },
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: c.overlayButton,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.text,
  },
  stamp: {
    position: 'absolute',
    top: 56,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  stampSave: {
    left: 24,
    borderColor: c.primary,
    transform: [{ rotate: '-16deg' }],
  },
  stampNope: {
    right: 24,
    borderColor: c.white,
    transform: [{ rotate: '16deg' }],
  },
  stampText: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 3,
  },
  stampSaveText: {
    color: c.primary,
  },
  stampNopeText: {
    color: c.white,
  },
  info: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 22,
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: c.white,
    letterSpacing: -0.3,
  },
  place: {
    fontSize: 16,
    color: c.white,
    opacity: 0.9,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  price: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    color: c.white,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: c.white,
  },
}));
