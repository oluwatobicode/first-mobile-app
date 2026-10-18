import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Alert, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';

import { CodeField } from '@/components/form/code-field';
import { FormView } from '@/components/form-view';
import { LetterIcon } from '@/components/icons';
import { KeyboardBar } from '@/components/keyboard-bar';
import { Button, FooterBar, ScreenHeader, TextLink } from '@/components/ui';
import { codeSchema, type CodeForm } from '@/lib/validation';
import { createStyles } from '@/hooks/use-theme';

function newCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

type Props = {
  /** Where the code was "sent", e.g. "+234 0801 234 5678". */
  destination: string;
  leading?: 'close' | 'back';
  onVerified: () => void;
};

/** "Confirm your number": enter the SMS code. A fake SMS banner shows the code, since nothing is really sent. */
export function VerifyCodeScreen({ destination, leading = 'close', onVerified }: Props) {
  const styles = useStyles();
  const [expected, setExpected] = useState(newCode);
  const [showSms, setShowSms] = useState(true);
  const { control, handleSubmit, setError, setValue, reset } = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  });
  const code = useWatch({ control, name: 'code' });

  const submit = handleSubmit(({ code }) => {
    if (code !== expected) {
      setError('code', { message: 'That code doesn’t match. Try again.' });
      return;
    }
    onVerified();
  });

  const resend = () => {
    setExpected(newCode());
    reset({ code: '' });
    setShowSms(true);
  };

  return (
    <FormView>
      <KeyboardBar />
      <ScreenHeader title="Confirm your number" leading={leading} safeTop={false} />

      {showSms && (
        <Animated.View entering={FadeInDown.delay(600).springify()} exiting={FadeOutUp} style={styles.sms}>
          <Pressable
            style={styles.smsInner}
            accessibilityRole="button"
            accessibilityLabel={`Message: your confirmation code is ${expected}. Tap to fill it in.`}
            onPress={() => {
              setValue('code', expected);
              setShowSms(false);
              submit();
            }}>
            <View style={styles.smsIcon}>
              <LetterIcon size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.smsTitle}>Messages · now</Text>
              <Text style={styles.smsBody}>Your confirmation code is {expected}. Tap to fill it in.</Text>
            </View>
          </Pressable>
        </Animated.View>
      )}

      <Animated.View layout={LinearTransition} style={styles.content}>
        <Text style={styles.body}>Enter the code we sent over SMS to {destination}:</Text>
        <View>
          <CodeField control={control} name="code" onComplete={() => submit()} />
        </View>
        <Text style={styles.body}>
          Didn’t get an SMS?{' '}
          <Text style={styles.link} onPress={resend}>
            Send again
          </Text>
        </Text>
        <TextLink
          label="More options"
          onPress={() => Alert.alert('More options', 'You could get a call instead, or use WhatsApp. (Just pretend for now.)')}
        />
      </Animated.View>

      <FooterBar>
        <Button label="Continue" tone="dark" disabled={code.length < 4} onPress={submit} style={{ flex: 1 }} />
      </FooterBar>
    </FormView>
  );
}

const useStyles = createStyles((c) => ({
  content: {
    flex: 1,
    padding: 24,
    gap: 26,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    color: c.text,
  },
  link: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  sms: {
    marginHorizontal: 12,
    marginTop: 12,
  },
  smsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: c.elevated,
    boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
  },
  smsIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
  },
  smsBody: {
    marginTop: 2,
    fontSize: 15,
    color: c.text,
  },
}));
