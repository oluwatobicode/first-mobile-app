import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FieldGroup, GroupDivider, TextField } from '@/components/form/text-field';
import { FormView } from '@/components/form-view';
import { AltArrowDownIcon, LockBoldIcon } from '@/components/icons';
import { KEYBOARD_BAR_ID, KeyboardBar } from '@/components/keyboard-bar';
import { BrandMark, detectBrand, GenericCardIcon } from '@/components/payment-badge';
import { Button, ScreenHeader, TextLink } from '@/components/ui';
import { useBooking } from '@/hooks/use-booking';
import { formatCardNumber, formatExpiry, onlyDigits } from '@/lib/format';
import { cardSchema, type CardForm } from '@/lib/validation';
import { createStyles, useTheme } from '@/hooks/use-theme';

export default function AddCardScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { addPaymentMethod, pickerCountry } = useBooking();
  const { control, handleSubmit, setFocus, formState } = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
    defaultValues: { number: '', expiry: '', cvv: '', zip: '' },
    mode: 'onTouched',
  });

  const number = useWatch({ control, name: 'number' });
  const digits = number.replace(/\D/g, '');
  const brand = detectBrand(digits);
  const cvvLength = brand === 'amex' ? 4 : 3;
  const { errors } = formState;

  const done = handleSubmit((card) => {
    const cardDigits = card.number.replace(/\D/g, '');
    addPaymentMethod({ kind: 'card', brand: detectBrand(cardDigits), last4: cardDigits.slice(-4), label: `•••• ${cardDigits.slice(-4)}` });
    // Close this screen and the "Pay with" sheet underneath it.
    router.dismiss(2);
  });

  return (
    <FormView>
      <KeyboardBar />
      <ScreenHeader title="Add card details" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <View style={styles.brands}>
          <BrandMark brand="visa" scale={1.3} />
          <BrandMark brand="amex" scale={1.2} />
          <BrandMark brand="mastercard" scale={1.1} />
          <BrandMark brand="verve" scale={1.2} />
        </View>

        <FieldGroup errors={[errors.number?.message, errors.expiry?.message, errors.cvv?.message]}>
          <TextField
            control={control}
            name="number"
            label="Card number"
            placeholder="0000 0000 0000 0000"
            inGroup
            format={formatCardNumber}
            onValueChange={(value) => {
              const length = value.replace(/\D/g, '').length;
              if (length === (detectBrand(value) === 'amex' ? 15 : 16)) setFocus('expiry');
            }}
            keyboardType="number-pad"
            textContentType="creditCardNumber"
            autoComplete="cc-number"
            inputAccessoryViewID={KEYBOARD_BAR_ID}
            autoFocus
            trailing={
              <View style={styles.trailing}>
                <LockBoldIcon size={14} color={colors.textSecondary} />
                {digits.length >= 2 ? <BrandMark brand={brand} scale={1.2} /> : <GenericCardIcon />}
              </View>
            }
          />
          <GroupDivider />
          <View style={styles.row}>
            <View style={styles.half}>
              <TextField
                control={control}
                name="expiry"
                label="Expiration"
                placeholder="MM / YY"
                inGroup
                format={formatExpiry}
                onValueChange={(value) => value.length === 7 && setFocus('cvv')}
                keyboardType="number-pad"
                autoComplete="cc-exp"
                inputAccessoryViewID={KEYBOARD_BAR_ID}
              />
            </View>
            <GroupDivider vertical />
            <View style={styles.half}>
              <TextField
                control={control}
                name="cvv"
                label="CVV"
                placeholder={brand === 'amex' ? '1234' : '123'}
                inGroup
                format={onlyDigits(cvvLength)}
                onValueChange={(value) => value.length === cvvLength && setFocus('zip')}
                keyboardType="number-pad"
                autoComplete="cc-csc"
                inputAccessoryViewID={KEYBOARD_BAR_ID}
                secureTextEntry
              />
            </View>
          </View>
        </FieldGroup>

        <TextField
          control={control}
          name="zip"
          label="Zip code"
          format={(text) => text.replace(/[^0-9A-Za-z -]/g, '').slice(0, 10)}
          keyboardType="number-pad"
          autoComplete="postal-code"
          inputAccessoryViewID={KEYBOARD_BAR_ID}
        />

        <Pressable
          style={styles.field}
          onPress={() => router.push({ pathname: '/country-picker', params: { target: 'card' } })}
          accessibilityRole="button"
          accessibilityLabel={`Country or region, ${pickerCountry.card.name}`}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Country/region</Text>
            <Text style={styles.fieldValue}>{pickerCountry.card.name}</Text>
          </View>
          <AltArrowDownIcon size={24} strokeWidth={2} />
        </Pressable>

        <View style={styles.actions}>
          <TextLink label="Cancel" onPress={() => router.back()} size={17} />
          <Button label="Done" tone="dark" onPress={done} style={{ minWidth: 130 }} />
        </View>
      </ScrollView>
    </FormView>
  );
}

const useStyles = createStyles((c) => ({
  content: {
    padding: 24,
    gap: 18,
  },
  brands: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    marginBottom: 4,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
  },
  half: {
    flex: 1,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: 12,
  },
  label: {
    fontSize: 12,
    color: c.textSecondary,
  },
  fieldValue: {
    marginTop: 2,
    fontSize: 17,
    color: c.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
}));
