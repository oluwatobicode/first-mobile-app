import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldGroup, GroupDivider, TextField } from '@/components/form/text-field';
import { FormView } from '@/components/form-view';
import { KEYBOARD_BAR_ID, KeyboardBar } from '@/components/keyboard-bar';
import { EditableRow, InlineSave } from '@/components/profile/editable-row';
import {
  addressSchema,
  emailSchema,
  emergencySchema,
  legalNameSchema,
  phoneSchema,
  preferredNameSchema,
  type AddressForm,
  type EmergencyForm,
  type LegalNameForm,
  type PreferredNameForm,
} from '@/components/profile/schemas';
import { Button, ScreenHeader } from '@/components/ui';
import { NIGERIA } from '@/data/countries';
import { useAuth, type User } from '@/hooks/use-auth';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { createStyles } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { formatPhone } from '@/lib/format';
import type { EmailForm, PhoneForm } from '@/lib/validation';

type RowKey = 'legal' | 'preferred' | 'phone' | 'email' | 'address' | 'emergency';

type Extra = {
  preferredName: string;
  address: AddressForm | null;
  emergency: EmergencyForm | null;
};

const EMPTY_EXTRA: Extra = { preferredName: '', address: null, emergency: null };

export default function PersonalInfoScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  if (!user) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title="Personal information" />
        <View style={{ padding: 24, gap: 16 }}>
          <Text style={styles.intro}>Log in to see and edit your personal information.</Text>
          <Button label="Log in" onPress={() => router.replace('/login')} />
        </View>
      </View>
    );
  }

  return (
    <FormView>
      <KeyboardBar />
      <ScreenHeader title="Personal information" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <PersonalInfoRows user={user} />
      </ScrollView>
    </FormView>
  );
}

function PersonalInfoRows({ user }: { user: User }) {
  const styles = useStyles();
  const toast = useToast();
  const { updateUser, findByEmail } = useAuth();
  const [extra, setExtra] = usePersistedState<Extra>(`personal-info:${user.id}`, EMPTY_EXTRA);
  const [editing, setEditing] = useState<RowKey | null>(null);

  const rowProps = (key: RowKey) => ({
    editing: editing === key,
    dimmed: editing !== null && editing !== key,
    onEdit: () => setEditing(key),
    onCancel: () => setEditing(null),
  });

  const done = (message: string) => {
    setEditing(null);
    toast.show({ message });
  };

  const country = user.phone?.country ?? NIGERIA;

  return (
    <>
      <Text style={styles.intro}>Edit the details hosts and Airbnb use to reach you. Only you can see this page.</Text>

      <EditableRow
        label="Legal name"
        value={`${user.firstName} ${user.lastName}`}
        description="Make sure this matches the name on your government ID."
        {...rowProps('legal')}>
        <LegalNameEditor
          initial={{ firstName: user.firstName, lastName: user.lastName }}
          onSave={(values) => {
            updateUser(values);
            done('Legal name updated');
          }}
        />
      </EditableRow>

      <EditableRow
        label="Preferred first name"
        value={extra.preferredName}
        description="This is how your first name will appear to hosts and guests."
        {...rowProps('preferred')}>
        <PreferredNameEditor
          initial={{ preferredName: extra.preferredName }}
          onSave={({ preferredName }) => {
            setExtra((current) => ({ ...current, preferredName }));
            done('Preferred name saved');
          }}
        />
      </EditableRow>

      <EditableRow
        label="Phone number"
        value={user.phone ? `${user.phone.country.dial} ${user.phone.number}` : undefined}
        description={`Add a number so confirmed guests and Airbnb can get in touch. Country code ${country.dial}.`}
        {...rowProps('phone')}>
        <PhoneEditor
          initial={{ phone: user.phone?.number ?? '' }}
          dial={country.dial}
          onSave={({ phone }) => {
            updateUser({ phone: { country, number: phone } });
            done('Phone number updated');
          }}
        />
      </EditableRow>

      <EditableRow label="Email" value={user.email} description="Use an address you’ll always have access to." {...rowProps('email')}>
        <EmailEditor
          initial={{ email: user.email }}
          isTaken={(email) => {
            const existing = findByEmail(email);
            return Boolean(existing && existing.id !== user.id);
          }}
          onSave={({ email }) => {
            updateUser({ email });
            done('Email updated');
          }}
        />
      </EditableRow>

      <EditableRow
        label="Address"
        value={extra.address ? `${extra.address.street}, ${extra.address.city}, ${extra.address.state}` : undefined}
        description="Use a permanent address where you can receive mail."
        {...rowProps('address')}>
        <AddressEditor
          initial={extra.address ?? { street: '', city: '', state: '' }}
          onSave={(address) => {
            setExtra((current) => ({ ...current, address }));
            done('Address saved');
          }}
        />
      </EditableRow>

      <EditableRow
        label="Emergency contact"
        value={extra.emergency ? `${extra.emergency.contactName} (${extra.emergency.relationship}) · ${extra.emergency.contactPhone}` : undefined}
        description="A trusted person we can alert in an urgent situation."
        {...rowProps('emergency')}>
        <EmergencyEditor
          initial={extra.emergency ?? { contactName: '', relationship: '', contactPhone: '' }}
          onSave={(emergency) => {
            setExtra((current) => ({ ...current, emergency }));
            done('Emergency contact saved');
          }}
        />
      </EditableRow>
    </>
  );
}

