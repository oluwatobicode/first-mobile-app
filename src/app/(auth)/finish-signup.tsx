import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useController, useForm, type Control } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldGroup, GroupDivider, TextField } from '@/components/form/text-field';
import { FormView } from '@/components/form-view';
import { CheckIcon } from '@/components/icons';
import { KEYBOARD_BAR_ID, KeyboardBar } from '@/components/keyboard-bar';
import { Button, ScreenHeader } from '@/components/ui';
import { Brand } from '@/constants/theme';
import { exitAuth, useAuth } from '@/hooks/use-auth';
import { formatBirthday } from '@/lib/format';
import { signupSchema, signupWithPasswordSchema, type SignupForm } from '@/lib/validation';

export default function FinishSignupScreen() {
  const insets = useSafeAreaInsets();
  const { pending, findByEmail, register, signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const withEmail = pending?.method === 'email';

  const { control, handleSubmit, setError, setFocus, formState } = useForm<SignupForm>({
    resolver: zodResolver(withEmail ? signupWithPasswordSchema : signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      birthday: '',
      email: withEmail ? pending.email : '',
      password: '',
      marketingOptOut: false,
    },
    mode: 'onTouched',
  });

  if (!pending) return null;

  const submit = handleSubmit((values) => {
    if (!withEmail && findByEmail(values.email)) {
      setError('email', { message: 'An account already uses this email. Log in with email instead.' }, { shouldFocus: true });
      return;
    }
    const account = register({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      birthday: values.birthday,
      email: values.email.trim(),
      password: withEmail ? values.password : undefined,
      phone: pending.method === 'phone' ? { country: pending.country, number: pending.number } : undefined,
    });
    signIn(account);
    exitAuth();
  });

  return (
    <FormView>
      <KeyboardBar label="Next" onPress={() => setFocus('email')} />
      <ScreenHeader title="Finish signing up" safeTop={false} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
        <View style={styles.section}>
          <Text style={styles.caption}>Legal name</Text>
          <FieldGroup
            errors={[formState.errors.firstName?.message, formState.errors.lastName?.message]}
            helper="Make sure this matches the name on your government ID.">
            <TextField
              control={control}
              name="firstName"
              label="First name on ID"
              inGroup
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              returnKeyType="next"
              onSubmitEditing={() => setFocus('lastName')}
              autoFocus
            />
            <GroupDivider />
            <TextField
              control={control}
              name="lastName"
              label="Last name on ID"
              inGroup
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
              returnKeyType="next"
              onSubmitEditing={() => setFocus('birthday')}
            />
          </FieldGroup>
        </View>

        <View style={styles.section}>
          <Text style={styles.caption}>Date of birth</Text>
          <TextField
            control={control}
            name="birthday"
            label="Birthday"
            placeholder="DD/MM/YYYY"
            format={formatBirthday}
            onValueChange={(value) => value.length === 10 && setFocus('email')}
            keyboardType="number-pad"
            autoComplete="birthdate-full"
            inputAccessoryViewID={KEYBOARD_BAR_ID}
            helper="To sign up, you need to be at least 18. Other people won’t see your birthday."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.caption}>Contact info</Text>
          <TextField
            control={control}
            name="email"
            label="Email"
            editable={!withEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType={withEmail ? 'next' : 'done'}
            onSubmitEditing={() => (withEmail ? setFocus('password') : submit())}
            helper="We’ll email you trip confirmations and receipts."
          />
        </View>

        {withEmail && (
          <View style={styles.section}>
            <Text style={styles.caption}>Password</Text>
            <TextField
              control={control}
              name="password"
              label="Password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={() => submit()}
              helper="At least 8 characters, with a number or symbol."
              trailing={
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} accessibilityRole="button">
                  <Text style={styles.toggle}>{showPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              }
            />
          </View>
        )}

        <Text style={styles.legal}>
          By selecting <Text style={styles.bold}>Agree and continue</Text>, I agree to the{' '}
          <Text style={styles.link}>Terms of Service</Text>, <Text style={styles.link}>Payments Terms</Text>, and{' '}
          <Text style={styles.link}>Nondiscrimination Policy</Text>, and acknowledge the <Text style={styles.link}>Privacy Policy</Text>.
        </Text>

        <Button label="Agree and continue" onPress={submit} loading={formState.isSubmitting} />

        <Checkbox control={control} label="I don’t want to receive marketing messages. I can change this in my account settings." />
      </ScrollView>
    </FormView>
  );
}

function Checkbox({ control, label }: { control: Control<SignupForm>; label: string }) {
  const { field } = useController({ control, name: 'marketingOptOut' });
  return (
    <Pressable
      style={styles.checkboxRow}
      onPress={() => field.onChange(!field.value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: field.value }}>
      <Text style={styles.checkboxLabel}>{label}</Text>
      <View style={[styles.checkbox, field.value && styles.checkboxChecked]}>
        {field.value && <CheckIcon size={18} color="#FFFFFF" strokeWidth={2.5} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    gap: 26,
  },
  section: {
    gap: 10,
  },
  caption: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.text,
  },
  toggle: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.text,
    textDecorationLine: 'underline',
  },
  legal: {
    fontSize: 13,
    lineHeight: 19,
    color: Brand.text,
  },
  bold: {
    fontWeight: '700',
  },
  link: {
    fontWeight: '600',
    color: '#004CC4',
    textDecorationLine: 'underline',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
  checkboxLabel: {
    flex: 1,
    paddingTop: 16,
    fontSize: 14,
    lineHeight: 20,
    color: Brand.text,
  },
  checkbox: {
    marginTop: 16,
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#B0B0B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: Brand.text,
    backgroundColor: Brand.text,
  },
});
