import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Pressable, Text, View } from 'react-native';

import { TextField } from '@/components/form/text-field';
import { FormView } from '@/components/form-view';
import { Button, FooterBar, ScreenHeader, TextLink } from '@/components/ui';
import { DEMO_LOGIN, exitAuth, useAuth } from '@/hooks/use-auth';
import { passwordSchema, type PasswordForm } from '@/lib/validation';
import { createStyles } from '@/hooks/use-theme';

export default function PasswordScreen() {
  const styles = useStyles();
  const { pending, findByEmail, signIn } = useAuth();
  const [visible, setVisible] = useState(false);
  const { control, handleSubmit, setError } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  });

  if (pending?.method !== 'email') return null;
  const account = findByEmail(pending.email);

  const submit = handleSubmit(({ password }) => {
    if (!account || account.password !== password) {
      setError('password', { message: 'Incorrect password. Try again or reset it.' }, { shouldFocus: true });
      return;
    }
    signIn(account);
    exitAuth();
  });

  return (
    <FormView>
      <ScreenHeader title="Log in" safeTop={false} />
      <View style={styles.content}>
        <Text style={styles.welcome}>Welcome back{account ? `, ${account.firstName}` : ''}</Text>
        <Text style={styles.email}>{pending.email}</Text>
        <TextField
          control={control}
          name="password"
          label="Password"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => submit()}
          autoFocus
          helper={pending.email === DEMO_LOGIN.email ? `Demo password: ${DEMO_LOGIN.password}` : undefined}
          trailing={
            <Pressable onPress={() => setVisible((v) => !v)} hitSlop={10} accessibilityRole="button">
              <Text style={styles.toggle}>{visible ? 'Hide' : 'Show'}</Text>
            </Pressable>
          }
        />
        <TextLink
          label="Forgot password?"
          onPress={() => Alert.alert('Reset password', `We’d email a reset link to ${pending.email}. (Not really – this app is offline.)`)}
          size={15}
        />
      </View>
      <FooterBar>
        <Button label="Log in" onPress={submit} style={{ flex: 1 }} />
      </FooterBar>
    </FormView>
  );
}

const useStyles = createStyles((c) => ({
  content: {
    flex: 1,
    padding: 24,
    gap: 18,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '700',
    color: c.text,
  },
  email: {
    marginTop: -10,
    fontSize: 15,
    color: c.textSecondary,
  },
  toggle: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
    textDecorationLine: 'underline',
  },
}));
