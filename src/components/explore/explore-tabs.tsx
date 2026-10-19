import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { CATEGORIES, type Category } from '@/data/listings';
import { createStyles } from '@/hooks/use-theme';

// Every height is fixed so Explore can work out the header size without measuring it.
const MARGIN_EXPANDED = 14;
const MARGIN_COLLAPSED = 6;
const EMOJI_BOX = 50;
const LABEL_GAP = 4;
const LABEL_LINE = 18;
const UNDERLINE_GAP = 10;
const UNDERLINE = 3;

export const TABS_EXPANDED_HEIGHT = MARGIN_EXPANDED + EMOJI_BOX + LABEL_GAP + LABEL_LINE + UNDERLINE_GAP + UNDERLINE;
export const TABS_COLLAPSED_HEIGHT = MARGIN_COLLAPSED + LABEL_GAP + LABEL_LINE + UNDERLINE_GAP + UNDERLINE;

type Props = {
  value: Category;
  onChange: (category: Category) => void;
  /** 0 = full size with emoji, 1 = labels only. Driven by the Explore scroll position. */
  progress: SharedValue<number>;
};

/** Homes / Experiences / Services tabs that fold down to labels as Explore scrolls. */
export function ExploreTabs({ value, onChange, progress }: Props) {
  const styles = useStyles();
  const rowStyle = useAnimatedStyle(() => ({
    marginTop: interpolate(progress.value, [0, 1], [MARGIN_EXPANDED, MARGIN_COLLAPSED], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={[styles.row, rowStyle]} accessibilityRole="tablist">
      {CATEGORIES.map((category) => (
        <Tab
          key={category.key}
          label={category.label}
          emoji={category.emoji}
          isNew={category.isNew}
          active={category.key === value}
          progress={progress}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            onChange(category.key);
          }}
        />
      ))}
    </Animated.View>
  );
}

type TabProps = {
  label: string;
  emoji: string;
  isNew?: boolean;
  active: boolean;
  progress: SharedValue<number>;
  onPress: () => void;
};

function Tab({ label, emoji, isNew, active, progress, onPress }: TabProps) {
  const styles = useStyles();
  const bounce = useSharedValue(1);

  useEffect(() => {
    if (active) bounce.set(withSequence(withSpring(1.2, { damping: 5, stiffness: 260 }), withSpring(1)));
  }, [active, bounce]);

  const boxStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [EMOJI_BOX, 0], Extrapolation.CLAMP),
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: bounce.value * interpolate(progress.value, [0, 1], [1, 0], Extrapolation.CLAMP) }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Pressable onPress={onPress} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: active }}>
      <Animated.View style={[styles.emojiBox, boxStyle]}>
        <Animated.Text style={[styles.emoji, emojiStyle]}>{emoji}</Animated.Text>
      </Animated.View>
      {isNew && (
        <Animated.View style={[styles.newBadge, badgeStyle]} pointerEvents="none">
          <Text style={styles.newText}>NEW</Text>
        </Animated.View>
      )}
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.underline, active && styles.underlineActive]} />
    </Pressable>
  );
}

const useStyles = createStyles((c) => ({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    minWidth: 90,
  },
  emojiBox: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  emoji: {
    fontSize: 40,
    lineHeight: EMOJI_BOX,
  },
  newBadge: {
    position: 'absolute',
    top: -2,
    left: '50%',
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    experimental_backgroundImage: 'linear-gradient(180deg, #4A5A82, #26324F)',
    backgroundColor: '#2F3B5C',
    borderWidth: 1.5,
    borderColor: c.header,
  },
  newText: {
    color: c.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  label: {
    marginTop: LABEL_GAP,
    height: LABEL_LINE,
    lineHeight: LABEL_LINE,
    fontSize: 14,
    fontWeight: '500',
    color: c.textSecondary,
  },
  labelActive: {
    color: c.text,
    fontWeight: '700',
  },
  underline: {
    marginTop: UNDERLINE_GAP,
    height: UNDERLINE,
    width: 46,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: c.text,
  },
}));
