import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;
const SPRING = { damping: 22, stiffness: 220, mass: 0.8 };

type Props = {
  uri: string;
  width: number;
  height: number;
  /** Only the visible page should keep its zoom; others reset when they scroll away. */
  active: boolean;
  /** Shared with the screen: 0 at rest, 1 once the photo is dragged DISMISS_DISTANCE away. */
  dismissProgress: SharedValue<number>;
  onZoomChange: (zoomed: boolean) => void;
  onDismiss: () => void;
};

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

export function ZoomablePhoto({ uri, width, height, active, dismissProgress, onZoomChange, onDismiss }: Props) {
  const [zoomed, setZoomed] = useState(false);

  const aspect = useSharedValue(width / height);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const startFocalX = useSharedValue(0);
  const startFocalY = useSharedValue(0);
  const dragY = useSharedValue(0);

  useEffect(() => {
    if (active) return;
    scale.set(1);
    savedScale.set(1);
    tx.set(0);
    ty.set(0);
  }, [active, scale, savedScale, tx, ty]);

  useAnimatedReaction(
    () => scale.value > 1.01,
    (isZoomed, previous) => {
      if (isZoomed !== previous) scheduleOnRN(setZoomed, isZoomed);
    },
  );

  useEffect(() => {
    onZoomChange(zoomed);
  }, [zoomed, onZoomChange]);

  /** How far the photo may move at scale `s` before its edge leaves the screen edge. */
  const bounds = (s: number) => {
    'worklet';
    const contentWidth = Math.min(width, height * aspect.value);
    const contentHeight = contentWidth / aspect.value;
    return {
      x: Math.max(0, (contentWidth * s - width) / 2),
      y: Math.max(0, (contentHeight * s - height) / 2),
    };
  };

  const settle = (s: number, x: number, y: number) => {
    'worklet';
    const nextScale = clamp(s, MIN_SCALE, MAX_SCALE);
    const max = bounds(nextScale);
    const nextX = nextScale === 1 ? 0 : clamp(x, -max.x, max.x);
    const nextY = nextScale === 1 ? 0 : clamp(y, -max.y, max.y);
    scale.set(withSpring(nextScale, SPRING));
    tx.set(withSpring(nextX, SPRING));
    ty.set(withSpring(nextY, SPRING));
    savedScale.set(nextScale);
    savedTx.set(nextX);
    savedTy.set(nextY);
  };

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      savedScale.set(scale.value);
      savedTx.set(tx.value);
      savedTy.set(ty.value);
      startFocalX.set(e.focalX - width / 2);
      startFocalY.set(e.focalY - height / 2);
    })
    .onUpdate((e) => {
      // Allow a little rubber-band past the limits; settle() snaps back on release.
      const next = clamp(savedScale.value * e.scale, MIN_SCALE * 0.7, MAX_SCALE * 1.3);
      const ratio = next / savedScale.value;
      const focalX = e.focalX - width / 2;
      const focalY = e.focalY - height / 2;
      // Keep the point under the fingers fixed while following the fingers' movement.
      scale.set(next);
      tx.set(focalX - (startFocalX.value - savedTx.value) * ratio);
      ty.set(focalY - (startFocalY.value - savedTy.value) * ratio);
    })
    .onEnd(() => {
      settle(scale.value, tx.value, ty.value);
    });

  const pan = zoomed
    ? Gesture.Pan()
        .averageTouches(true)
        .onStart(() => {
          savedTx.set(tx.value);
          savedTy.set(ty.value);
        })
        .onUpdate((e) => {
          const max = bounds(scale.value);
          tx.set(clamp(savedTx.value + e.translationX, -max.x, max.x));
          ty.set(clamp(savedTy.value + e.translationY, -max.y, max.y));
        })
        .onEnd((e) => {
          const max = bounds(scale.value);
          tx.set(withSpring(clamp(tx.value + e.velocityX * 0.08, -max.x, max.x), SPRING));
          ty.set(withSpring(clamp(ty.value + e.velocityY * 0.08, -max.y, max.y), SPRING));
          savedTx.set(clamp(tx.value + e.velocityX * 0.08, -max.x, max.x));
          savedTy.set(clamp(ty.value + e.velocityY * 0.08, -max.y, max.y));
        })
    : // Not zoomed: vertical drags dismiss, horizontal drags fail so the pager can page.
      Gesture.Pan()
        .maxPointers(1)
        .activeOffsetY([-12, 12])
        .failOffsetX([-12, 12])
        .onUpdate((e) => {
          if (scale.value > 1.01) return;
          dragY.set(e.translationY);
          dismissProgress.set(Math.min(Math.abs(e.translationY) / DISMISS_DISTANCE, 1));
        })
        .onEnd((e) => {
          if (Math.abs(e.translationY) > DISMISS_DISTANCE || Math.abs(e.velocityY) > DISMISS_VELOCITY) {
            const direction = e.translationY + e.velocityY * 0.1 >= 0 ? 1 : -1;
            dismissProgress.set(withTiming(1, { duration: 180 }));
            dragY.set(
              withTiming(direction * height, { duration: 180 }, (finished) => {
                if (finished) scheduleOnRN(onDismiss);
              }),
            );
          } else {
            dragY.set(withSpring(0, SPRING));
            dismissProgress.set(withSpring(0, SPRING));
          }
        });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((e, success) => {
      if (!success) return;
      if (scale.value > 1.01) {
        settle(1, 0, 0);
        return;
      }
      // Zoom so the tapped point stays where it is.
      const focalX = e.x - width / 2;
      const focalY = e.y - height / 2;
      settle(DOUBLE_TAP_SCALE, focalX * (1 - DOUBLE_TAP_SCALE), focalY * (1 - DOUBLE_TAP_SCALE));
    });

  const gesture = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value + dragY.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width, height }, animatedStyle]}>
        <Image
          source={uri}
          style={{ width, height }}
          contentFit="contain"
          transition={200}
          accessibilityIgnoresInvertColors
          onLoad={(e) => {
            if (e.source.width > 0 && e.source.height > 0) aspect.set(e.source.width / e.source.height);
          }}
        />
      </Animated.View>
    </GestureDetector>
  );
}
