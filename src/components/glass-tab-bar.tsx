import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createStyles, useTheme } from '@/hooks/use-theme';

const BAR_HEIGHT = 66;
const SIDE_MARGIN = 18;

// Checked once: real Liquid Glass needs iOS 26+, and some iOS 26 betas lack the API entirely.
const GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

/** Space to leave at the bottom of tab screens so content can scroll out from under the floating bar. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;
}

/** Floating iOS 26–style glass tab bar. Falls back to a frosted panel on Android and older iOS. */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors, scheme } = useTheme();
  const [rowWidth, setRowWidth] = useState(0);
  const itemWidth = rowWidth / state.routes.length;

  const indicatorStyle = useAnimatedStyle(() => ({
    width: itemWidth - 8,
    transform: [{ translateX: withSpring(state.index * itemWidth + 4, { damping: 18, stiffness: 180 }) }],
  }));

  const items = (
    <View style={styles.row} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
      {rowWidth > 0 && <Animated.View style={[styles.indicator, indicatorStyle]} />}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? colors.primary : colors.text;
        const label = typeof options.title === 'string' ? options.title : route.name;
        const badge = options.tabBarBadge;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={badge ? `${label}, ${badge} new` : label}>
            <View>
              {options.tabBarIcon?.({ focused, color, size: 24 })}
              {badge !== undefined && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, { color }, focused && styles.labelFocused]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      {GLASS ? (
        <GlassView style={styles.bar} glassEffectStyle="regular" isInteractive colorScheme={scheme}>
          {items}
        </GlassView>
      ) : (
        <View style={[styles.bar, styles.fallback]}>{items}</View>
      )}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  wrap: {
    position: 'absolute',
    left: SIDE_MARGIN,
    right: SIDE_MARGIN,
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    borderCurve: 'continuous',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fallback: {
    backgroundColor: c.tabBarFallback,
    borderWidth: 0.5,
    borderColor: c.border,
    boxShadow: `0 8px 24px ${c.shadow}`,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: (BAR_HEIGHT - 8) / 2,
    backgroundColor: 'rgba(255,56,92,0.12)',
  },
  item: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  labelFocused: {
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: c.background,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: c.white,
  },
}));
