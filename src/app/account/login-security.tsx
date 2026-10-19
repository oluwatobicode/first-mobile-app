import { zodResolver } from '@hookform/resolvers/zod';
import * as Device from 'expo-device';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DevicesIcon } from '@solar-icons/react-native/linear/devices';
import { TextField } from '@/components/form/text-field';
import { FormView } from '@/components/form-view';
import { EditableRow, InlineSave } from '@/components/profile/editable-row';
import { changePasswordSchema, passwordStrength, type ChangePasswordForm } from '@/components/profile/schemas';
import { ScreenHeader, TextLink } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDate = (ms: number) => {
  const d = new Date(ms);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const SOCIALS = [
  { key: 'google', label: 'Google', mark: 'G' },
  { key: 'facebook', label: 'Facebook', mark: 'f' },
] as const;
type Social = (typeof SOCIALS)[number]['key'];

const DEVICE_NAME = Device.modelName ?? (Platform.OS === 'ios' ? 'iPhone' : Platform.OS === 'android' ? 'Android phone' : 'Web browser');

export default function LoginSecurityScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { user, updateUser, signOut } = useAuth();
  const id = user?.id ?? 'guest';
  const [updatedAt, setUpdatedAt] = usePersistedState<number | null>(`password-updated:${id}`, null);
  const [connected, setConnected] = usePersistedState<Record<Social, boolean>>(`social-accounts:${id}`, { google: false, facebook: false });
  const [editing, setEditing] = useState(false);

  return (
    <FormView>
      <ScreenHeader title="Login & security" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Login</Text>
        <EditableRow
          label="Password"
          value={updatedAt ? `Last updated ${formatDate(updatedAt)}` : 'Last updated when you joined'}
          description="Use at least 8 characters, with a number or symbol."
          actionLabel="Update"
          editing={editing}
          dimmed={false}
          onEdit={() => setEditing(true)}
          onCancel={() => setEditing(false)}>
          <PasswordEditor
            currentPassword={user?.password}
            onSave={(next) => {
              updateUser({ password: next });
              setUpdatedAt(Date.now());
              setEditing(false);
              toast.show({ message: 'Password updated' });
            }}
          />
        </EditableRow>

        <Text style={styles.section}>Social accounts</Text>
        {SOCIALS.map((social) => {
          const on = connected[social.key];
          return (
            <View key={social.key} style={styles.row}>
              <View style={styles.socialMark}>
                <Text style={styles.socialMarkText}>{social.mark}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{social.label}</Text>
                <Text style={styles.rowHint}>{on ? 'Connected' : 'Not connected'}</Text>
              </View>
              <TextLink
                label={on ? 'Disconnect' : 'Connect'}
                onPress={() => {
                  setConnected((current) => ({ ...current, [social.key]: !on }));
                  toast.show({ message: on ? `${social.label} disconnected` : `${social.label} connected` });
                }}
              />
            </View>
          );
        })}

        <Text style={styles.section}>Device history</Text>
        <View style={styles.row}>
          <DevicesIcon size={26} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{DEVICE_NAME}</Text>
            <Text style={styles.rowHint}>Expo Go · Lagos · Now</Text>
          </View>
          <Text style={styles.badge}>This device</Text>
        </View>

        <Text style={styles.section}>Account</Text>
        <View style={[styles.row, styles.rowLast]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Deactivate your account</Text>
            <Text style={styles.rowHint}>This can’t be undone</Text>
          </View>
          <TextLink
            label="Deactivate"
            onPress={() =>
              Alert.alert('Deactivate your account?', 'Your profile, listings and reservations will be hidden. In this demo you’ll just be logged out.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Deactivate', style: 'destructive', onPress: signOut },
              ])
            }
          />
        </View>
      </ScrollView>
    </FormView>
  );
}

function PasswordEditor({ currentPassword, onSave }: { currentPassword?: string; onSave: (next: string) => void }) {
  const { control, handleSubmit, setError } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current: '', next: '', confirm: '' },
    mode: 'onTouched',
  });
  const next = useWatch({ control, name: 'next' });

  const save = handleSubmit((values) => {
    if (currentPassword && values.current !== currentPassword) {
      setError('current', { message: 'That’s not your current password.' });
      return;
    }
    onSave(values.next);
  });

  return (
    <>
      <TextField control={control} name="current" label="Current password" secureTextEntry autoFocus autoComplete="current-password" textContentType="password" />
      <TextField control={control} name="next" label="New password" secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <StrengthMeter password={next} />
      <TextField
        control={control}
        name="confirm"
        label="Confirm password"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={save}
      />
      <InlineSave onPress={save} />
    </>
  );
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

function StrengthMeter({ password }: { password: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const score = passwordStrength(password);
  const color = score <= 1 ? colors.error : score === 2 ? '#C97A00' : score === 3 ? '#2E8B57' : '#008A05';

  const fill = useAnimatedStyle(() => ({
    transform: [{ scaleX: withTiming(score / 4, { duration: 220 }) }],
    backgroundColor: withTiming(color, { duration: 220 }),
  }));

  return (
    <View style={styles.meter} accessibilityLabel={`Password strength: ${STRENGTH_LABELS[score]}`}>
      <View style={styles.meterTrack}>
        <Animated.View style={[styles.meterFill, fill]} />
      </View>
      <Text style={styles.meterLabel}>{password ? STRENGTH_LABELS[score] : 'Password strength'}</Text>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  section: {
    marginTop: 32,
    fontSize: 22,
    fontWeight: '700',
    color: c.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 16,
    color: c.text,
  },
  rowHint: {
    marginTop: 2,
    fontSize: 14,
    color: c.textSecondary,
  },
  socialMark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialMarkText: {
    fontSize: 15,
    fontWeight: '800',
    color: c.text,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: c.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: c.surface,
  },
  meter: {
    gap: 6,
    marginTop: -6,
  },
  meterTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: c.surface,
    overflow: 'hidden',
  },
  meterFill: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    transformOrigin: 'left',
  },
  meterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
  },
}));
