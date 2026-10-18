import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { TextField } from '@/components/form/text-field';
import { FormView } from '@/components/form-view';
import { Button, FooterBar, ScreenHeader } from '@/components/ui';
import { DEMO_LOGIN, useAuth } from '@/hooks/use-auth';
import { emailSchema, type EmailForm } from '@/lib/validation';
import { createStyles } from '@/hooks/use-theme';

export default function EmailScreen() {
  const styles = useStyles();
  const { setPending, findByEmail } = useAuth();
  const { control, handleSubmit } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const submit = handleSubmit(({ email }) => {
    setPending({ method: 'email', email });
    router.push(findByEmail(email) ? '/password' : '/finish-signup');
  });

  return (
    <FormView>
      <ScreenHeader title="Continue with email" safeTop={false} />
      <View style={styles.content}>
        <TextField
          control={control}
          name="email"
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => submit()}
          autoFocus
          helper={`We’ll check if you already have an account. The demo account is ${DEMO_LOGIN.email}.`}
        />
      </View>
      <FooterBar>
        <Button label="Continue" onPress={submit} style={{ flex: 1 }} />
      </FooterBar>
    </FormView>
  );
}

const useStyles = createStyles((c) => ({
  content: {
    flex: 1,
    padding: 24,
  },
}));
