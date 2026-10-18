import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useController, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FieldMessage } from '@/components/form/text-field';
import { FormView } from '@/components/form-view';
import { KEYBOARD_BAR_ID, KeyboardBar } from '@/components/keyboard-bar';
import { Button, FooterBar, ScreenHeader } from '@/components/ui';
import { Brand } from '@/constants/theme';
import { useBooking } from '@/hooks/use-booking';
import { formatPhone } from '@/lib/format';
import { phoneSchema, type PhoneForm } from '@/lib/validation';

export default function PhoneScreen() {
  const { pickerCountry, setPhone } = useBooking();
  const country = pickerCountry.phone;

  const { control, handleSubmit, formState } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
    mode: 'onTouched',
  });
  const {
    field: { ref: phoneRef, value: phone, onChange, onBlur },
  } = useController({ control, name: 'phone' });

  const next = handleSubmit(({ phone }) => {
    setPhone({ country, number: phone, verified: false });
    router.push('/booking/verify');
  });

  return (
    <FormView>
      <KeyboardBar label="Next" onPress={next} />
      <ScreenHeader bordered={false} />
      <View style={styles.content}>
        <Text style={styles.title}>Enter a new phone number</Text>
        <Text style={styles.subtitle}>For notifications, reminders, and help logging in</Text>

        <Text style={styles.caption}>PHONE NUMBER</Text>
        <View style={[styles.inputRow, formState.errors.phone && styles.inputRowError]}>
          <Pressable
            style={styles.dial}
            onPress={() => router.push({ pathname: '/country-picker', params: { target: 'phone' } })}
            accessibilityLabel={`Country code ${country.dial}, change`}>
            <Text style={styles.dialText}>{country.dial}</Text>
          </Pressable>
          <TextInput
            ref={phoneRef}
            value={phone}
            onChangeText={(text) => onChange(formatPhone(text))}
            onBlur={onBlur}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel-national"
            inputAccessoryViewID={KEYBOARD_BAR_ID}
            autoFocus
            style={styles.input}
            accessibilityLabel="Phone number"
          />
        </View>
        <FieldMessage error={formState.errors.phone?.message} />
      </View>

      <FooterBar>
        <View />
        <Button label="Next" tone="dark" disabled={phone.replace(/\D/g, '').length < 7} style={{ minWidth: 120 }} onPress={next} />
      </FooterBar>
    </FormView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: Brand.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 18,
    lineHeight: 25,
    color: Brand.text,
  },
  caption: {
    marginTop: 44,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: Brand.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  inputRowError: {
    borderBottomColor: '#C13515',
  },
  dial: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#F2F2F2',
  },
  dialText: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.text,
  },
  input: {
    flex: 1,
    fontSize: 30,
    fontWeight: '500',
    color: Brand.text,
    fontVariant: ['tabular-nums'],
    paddingVertical: 4,
  },
});
