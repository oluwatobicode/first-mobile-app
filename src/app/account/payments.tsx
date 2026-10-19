import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextField } from '@/components/form/text-field';
import { FormView } from '@/components/form-view';
import { AddIcon, BanknoteIcon, TagIcon } from '@/components/icons';
import { KEYBOARD_BAR_ID, KeyboardBar } from '@/components/keyboard-bar';
import { PaymentBadge } from '@/components/payment-badge';
import { couponSchema, payoutSchema, type CouponForm, type PayoutForm } from '@/components/profile/schemas';
import { UnderlineTabs } from '@/components/profile/settings-ui';
import { Button, Radio, ScreenHeader, TextLink } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { useBooking } from '@/hooks/use-booking';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { useSettings } from '@/hooks/use-settings';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { onlyDigits } from '@/lib/format';

type Tab = 'payments' | 'payouts';

const NIGERIAN_BANKS = [
  'Access Bank',
  'First Bank of Nigeria',
  'Guaranty Trust Bank (GTBank)',
  'Kuda Microfinance Bank',
  'Moniepoint MFB',
  'OPay',
  'Stanbic IBTC Bank',
  'United Bank for Africa (UBA)',
  'Wema Bank (ALAT)',
  'Zenith Bank',
];

type Payout = { bank: string; last4: string };

