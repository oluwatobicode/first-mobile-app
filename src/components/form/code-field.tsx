import { useEffect, useRef, type ComponentRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { ERROR, ERROR_BG, FieldMessage } from '@/components/form/text-field';
import { KEYBOARD_BAR_ID } from '@/components/keyboard-bar';
import { Brand } from '@/constants/theme';

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  length?: number;
  /** Called once every digit is filled in. */
  onComplete?: (code: string) => void;
};

/** One hidden input drawn as separate digit slots; shakes when it has an error. */
export function CodeField<T extends FieldValues>({ control, name, length = 4, onComplete }: Props<T>) {
  const {
    field: { ref: fieldRef, value: rawValue, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const shake = useSharedValue(0);
  const value: string = rawValue ?? '';
  const error = fieldState.error?.message;

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  useEffect(() => {
    if (!error) return;
    shake.set(
      withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(0, { duration: 50 })
      )
    );
  }, [error, shake]);

  return (
    <>
      <Animated.View style={shakeStyle}>
        <Pressable style={[styles.box, error && styles.boxError]} onPress={() => input.current?.focus()}>
          {Array.from({ length }, (_, i) => (
            <Text key={i} style={[styles.digit, !value[i] && styles.placeholder]}>
              {value[i] ?? '–'}
            </Text>
          ))}
          <TextInput
            ref={(node) => {
              input.current = node;
              fieldRef(node);
            }}
            value={value}
            onChangeText={(text) => {
              const next = text.replace(/\D/g, '').slice(0, length);
              onChange(next);
              if (next.length === length) onComplete?.(next);
            }}
            onBlur={onBlur}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            inputAccessoryViewID={KEYBOARD_BAR_ID}
            autoFocus
            maxLength={length}
            caretHidden
            style={styles.hiddenInput}
            accessibilityLabel="Confirmation code"
          />
        </Pressable>
      </Animated.View>
      <FieldMessage error={error} />
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 220,
    height: 70,
    borderWidth: 2,
    borderColor: Brand.text,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  boxError: {
    borderColor: ERROR,
    backgroundColor: ERROR_BG,
  },
  digit: {
    fontSize: 22,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    color: Brand.text,
    width: 22,
    textAlign: 'center',
  },
  placeholder: {
    color: '#9A9A9A',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
});