function LegalNameEditor({ initial, onSave }: { initial: LegalNameForm; onSave: (values: LegalNameForm) => void }) {
  const { control, handleSubmit, formState } = useForm<LegalNameForm>({
    resolver: zodResolver(legalNameSchema),
    defaultValues: initial,
    mode: 'onTouched',
  });
  return (
    <>
      <FieldGroup errors={[formState.errors.firstName?.message, formState.errors.lastName?.message]}>
        <TextField control={control} name="firstName" label="First name on ID" inGroup autoFocus autoComplete="given-name" textContentType="givenName" />
        <GroupDivider />
        <TextField control={control} name="lastName" label="Last name on ID" inGroup autoComplete="family-name" textContentType="familyName" />
      </FieldGroup>
      <InlineSave onPress={handleSubmit(onSave)} disabled={!formState.isDirty} />
    </>
  );
}

function PreferredNameEditor({ initial, onSave }: { initial: PreferredNameForm; onSave: (values: PreferredNameForm) => void }) {
  const { control, handleSubmit, formState } = useForm<PreferredNameForm>({
    resolver: zodResolver(preferredNameSchema),
    defaultValues: initial,
    mode: 'onTouched',
  });
  return (
    <>
      <TextField control={control} name="preferredName" label="Preferred first name (optional)" autoFocus autoComplete="nickname" />
      <InlineSave onPress={handleSubmit(onSave)} disabled={!formState.isDirty} />
    </>
  );
}

function PhoneEditor({ initial, dial, onSave }: { initial: PhoneForm; dial: string; onSave: (values: PhoneForm) => void }) {
  const styles = useStyles();
  const { control, handleSubmit, formState } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: initial,
    mode: 'onTouched',
  });
  return (
    <>
      <TextField
        control={control}
        name="phone"
        label="Phone number"
        format={formatPhone}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel-national"
        inputAccessoryViewID={KEYBOARD_BAR_ID}
        autoFocus
        trailing={<Text style={styles.dial}>{dial}</Text>}
      />
      <InlineSave onPress={handleSubmit(onSave)} disabled={!formState.isDirty} />
    </>
  );
}

function EmailEditor({ initial, isTaken, onSave }: { initial: EmailForm; isTaken: (email: string) => boolean; onSave: (values: EmailForm) => void }) {
  const { control, handleSubmit, formState, setError } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: initial,
    mode: 'onTouched',
  });
  const save = handleSubmit((values) => {
    if (isTaken(values.email)) {
      setError('email', { message: 'Another account already uses this email.' });
      return;
    }
    onSave(values);
  });
  return (
    <>
      <TextField
        control={control}
        name="email"
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={save}
      />
      <InlineSave onPress={save} disabled={!formState.isDirty} />
    </>
  );
}

function AddressEditor({ initial, onSave }: { initial: AddressForm; onSave: (values: AddressForm) => void }) {
  const { control, handleSubmit, formState } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial,
    mode: 'onTouched',
  });
  return (
    <>
      <FieldGroup errors={[formState.errors.street?.message, formState.errors.city?.message, formState.errors.state?.message]}>
        <TextField control={control} name="street" label="Street address" inGroup autoFocus autoComplete="street-address" textContentType="fullStreetAddress" />
        <GroupDivider />
        <TextField control={control} name="city" label="City" inGroup autoComplete="postal-address-locality" textContentType="addressCity" />
        <GroupDivider />
        <TextField control={control} name="state" label="State / region" inGroup autoComplete="postal-address-region" textContentType="addressState" />
      </FieldGroup>
      <InlineSave onPress={handleSubmit(onSave)} disabled={!formState.isDirty} />
    </>
  );
}

function EmergencyEditor({ initial, onSave }: { initial: EmergencyForm; onSave: (values: EmergencyForm) => void }) {
  const { control, handleSubmit, formState } = useForm<EmergencyForm>({
    resolver: zodResolver(emergencySchema),
    defaultValues: initial,
    mode: 'onTouched',
  });
  return (
    <>
      <TextField control={control} name="contactName" label="Name" autoFocus autoComplete="name" />
      <TextField control={control} name="relationship" label="Relationship" placeholder="e.g. Sister, friend" />
      <TextField
        control={control}
        name="contactPhone"
        label="Phone number"
        format={formatPhone}
        keyboardType="phone-pad"
        inputAccessoryViewID={KEYBOARD_BAR_ID}
      />
      <InlineSave onPress={handleSubmit(onSave)} disabled={!formState.isDirty} />
    </>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  intro: {
    marginTop: 20,
    marginBottom: 4,
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
  },
  dial: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textSecondary,
  },
}));
