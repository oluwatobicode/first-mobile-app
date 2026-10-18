import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

/** Pass as `inputAccessoryViewID` on inputs that use a number or phone pad (they have no return key on iOS). */
export const KEYBOARD_BAR_ID = 'keyboard-done-bar';

/** A "Done" bar above the iOS keyboard so number pads can be closed. Render once per screen. */
export function KeyboardBar({ label = 'Done', onPress }: { label?: string; onPress?: () => void }) {
  if (Platform.OS !== 'ios') return null;
  return (
    <InputAccessoryView nativeID={KEYBOARD_BAR_ID}>
      <View style={styles.bar}>
        <Pressable onPress={onPress ?? Keyboard.dismiss} hitSlop={10} accessibilityRole="button">
          <Text style={styles.label}>{label}</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F7F7F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.text,
  },
});
