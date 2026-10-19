import * as Haptics from 'expo-haptics';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CATEGORY_TAGS, type CategoryTag } from '@/data/details';
import { createStyles } from '@/hooks/use-theme';

/** Fixed so Explore can size its header without measuring. */
export const CATEGORY_STRIP_HEIGHT = 66;

type Props = {
  value: CategoryTag | null;
  onChange: (tag: CategoryTag | null) => void;
};

const ITEMS: { key: CategoryTag | null; label: string; emoji: string }[] = [
  { key: null, label: 'All', emoji: '🏠' },
  ...CATEGORY_TAGS,
];

/** Airbnb's icon row: tap a category to narrow Homes, tap it again (or "All") to clear. */
export function CategoryStrip({ value, onChange }: Props) {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {ITEMS.map((item) => {
          const active = item.key === value;
          return (
            <Pressable
              key={item.key ?? 'all'}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                onChange(active ? null : item.key);
              }}
              style={({ pressed }) => [styles.chip, !active && pressed && { opacity: 0.6 }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}>
              <Text style={[styles.emoji, !active && styles.emojiIdle]}>{item.emoji}</Text>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {item.label}
              </Text>
              <View style={[styles.underline, active && styles.underlineActive]} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  wrap: {
    height: CATEGORY_STRIP_HEIGHT,
    marginHorizontal: -24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
  },
  row: {
    paddingHorizontal: 20,
    gap: 22,
    paddingTop: 8,
  },
  chip: {
    alignItems: 'center',
    minWidth: 48,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  emojiIdle: {
    opacity: 0.7,
  },
  label: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: c.textSecondary,
  },
  labelActive: {
    color: c.text,
    fontWeight: '700',
  },
  underline: {
    marginTop: 7,
    height: 2,
    alignSelf: 'stretch',
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: c.text,
  },
}));
