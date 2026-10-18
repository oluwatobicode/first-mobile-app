import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { CATEGORIES, type Category } from '@/data/listings';
import { createStyles } from '@/hooks/use-theme';

type Props = {
  value: Category;
  onChange: (category: Category) => void;
  compact?: boolean;
};

export function CategoryTabs({ value, onChange, compact = false }: Props) {
  const styles = useStyles();
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {CATEGORIES.map((category) => (
        <CategoryTab
          key={category.key}
          label={category.label}
          emoji={category.emoji}
          isNew={category.isNew && !compact}
          active={category.key === value}
          compact={compact}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            onChange(category.key);
          }}
        />
      ))}
    </View>
  );
}

type TabProps = {
  label: string;
  emoji: string;
  isNew?: boolean;
  active: boolean;
  compact: boolean;
  onPress: () => void;
};

function CategoryTab({ label, emoji, isNew, active, compact, onPress }: TabProps) {
  const styles = useStyles();
  const bounce = useSharedValue(1);

  useEffect(() => {
    if (active) {
      bounce.set(withSequence(withSpring(1.2, { damping: 5, stiffness: 260 }), withSpring(1)));
    }
  }, [active, bounce]);

  const emojiStyle = useAnimatedStyle(() => ({ transform: [{ scale: bounce.value }] }));

  return (
    <Pressable onPress={onPress} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: active }}>
      <View>
        <Animated.Text style={[styles.emoji, compact && styles.emojiCompact, emojiStyle]}>{emoji}</Animated.Text>
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>NEW</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      <View style={[styles.underline, active && styles.underlineActive]} />
    </Pressable>
  );
}

const useStyles = createStyles((c) => ({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 18,
  },
  rowCompact: {
    marginTop: 0,
    flex: 1,
  },
  tab: {
    alignItems: 'center',
    minWidth: 90,
  },
  emoji: {
    fontSize: 44,
    lineHeight: 54,
  },
  emojiCompact: {
    fontSize: 32,
    lineHeight: 40,
  },
  newBadge: {
    position: 'absolute',
    top: -2,
    right: -38,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    experimental_backgroundImage: 'linear-gradient(180deg, #4A5A82, #26324F)',
    backgroundColor: '#2F3B5C',
    borderWidth: 1.5,
    borderColor: c.background,
  },
  newText: {
    color: c.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  label: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: c.textSecondary,
  },
  labelActive: {
    color: c.text,
    fontWeight: '700',
  },
  underline: {
    marginTop: 10,
    height: 3,
    width: 46,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: c.text,
  },
}));
