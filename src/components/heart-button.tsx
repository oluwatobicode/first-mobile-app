import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { HeartBoldIcon, HeartIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { useWishlist } from '@/hooks/use-wishlist';

type Props = {
  listingId: string;
  size?: number;
  /** `overlay` sits on top of a photo, `plain` sits on a white surface. */
  variant?: 'overlay' | 'plain';
};

export function HeartButton({ listingId, size = 26, variant = 'overlay' }: Props) {
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(listingId);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPress = () => {
    scale.set(withSequence(
      withTiming(0.7, { duration: 90 }),
      withSpring(1.25, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 10 })
    ));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(saved ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    }
    toggle(listingId);
  };

  const fill = saved ? Brand.primary : variant === 'overlay' ? 'rgba(0,0,0,0.45)' : 'transparent';
  const outline = saved ? Brand.primary : variant === 'overlay' ? '#FFFFFF' : Brand.text;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove from wishlist' : 'Save to wishlist'}>
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <View style={StyleSheet.absoluteFill}>
          <HeartBoldIcon size={size} color={fill} />
        </View>
        <HeartIcon size={size} color={outline} strokeWidth={2} />
      </Animated.View>
    </Pressable>
  );
}
