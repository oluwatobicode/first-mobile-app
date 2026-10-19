import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { HeartBoldIcon, HeartIcon } from '@/components/icons';
import { openSaveSheet, useSavedToast } from '@/components/wishlist/helpers';
import { getListing } from '@/data/listings';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/hooks/use-wishlist';

type Props = {
  listingId: string;
  size?: number;
  /** `overlay` sits on top of a photo, `plain` sits on a white surface. */
  variant?: 'overlay' | 'plain';
  /** Lift the save/remove toast, e.g. `useTabBarSpace()` on tab screens or ~90 above a footer. */
  toastOffset?: number;
};

const BURST = 6;

export function HeartButton({ listingId, size = 26, variant = 'overlay', toastOffset = 0 }: Props) {
  const { colors } = useTheme();
  const { isSaved, listFor, lastList, saveTo, remove } = useWishlist();
  const toast = useToast();
  const showSaved = useSavedToast();
  const saved = isSaved(listingId);
  const scale = useSharedValue(1);
  // Bumped on every save so the burst replays.
  const [burstKey, setBurstKey] = useState(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pop = () => {
    scale.set(
      withSequence(
        withTiming(0.7, { duration: 90 }),
        withSpring(1.25, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 10 })
      )
    );
  };

  const haptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(style);
  };

  const onPress = () => {
    if (saved) {
      const list = listFor(listingId);
      pop();
      haptic(Haptics.ImpactFeedbackStyle.Light);
      remove(listingId);
      if (list) {
        toast.show({
          message: `Removed from ${list.name}`,
          image: getListing(listingId)?.images[0],
          offset: toastOffset,
          action: { label: 'Undo', onPress: () => saveTo(listingId, list.id) },
        });
      }
      return;
    }

    // First save ever: let them name a list in the sheet.
    if (!lastList) {
      haptic(Haptics.ImpactFeedbackStyle.Light);
      openSaveSheet(listingId, toastOffset);
      return;
    }

    pop();
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    setBurstKey((k) => k + 1);
    saveTo(listingId, lastList.id);
    showSaved(listingId, lastList.name, toastOffset);
  };

  const fill = saved ? colors.primary : variant === 'overlay' ? 'rgba(0,0,0,0.45)' : 'transparent';
  const outline = saved ? colors.primary : variant === 'overlay' ? colors.white : colors.text;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove from wishlist' : 'Save to wishlist'}>
      {burstKey > 0 && (
        <View key={burstKey} style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          {Array.from({ length: BURST }, (_, i) => (
            <BurstHeart key={i} angle={(i / BURST) * Math.PI * 2 - Math.PI / 2} size={size * 0.38} color={colors.primary} />
          ))}
        </View>
      )}
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <View style={StyleSheet.absoluteFill}>
          <HeartBoldIcon size={size} color={fill} />
        </View>
        <HeartIcon size={size} color={outline} strokeWidth={2} />
      </Animated.View>
    </Pressable>
  );
}

/** One small heart that shoots outward and fades, part of the save burst. */
function BurstHeart({ angle, size, color }: { angle: number; size: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
  }, [progress]);

  const style = useAnimatedStyle(() => {
    const distance = progress.value * size * 2.6;
    return {
      opacity: 1 - progress.value,
      transform: [
        { translateX: Math.cos(angle) * distance },
        { translateY: Math.sin(angle) * distance },
        { scale: 0.6 + progress.value * 0.6 },
        { rotate: `${(angle * 180) / Math.PI + 90}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.burst, style]}>
      <HeartBoldIcon size={size} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  burst: {
    position: 'absolute',
  },
});
