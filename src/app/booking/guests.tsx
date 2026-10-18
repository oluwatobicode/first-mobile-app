import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useController, useForm, type Control } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FieldMessage } from '@/components/form/text-field';
import { AddIcon, MinusIcon } from '@/components/icons';
import { Button, ScreenHeader, TextLink } from '@/components/ui';
import { Brand } from '@/constants/theme';
import { useBooking } from '@/hooks/use-booking';
import { guestsSchema, type GuestsForm } from '@/lib/validation';

const TYPES: { key: keyof GuestsForm; label: string; hint: string; min: number }[] = [
  { key: 'adults', label: 'Adults', hint: 'Age 13+', min: 1 },
  { key: 'children', label: 'Children', hint: 'Ages 2 – 12', min: 0 },
  { key: 'infants', label: 'Infants', hint: 'Under 2', min: 0 },
  { key: 'pets', label: 'Pets', hint: 'Bringing a service animal?', min: 0 },
];

export default function GuestsSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { draftFor, updateDraft } = useBooking();
  const { control, handleSubmit, formState } = useForm<GuestsForm>({
    resolver: zodResolver(guestsSchema),
    defaultValues: draftFor(id).guests,
    mode: 'onChange',
  });

  const save = handleSubmit((guests) => {
    updateDraft(id, { guests });
    router.back();
  });

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Guests" leading="close" safeTop={false} />
      <View style={styles.content}>
        {TYPES.map((type, index) => (
          <GuestRow
            key={type.key}
            control={control}
            name={type.key}
            label={type.label}
            hint={type.hint}
            min={type.min}
            bordered={index > 0}
          />
        ))}
        <FieldMessage error={formState.errors.children?.message} />
      </View>
      <View style={styles.footer}>
        <TextLink label="Cancel" onPress={() => router.back()} />
        <Button label="Save" tone="dark" onPress={save} disabled={!formState.isValid} style={{ minWidth: 130 }} />
      </View>
    </View>
  );
}

type GuestRowProps = {
  control: Control<GuestsForm>;
  name: keyof GuestsForm;
  label: string;
  hint: string;
  min: number;
  bordered: boolean;
};

function GuestRow({ control, name, label, hint, min, bordered }: GuestRowProps) {
  const { field } = useController({ control, name });
  return (
    <View style={[styles.row, bordered && styles.rowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <StepButton kind="minus" disabled={field.value <= min} onPress={() => field.onChange(field.value - 1)} label={label} />
      <Text style={styles.value} accessibilityLabel={`${field.value} ${label}`}>
        {field.value}
      </Text>
      <StepButton kind="plus" disabled={field.value >= 16} onPress={() => field.onChange(field.value + 1)} label={label} />
    </View>
  );
}

function StepButton({ kind, disabled, onPress, label }: { kind: 'plus' | 'minus'; disabled: boolean; onPress: () => void; label: string }) {
  const Icon = kind === 'plus' ? AddIcon : MinusIcon;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${kind === 'plus' ? 'Add' : 'Remove'} one ${label.toLowerCase()}`}
      style={[styles.step, disabled && styles.stepDisabled]}>
      <Icon size={18} strokeWidth={2} color={disabled ? '#DDDDDD' : Brand.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  content: {
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.text,
  },
  hint: {
    marginTop: 2,
    fontSize: 14,
    color: Brand.textSecondary,
  },
  value: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 16,
    color: Brand.text,
    fontVariant: ['tabular-nums'],
  },
  step: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#B0B0B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisabled: {
    borderColor: '#EBEBEB',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});
