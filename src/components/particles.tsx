import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#92174D', '#BD1E59', '#D70466', '#E07AB4', '#7B1FA2', '#A23B9C', '#C878C0'];

type Dot = { x: number; y: number; size: number; color: string; drift: number; duration: number; delay: number };

function makeDots(count: number, width: number, height: number): Dot[] {
  return Array.from({ length: count }, () => {
    // Keep the middle mostly clear so the dots frame the message instead of covering it.
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = width / 2 + side * (40 + Math.random() * (width / 2 - 40));
    return {
      x: Math.min(width - 12, Math.max(12, x)),
      y: height * (0.22 + Math.random() * 0.5),
      size: 3 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      drift: 10 + Math.random() * 28,
      duration: 1800 + Math.random() * 2200,
      delay: Math.random() * 1200,
    };
  });
}

/** Floating confetti-like dots used on the "getting your trip ready" screens. */
export function Particles({ count = 30 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const [dots] = useState(() => makeDots(count, width, height));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map((dot, i) => (
        <FloatingDot key={i} dot={dot} />
      ))}
    </View>
  );
}

function FloatingDot({ dot }: { dot: Dot }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(
        dot.delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: dot.duration, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: dot.duration, easing: Easing.inOut(Easing.quad) })
          ),
          -1
        )
      )
    );
  }, [dot, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [{ translateY: -progress.value * dot.drift }, { scale: 0.7 + progress.value * 0.3 }],
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { left: dot.x, top: dot.y, width: dot.size, height: dot.size, borderRadius: dot.size, backgroundColor: dot.color },
        style,
      ]}
    />
  );
}

/** Eight dots in a ring that pulse one after another, around an icon. */
export function PulseRing({ radius = 80 }: { radius?: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
      {Array.from({ length: 8 }, (_, i) => (
        <RingDot key={i} index={i} radius={radius} />
      ))}
    </View>
  );
}

function RingDot({ index, radius }: { index: number; radius: number }) {
  const pulse = useSharedValue(0.3);
  const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;

  useEffect(() => {
    pulse.set(
      withDelay(index * 120, withRepeat(withSequence(withTiming(1, { duration: 480 }), withTiming(0.3, { duration: 480 })), -1))
    );
  }, [index, pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value, transform: [{ scale: 0.6 + pulse.value * 0.6 }] }));

  return (
    <Animated.View
      style={[
        styles.ringDot,
        { transform: [{ translateX: Math.cos(angle) * radius }, { translateY: Math.sin(angle) * radius }] },
      ]}>
      <Animated.View style={[styles.ringDotInner, style]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
  },
  ringDot: {
    position: 'absolute',
  },
  ringDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9B8E3',
  },
});
