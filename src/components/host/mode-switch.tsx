import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { TransferHorizontalIcon } from '@solar-icons/react-native/linear/transfer-horizontal';
import { useSettings } from '@/hooks/use-settings';
import { createStyles, useTheme } from '@/hooks/use-theme';

const SWITCH_MS = 900;

/**
 * Airbnb's "Switching to hosting…" moment: a full-screen fade with a spinner,
 * then flip `hostMode` and replace the tab group.
 */
export function useModeSwitch() {
  const { setHostMode } = useSettings();
  const [target, setTarget] = useState<'hosting' | 'travelling' | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const switchTo = (next: 'hosting' | 'travelling') => {
    if (timer.current) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTarget(next);
    timer.current = setTimeout(() => {
      timer.current = null;
      const hosting = next === 'hosting';
      setHostMode(hosting);
      router.replace(hosting ? ('/today' as never) : '/profile');
      setTarget(null);
    }, SWITCH_MS);
  };

  return { switchTo, overlay: <ModeSwitchOverlay target={target} /> };
}

function ModeSwitchOverlay({ target }: { target: 'hosting' | 'travelling' | null }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Modal visible={target !== null} transparent animationType="none" statusBarTranslucent navigationBarTranslucent>
      <Animated.View entering={FadeIn.duration(220)} style={styles.overlay} accessibilityLiveRegion="assertive">
        <Animated.View entering={FadeInDown.delay(80).duration(320)} style={styles.overlayContent}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={styles.overlayText}>Switching to {target ?? 'hosting'}…</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/** The dark "⇄ Switch to hosting" pill. */
export function SwitchPill({ label, onPress, style }: { label: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, pressed && { transform: [{ scale: 0.96 }] }, style]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={styles.pillIcon}>
        <TransferHorizontalIcon size={18} color={colors.onInverse} strokeWidth={2} />
      </View>
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

const useStyles = createStyles((c) => ({
  overlay: {
    flex: 1,
    backgroundColor: c.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    alignItems: 'center',
    gap: 20,
  },
  overlayText: {
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: c.inverse,
    boxShadow: `0 6px 20px ${c.shadow}`,
  },
  pillIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 15,
    fontWeight: '700',
    color: c.onInverse,
  },
}));
