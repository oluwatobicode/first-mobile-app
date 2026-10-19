import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { createStyles } from '@/hooks/use-theme';

/** Airbnb's bordered secondary button ("Show all 214 reviews"). */
export function OutlineButton({ label, onPress, style }: { label: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const useStyles = createStyles((c) => ({
  button: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pressed: {
    backgroundColor: c.surface,
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
}));
