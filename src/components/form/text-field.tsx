import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';

import { DangerCircleIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';

export const ERROR = '#C13515';
export const ERROR_BG = '#FFF8F6';

type Props<T extends FieldValues> = Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'defaultValue'> & {
  control: Control<T>;
  name: Path<T>;
  label: string;
  /** Reformat as the user types, e.g. add spaces to a card number. */
  format?: (text: string, previous: string) => string;
  /** Runs after a change, with the formatted value. Handy for jumping to the next field. */
  onValueChange?: (value: string) => void;
  helper?: string;
  trailing?: ReactNode;
  /** Inside a FieldGroup: no own border, and the group shows the errors. */
  inGroup?: boolean;
};

/** Airbnb-style outlined input: placeholder becomes a small label once focused or filled. */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  format,
  onValueChange,
  helper,
  trailing,
  inGroup,
  style,
  placeholder,
  ...inputProps
}: Props<T>) {
  const {
    field: { ref: fieldRef, value: rawValue, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  const [focused, setFocused] = useState(false);
  const value: string = rawValue ?? '';
  const error = fieldState.error?.message;
  const raised = focused || value.length > 0;

  return (
    <View>
      <View
        style={[
          styles.field,
          inGroup ? styles.fieldInGroup : styles.fieldStandalone,
          !inGroup && focused && styles.fieldFocused,
          error && styles.fieldError,
          !inGroup && error && styles.fieldErrorBorder,
        ]}>
        <View style={{ flex: 1 }}>
          {raised && <Text style={[styles.label, error && styles.labelError]}>{label}</Text>}
          <TextInput
            ref={fieldRef}
            value={value}
            onChangeText={(text) => {
              const next = format ? format(text, value) : text;
              onChange(next);
              onValueChange?.(next);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur();
            }}
            placeholder={raised ? placeholder : label}
            placeholderTextColor={raised ? '#B0B0B0' : Brand.textSecondary}
            accessibilityLabel={label}
            accessibilityHint={error ?? helper}
            style={[styles.input, style]}
            {...inputProps}
          />
        </View>
        {trailing}
      </View>
      {!inGroup && <FieldMessage error={error} helper={helper} />}
    </View>
  );
}

/** Several fields in one bordered box, like first + last name or the card number block. */
export function FieldGroup({ children, errors = [], helper }: { children: ReactNode; errors?: (string | undefined)[]; helper?: string }) {
  const firstError = errors.find(Boolean);
  return (
    <View>
      <View style={[styles.group, firstError && styles.fieldErrorBorder]}>{children}</View>
      <FieldMessage error={firstError} helper={helper} />
    </View>
  );
}

export function GroupDivider({ vertical }: { vertical?: boolean }) {
  return <View style={vertical ? styles.dividerVertical : styles.divider} />;
}

export function FieldMessage({ error, helper }: { error?: string; helper?: string }) {
  if (error) {
    return (
      <View style={styles.messageRow} accessibilityLiveRegion="polite">
        <DangerCircleIcon size={16} color={ERROR} strokeWidth={2} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  if (helper) return <Text style={styles.helper}>{helper}</Text>;
  return null;
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Brand.background,
  },
  fieldStandalone: {
    borderWidth: 1,
    borderColor: '#B0B0B0',
    borderRadius: 12,
  },
  fieldInGroup: {
    flex: 1,
  },
  fieldFocused: {
    borderWidth: 2,
    borderColor: Brand.text,
    paddingHorizontal: 13,
  },
  fieldError: {
    backgroundColor: ERROR_BG,
  },
  fieldErrorBorder: {
    borderColor: ERROR,
  },
  label: {
    fontSize: 12,
    color: Brand.textSecondary,
  },
  labelError: {
    color: ERROR,
  },
  input: {
    fontSize: 17,
    color: Brand.text,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  group: {
    borderWidth: 1,
    borderColor: '#B0B0B0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#B0B0B0',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#B0B0B0',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: ERROR,
  },
  helper: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: Brand.textSecondary,
  },
});
