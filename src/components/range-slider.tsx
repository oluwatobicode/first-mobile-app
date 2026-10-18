import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { createStyles } from '@/hooks/use-theme';

const THUMB = 30;

type Props = {
  min: number;
  max: number;
  step: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
};

/** Two-thumb range slider. Values snap to `step`; `onChange` fires as you drag. */
export function RangeSlider({ min, max, step, low, high, onChange }: Props) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const track = Math.max(1, width - THUMB);

  const lowX = useSharedValue(0);
  const highX = useSharedValue(0);
  const startX = useSharedValue(0);

  const layout = (w: number) => {
    setWidth(w);
    const t = Math.max(1, w - THUMB);
    lowX.set(((low - min) / (max - min)) * t);
    highX.set(((high - min) / (max - min)) * t);
  };

  const report = (lx: number, hx: number) => {
    const snap = (x: number) => Math.round((min + (x / track) * (max - min)) / step) * step;
    onChange(snap(lx), snap(hx));
  };
  const tick = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  };

  const minGap = (step / (max - min)) * track;

  const lowGesture = Gesture.Pan()
    .onBegin(() => {
      startX.set(lowX.value);
      scheduleOnRN(tick);
    })
    .onUpdate((e) => {
      lowX.set(Math.min(Math.max(0, startX.value + e.translationX), highX.value - minGap));
      scheduleOnRN(report, lowX.value, highX.value);
    });

  const highGesture = Gesture.Pan()
    .onBegin(() => {
      startX.set(highX.value);
      scheduleOnRN(tick);
    })
    .onUpdate((e) => {
      highX.set(Math.max(Math.min(track, startX.value + e.translationX), lowX.value + minGap));
      scheduleOnRN(report, lowX.value, highX.value);
    });

  const lowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: lowX.value }] }));
  const highStyle = useAnimatedStyle(() => ({ transform: [{ translateX: highX.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ left: lowX.value + THUMB / 2, width: highX.value - lowX.value }));

  return (
    <View style={styles.wrap} onLayout={(e) => layout(e.nativeEvent.layout.width)}>
      <View style={styles.track} />
      {width > 0 && (
        <>
          <Animated.View style={[styles.fill, fillStyle]} />
          <GestureDetector gesture={lowGesture}>
            <Animated.View
              style={[styles.thumb, lowStyle]}
              hitSlop={12}
              accessibilityRole="adjustable"
              accessibilityLabel="Minimum price"
            />
          </GestureDetector>
          <GestureDetector gesture={highGesture}>
            <Animated.View
              style={[styles.thumb, highStyle]}
              hitSlop={12}
              accessibilityRole="adjustable"
              accessibilityLabel="Maximum price"
            />
          </GestureDetector>
        </>
      )}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  wrap: {
    height: THUMB + 8,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: THUMB / 2,
    right: THUMB / 2,
    height: 3,
    borderRadius: 2,
    backgroundColor: c.border,
  },
  fill: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
    backgroundColor: c.text,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: c.elevated,
    borderWidth: 1,
    borderColor: c.border,
    boxShadow: `0 2px 8px ${c.shadow}`,
  },
}));
