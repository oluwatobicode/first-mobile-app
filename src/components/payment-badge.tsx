import { Text, View } from 'react-native';

import { CardIcon, SmartphoneIcon, WalletIcon } from '@/components/icons';
import type { PaymentMethod } from '@/hooks/use-booking';
import { createStyles, useTheme } from '@/hooks/use-theme';

type CardBrand = NonNullable<PaymentMethod['brand']>;

/** Small framed logo for a saved payment method, like the ones in the "Pay with" rows. */
export function PaymentBadge({ method }: { method: Pick<PaymentMethod, 'kind' | 'brand'> }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.frame}>
      {method.kind === 'card' ? (
        <BrandMark brand={method.brand ?? 'visa'} />
      ) : method.kind === 'bank' ? (
        <WalletIcon size={22} color={colors.text} />
      ) : (
        <SmartphoneIcon size={22} color={colors.text} />
      )}
    </View>
  );
}

/** Text-and-shape stand-ins for card network logos. */
export function BrandMark({ brand, scale = 1 }: { brand: CardBrand; scale?: number }) {
  const styles = useStyles();
  if (brand === 'mastercard') {
    const size = 18 * scale;
    return (
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: size, height: size, borderRadius: size, backgroundColor: '#EB001B' }} />
        <View style={{ width: size, height: size, borderRadius: size, backgroundColor: '#F79E1B', marginLeft: -size * 0.4, opacity: 0.9 }} />
      </View>
    );
  }
  const label = { visa: 'VISA', verve: 'Verve', amex: 'AMEX' }[brand];
  const color = { visa: '#1A1F71', verve: '#00425F', amex: '#2E77BC' }[brand];
  return (
    <Text style={[styles.mark, { color, fontSize: 13 * scale }, brand === 'visa' && styles.italic]}>{label}</Text>
  );
}

export function detectBrand(number: string): CardBrand {
  const digits = number.replace(/\D/g, '');
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^5[1-5]|^2[2-7]/.test(digits)) return 'mastercard';
  if (/^50|^650|^507/.test(digits)) return 'verve';
  return 'visa';
}

export function GenericCardIcon() {
  return <CardIcon size={34} color="#B0B0B0" />;
}

const useStyles = createStyles((c) => ({
  frame: {
    width: 52,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.background,
  },
  mark: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  italic: {
    fontStyle: 'italic',
  },
}));
