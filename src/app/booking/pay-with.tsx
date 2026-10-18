import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CardIcon, CheckIcon, SmartphoneIcon, WalletIcon, type SolarIcon } from '@/components/icons';
import { PaymentBadge } from '@/components/payment-badge';
import { ScreenHeader } from '@/components/ui';
import { useBooking, type PaymentMethod } from '@/hooks/use-booking';
import { createStyles, useTheme } from '@/hooks/use-theme';

const OTHER_METHODS: { kind: PaymentMethod['kind']; label: string; Icon: SolarIcon }[] = [
  { kind: 'bank', label: 'Bank transfer', Icon: WalletIcon },
  { kind: 'ussd', label: 'USSD', Icon: SmartphoneIcon },
];

export default function PayWithSheet() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { paymentMethods, selectedPaymentId, selectPayment, addPaymentMethod } = useBooking();

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Pay with" leading="close" safeTop={false} />
      <ScrollView contentContainerStyle={styles.content}>
        {paymentMethods.map((method) => (
          <Pressable
            key={method.id}
            style={styles.row}
            onPress={() => {
              selectPayment(method.id);
              router.back();
            }}>
            <PaymentBadge method={method} />
            <Text style={[styles.label, { flex: 1 }]}>{method.label}</Text>
            {method.id === selectedPaymentId && <CheckIcon size={24} strokeWidth={2} />}
          </Pressable>
        ))}

        <Text style={styles.caption}>ADD PAYMENT METHOD</Text>

        <Pressable style={[styles.row, styles.rowBorder]} onPress={() => router.push('/booking/add-card')}>
          <View style={styles.iconFrame}>
            <CardIcon size={30} color={colors.textSecondary} />
          </View>
          <Text style={styles.label}>Credit or debit card</Text>
        </Pressable>

        {OTHER_METHODS.filter((m) => !paymentMethods.some((saved) => saved.kind === m.kind)).map(({ kind, label, Icon }) => (
          <Pressable
            key={kind}
            style={[styles.row, styles.rowBorder]}
            onPress={() => {
              addPaymentMethod({ kind, label });
              router.back();
            }}>
            <View style={styles.iconFrame}>
              <Icon size={26} color={colors.textSecondary} />
            </View>
            <Text style={styles.label}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  iconFrame: {
    width: 52,
    alignItems: 'center',
  },
  label: {
    fontSize: 17,
    color: c.text,
  },
  caption: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: c.textSecondary,
  },
}));
