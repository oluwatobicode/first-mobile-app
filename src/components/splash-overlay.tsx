import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { HomeSmileBoldIcon } from '@/components/icons';
import { createStyles, useTheme } from '@/hooks/use-theme';

export function SplashOverlay() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [visible, setVisible] = useState(true);
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  const start = () => {
    SplashScreen.hideAsync().finally(() => {
      logoOpacity.set(withTiming(1, { duration: 250 }));
      logoScale.set(withSequence(
        withSpring(1.1, { damping: 8, stiffness: 180 }),
        withSpring(1, { damping: 12 })
      ));
      overlayOpacity.set(
        withDelay(
          1100,
          withTiming(0, { duration: 350 }, (finished) => {
            if (finished) scheduleOnRN(setVisible, false);
          })
        )
      );
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} onLayout={start} pointerEvents="none">
      <Animated.View style={logoStyle}>
        <HomeSmileBoldIcon size={88} color={colors.primary} />
      </Animated.View>
    </Animated.View>
  );
}

const useStyles = createStyles((c) => ({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: c.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
}));