export default function PaymentsScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'payouts' ? 'payouts' : 'payments');

  return (
    <FormView>
      <KeyboardBar />
      <ScreenHeader title="Payments and payouts" />
      <View style={{ paddingHorizontal: 24 }}>
        <UnderlineTabs
          tabs={[
            { key: 'payments', label: 'Payments' },
            { key: 'payouts', label: 'Payouts' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Animated.View key={tab} entering={FadeIn.duration(180)} style={styles.tabBody}>
          {tab === 'payments' ? <PaymentsTab /> : <PayoutsTab />}
        </Animated.View>
      </ScrollView>
    </FormView>
  );
}

function PaymentsTab() {
  const styles = useStyles();
  const { colors } = useTheme();
  const toast = useToast();
  const { paymentMethods, selectedPaymentId, selectPayment } = useBooking();
  const defaultId = selectedPaymentId ?? paymentMethods[0]?.id;

  const { control, handleSubmit, setError, reset } = useForm<CouponForm>({
    resolver: zodResolver(couponSchema),
    defaultValues: { code: '' },
  });

  const redeem = handleSubmit(({ code }) => {
    const normalized = code.trim().toUpperCase();
    if (normalized !== 'DETTY2026') {
      setError('code', { message: 'Invalid code. Check it and try again.' });
      return;
    }
    reset({ code: '' });
    toast.show({ message: '🎉 Coupon added: ₦25,000 off your next stay' });
  });

  return (
    <>
      <Text style={styles.heading}>Your payment methods</Text>
      <Text style={styles.body}>Add a payment method using our secure payment system, then start planning your next trip.</Text>

      <View style={{ marginTop: 12 }}>
        {paymentMethods.map((method) => {
          const isDefault = method.id === defaultId;
          return (
            <View key={method.id} style={styles.methodRow}>
              <PaymentBadge method={method} />
              <View style={{ flex: 1 }}>
                <Text style={styles.methodLabel}>{method.label}</Text>
                {isDefault ? (
                  <Text style={styles.defaultBadge}>DEFAULT</Text>
                ) : (
                  <TextLink
                    label="Set as default"
                    size={14}
                    onPress={() => {
                      selectPayment(method.id);
                      toast.show({ message: `${method.label} is now your default` });
                    }}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={() => router.push('/booking/pay-with')}
        style={({ pressed }) => [styles.addRow, pressed && { opacity: 0.6 }]}
        accessibilityRole="button">
        <AddIcon size={22} color={colors.text} />
        <Text style={styles.addText}>Add payment method</Text>
      </Pressable>

      <View style={styles.divider} />

      <View style={styles.titleRow}>
        <TagIcon size={22} color={colors.text} />
        <Text style={styles.heading}>Coupons</Text>
      </View>
      <Text style={styles.body}>Have a code from a friend or a promo? Try DETTY2026.</Text>
      <View style={styles.couponRow}>
        <View style={{ flex: 1 }}>
          <TextField
            control={control}
            name="code"
            label="Enter a coupon"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={redeem}
          />
        </View>
        <Button label="Redeem" tone="dark" onPress={redeem} style={styles.redeem} />
      </View>
    </>
  );
}

function PayoutsTab() {
  const styles = useStyles();
  const { colors } = useTheme();
  const toast = useToast();
  const { hostMode } = useSettings();
  const { user } = useAuth();
  const [payout, setPayout] = usePersistedState<Payout | null>(`payout:${user?.id ?? 'guest'}`, null);
  const [settingUp, setSettingUp] = useState(false);
  const [bank, setBank] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<PayoutForm>({
    resolver: zodResolver(payoutSchema),
    defaultValues: { accountNumber: '' },
    mode: 'onTouched',
  });

  const save = handleSubmit(({ accountNumber }) => {
    if (!bank) return;
    setPayout({ bank, last4: accountNumber.slice(-4) });
    setSettingUp(false);
    setBank(null);
    reset();
    toast.show({ message: 'Payout method added' });
  });

  if (!settingUp) {
    return (
      <>
        <Text style={styles.heading}>How you’ll get paid</Text>
        <Text style={styles.body}>
          {hostMode
            ? 'Add at least one payout method so we know where to send your money.'
            : 'When you host, this is where you choose how to get paid. Payouts arrive about 24 hours after a guest checks in.'}
        </Text>
        {payout && (
          <View style={styles.methodRow}>
            <View style={styles.bankBadge}>
              <BanknoteIcon size={22} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodLabel}>{payout.bank}</Text>
              <Text style={styles.body}>Account ending {payout.last4} · NGN</Text>
            </View>
            <Text style={styles.defaultBadge}>DEFAULT</Text>
          </View>
        )}
        <Button
          label={payout ? 'Change payout method' : 'Set up payouts'}
          tone="dark"
          onPress={() => setSettingUp(true)}
          style={{ marginTop: 24, alignSelf: 'flex-start' }}
        />
      </>
    );
  }

  return (
    <>
      <Text style={styles.heading}>Choose your bank</Text>
      <Text style={styles.body}>Payouts are sent in naira (NGN) by bank transfer.</Text>
      <View style={{ marginTop: 8 }} accessibilityRole="radiogroup">
        {NIGERIAN_BANKS.map((name) => {
          const selected = bank === name;
          return (
            <Pressable
              key={name}
              onPress={() => setBank(name)}
              style={styles.bankRow}
              accessibilityRole="radio"
              accessibilityState={{ selected }}>
              <Text style={[styles.methodLabel, { flex: 1 }]}>{name}</Text>
              <Radio selected={selected} />
            </Pressable>
          );
        })}
      </View>
      {bank && (
        <Animated.View entering={FadeIn} style={{ marginTop: 20, gap: 16 }}>
          <TextField
            control={control}
            name="accountNumber"
            label="Account number (NUBAN)"
            format={onlyDigits(10)}
            keyboardType="number-pad"
            inputAccessoryViewID={KEYBOARD_BAR_ID}
            helper={`10-digit ${bank} account in your legal name`}
          />
        </Animated.View>
      )}
      <View style={styles.footerRow}>
        <TextLink
          label="Cancel"
          onPress={() => {
            setSettingUp(false);
            setBank(null);
            reset();
          }}
        />
        <Button label="Save" tone="dark" disabled={!bank} onPress={save} style={{ minWidth: 120 }} />
      </View>
    </>
  );
}

const useStyles = createStyles((c) => ({
  tabBody: {
    paddingTop: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  body: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: c.textSecondary,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: c.text,
    marginBottom: 2,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: c.text,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: c.surface,
  },
  bankBadge: {
    width: 48,
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 20,
  },
  addText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
    textDecorationLine: 'underline',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
    marginVertical: 24,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 16,
  },
  redeem: {
    height: 64,
    paddingHorizontal: 18,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
  },
}));
