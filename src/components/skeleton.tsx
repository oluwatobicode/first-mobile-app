import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { createStyles } from '@/hooks/use-theme';

/** A gently pulsing placeholder block. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: 0.55 + pulse.value * 0.45 }));

  return <Animated.View style={[styles.block, style, animated]} accessibilityLabel="Loading" />;
}

/** Placeholder with the same shape as ListingCard. */
export function ListingCardSkeleton({ width }: { width: number }) {
  const styles = useStyles();
  return (
    <View style={{ width }}>
      <Skeleton style={[styles.photo, { height: width * 0.95 }]} />
      <Skeleton style={[styles.line, { width: width * 0.8, marginTop: 12 }]} />
      <Skeleton style={[styles.line, { width: width * 0.55, marginTop: 8 }]} />
    </View>
  );
}

const useStyles = createStyles((c) => ({
  block: {
    backgroundColor: c.surface,
  },
  photo: {
    borderRadius: 20,
  },
  line: {
    height: 14,
    borderRadius: 7,
  },
}));
