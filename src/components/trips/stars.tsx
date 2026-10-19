import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { StarBoldIcon, StarIcon } from '@/components/icons';
import { useTheme } from '@/hooks/use-theme';

const STAR_LABELS = ['Terrible', 'Bad', 'Okay', 'Good', 'Great'];

export function ratingLabel(rating: number) {
  return STAR_LABELS[rating - 1] ?? '';
}

type StarRowProps = {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  gap?: number;
  /** Name read out by screen readers, e.g. "Cleanliness". */
  label?: string;
};

/** Five tappable stars, filled up to `value`. */
export function StarRow({ value, onChange, size = 28, gap = 8, label = 'Rating' }: StarRowProps) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap }} accessibilityRole="adjustable" accessibilityLabel={label}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <Pressable
            key={star}
            hitSlop={6}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              onChange(star);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${star} star${star === 1 ? '' : 's'}`}
            accessibilityState={{ selected: star === value }}>
            {filled ? (
              <StarBoldIcon size={size} color={colors.text} />
            ) : (
              <StarIcon size={size} color={colors.placeholder} strokeWidth={1.5} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Big stars for the overall rating; the chosen star pops with a spring. */
export function BigStarRow({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }} accessibilityLabel="Overall rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <BigStar key={star} star={star} filled={star <= value} active={star === value} onPress={() => onChange(star)} />
      ))}
    </View>
  );
}

const pop = () =>
  withSequence(withTiming(0.75, { duration: 80 }), withSpring(1.3, { damping: 5, stiffness: 320 }), withSpring(1, { damping: 9 }));

function BigStar({ star, filled, active, onPress }: { star: number; filled: boolean; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  // Pop the selected star whenever the selection lands on it (including a preselected rating).
  useEffect(() => {
    if (active) scale.set(pop());
  }, [active, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      hitSlop={4}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Tapping the already-selected star doesn't change state, so pop it here.
        if (active) scale.set(pop());
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${star} star${star === 1 ? '' : 's'}, ${ratingLabel(star)}`}
      accessibilityState={{ selected: active }}>
      <Animated.View style={animatedStyle}>
        {filled ? <StarBoldIcon size={48} color={colors.primary} /> : <StarIcon size={48} color={colors.placeholder} strokeWidth={1.4} />}
      </Animated.View>
    </Pressable>
  );
}
