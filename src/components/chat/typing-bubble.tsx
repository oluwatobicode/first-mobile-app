import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { createStyles } from '@/hooks/use-theme';

/** The host's "typing…" bubble: three dots that pulse one after another. */
export function TypingBubble({ name }: { name: string }) {
  const styles = useStyles();
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(120)}
      style={styles.bubble}
      accessibilityLabel={`${name} is typing`}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} delay={i * 160} />
      ))}
    </Animated.View>
  );
}

function Dot({ delay }: { delay: number }) {
  const styles = useStyles();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 300 }), withTiming(0, { duration: 300 })), -1))
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [{ translateY: -3 * progress.value }],
  }));

  return (
    <Animated.View style={style}>
      <View style={styles.dot} />
    </Animated.View>
  );
}

const useStyles = createStyles((c) => ({
  bubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: c.surface,
    marginTop: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: c.textSecondary,
  },
}));
