import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldGroup, GroupDivider, TextField } from '@/components/form/text-field';
import { FormView } from '@/components/form-view';
import { AltArrowDownIcon, LetterIcon } from '@/components/icons';
import { KEYBOARD_BAR_ID, KeyboardBar } from '@/components/keyboard-bar';
import { Button, ScreenHeader } from '@/components/ui';
import { Brand } from '@/constants/theme';
import { DEMO_LOGIN, useAuth } from '@/hooks/use-auth';
import { useBooking } from '@/hooks/use-booking';
import { formatPhone } from '@/lib/format';
import { phoneSchema, type PhoneForm } from '@/lib/validation';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { pickerCountry } = useBooking();
  const { setPending } = useAuth();
  const country = pickerCountry.phone;

  const { control, handleSubmit, formState } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
    mode: 'onTouched',
  });

  const submit = handleSubmit(({ phone }) => {
    setPending({ method: 'phone', country, number: phone });
    router.push('/verify');
  });

  return (
    <FormView>
      <KeyboardBar label="Continue" onPress={submit} />
      <ScreenHeader title="Log in or sign up" leading="close" safeTop={false} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
        <FieldGroup errors={[formState.errors.phone?.message]}>
          <Pressable
            style={styles.countryRow}
            onPress={() => router.push({ pathname: '/country-picker', params: { target: 'phone' } })}
            accessibilityRole="button"
            accessibilityLabel={`Country or region, ${country.name} ${country.dial}`}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Country/Region</Text>
              <Text style={styles.inputValue}>
                {country.name} ({country.dial})
              </Text>
            </View>
            <AltArrowDownIcon size={24} strokeWidth={2} />
          </Pressable>
          <GroupDivider />
          <TextField
            control={control}
            name="phone"
            label="Phone number"
            inGroup
            format={formatPhone}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel-national"
            inputAccessoryViewID={KEYBOARD_BAR_ID}
          />
        </FieldGroup>

        <Text style={styles.note}>
          We’ll call or text to confirm your number. Standard message and data rates apply. Try {DEMO_LOGIN.phone} to log in to the demo account.
        </Text>

        <Button label="Continue" onPress={submit} style={{ marginTop: 22 }} />

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        <View style={styles.socials}>
          <SocialButton label="Continue with email" icon={<LetterIcon size={26} />} onPress={() => router.push('/email')} />
          {Platform.OS === 'ios' && <SocialButton label="Continue with Apple" icon={<Text style={styles.apple}>{''}</Text>} />}
          <SocialButton label="Continue with Google" icon={<Text style={styles.googleG}>G</Text>} />
          <SocialButton
            label="Continue with Facebook"
            icon={
              <View style={styles.facebook}>
                <Text style={styles.facebookF}>f</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </FormView>
  );
}

function SocialButton({ label, icon, onPress }: { label: string; icon: ReactNode; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress ?? (() => Alert.alert(label, 'Social logins aren’t wired up in this practice app. Use phone or email.'))}
      accessibilityRole="button"
      style={({ pressed }) => [styles.social, pressed && { backgroundColor: Brand.surface }]}>
      <View style={styles.socialIcon}>{icon}</View>
      <Text style={styles.socialText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: Brand.textSecondary,
  },
  inputValue: {
    marginTop: 2,
    fontSize: 16,
    color: Brand.text,
  },
  note: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: Brand.text,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 26,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  orText: {
    fontSize: 13,
    color: Brand.text,
  },
  socials: {
    gap: 14,
  },
  social: {
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    position: 'absolute',
    left: 18,
    width: 26,
    alignItems: 'center',
  },
  socialText: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.text,
  },
  apple: {
    fontSize: 24,
    color: '#000000',
  },
  googleG: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4285F4',
  },
  facebook: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  facebookF: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
    marginRight: -3,
  },
});
