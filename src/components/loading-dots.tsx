import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function LoadingDots({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <View style={styles.row} accessibilityLabel="Loading">
      {[0, 1, 2].map((i) => (
        <Dot key={i} delay={i * 140} color={color} />
      ))}
    </View>
  );
}

function Dot({ delay, color }: { delay: number; color: string }) {
  const lift = useSharedValue(0);

  useEffect(() => {
    lift.set(
      withDelay(
        delay,
        withRepeat(withSequence(withTiming(-5, { duration: 260 }), withTiming(0, { duration: 260 })), -1)
      )
    );
  }, [delay, lift]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    height: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
