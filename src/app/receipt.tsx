import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { confirmationCode, nightsOf, paymentLabel, statusLabel, VAT_RATE } from '@/components/trips/trip-utils';
import { Button, FooterBar, ScreenHeader } from '@/components/ui';
import { formatPrice, getListing, type Listing } from '@/data/listings';
import { isNightly, useBooking, type Trip } from '@/hooks/use-booking';
import { createStyles } from '@/hooks/use-theme';
import { formatDay, formatLong, toKey } from '@/lib/dates';

export default function ReceiptScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { trips } = useBooking();
  const trip = trips.find((t) => t.id === tripId);
  const listing = trip ? getListing(trip.listingId) : undefined;
  if (!trip || !listing) return <ScreenHeader title="Receipt" leading="close" safeTop={false} />;
  return <Receipt trip={trip} listing={listing} />;
}

function Receipt({ trip, listing }: { trip: Trip; listing: Listing }) {
  const styles = useStyles();
  const { paymentMethods, selectedPaymentId } = useBooking();

  const code = confirmationCode(trip.id);
  const nightly = isNightly(listing);
  const units = nightly ? nightsOf(trip) : Math.max(1, trip.guestCount);
  const unitLabel = nightly ? `night${units === 1 ? '' : 's'}` : `guest${units === 1 ? '' : 's'}`;
  const subtotal = listing.price * units;
  const vat = Math.round(subtotal * VAT_RATE);
  const total = trip.total || subtotal + vat;
  const due = Math.max(0, total - trip.paid);
  const method = paymentLabel(paymentMethods, selectedPaymentId);
  const booked = formatLong(toKey(new Date(trip.createdAt)));
  const dates = trip.checkOut ? `${formatDay(trip.checkIn)} – ${formatDay(trip.checkOut)}, ${trip.checkOut.slice(0, 4)}` : formatLong(trip.checkIn);
  const guests = `${trip.guestCount} guest${trip.guestCount === 1 ? '' : 's'}`;

  const share = () => {
    const lines = [
      `Receipt · ${code}`,
      listing.title,
      `${dates} · ${guests}`,
      `${formatPrice(listing.price)} × ${units} ${unitLabel}: ${formatPrice(subtotal)}`,
      `VAT (7.5%): ${formatPrice(vat)}`,
      `Total (NGN): ${formatPrice(total)}`,
      `Paid: ${formatPrice(trip.paid)} with ${method}`,
      trip.refund !== undefined ? `Refunded: ${formatPrice(trip.refund)}` : null,
      `Booked ${booked}`,
    ].filter(Boolean);
    Share.share({ message: lines.join('\n'), title: `Receipt ${code}` }).catch(() => {});
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Receipt" leading="close" safeTop={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Confirmation code</Text>
        <Text style={styles.code} selectable>
          {code}
        </Text>
        <Text style={styles.muted}>
          {statusLabel(trip)} · Booked {booked}
        </Text>

        <View style={styles.card}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.muted}>Hosted by {listing.host.name}</Text>
          <View style={styles.divider} />
          <Row label="Dates" value={dates} />
          <Row label="Guests" value={guests} />
        </View>

        <Text style={styles.sectionTitle}>Price breakdown</Text>
        <View style={styles.card}>
          <Row label={`${formatPrice(listing.price)} × ${units} ${unitLabel}`} value={formatPrice(subtotal)} />
          <Row label="VAT (7.5%)" value={formatPrice(vat)} />
          <View style={styles.divider} />
          <Row label="Total (NGN)" value={formatPrice(total)} bold />
        </View>

        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.card}>
          <Row label="Amount paid" value={formatPrice(trip.paid)} />
          {due > 0 && trip.status !== 'cancelled' && <Row label="Still to pay" value={formatPrice(due)} />}
          {trip.refund !== undefined && <Row label="Refunded" value={`−${formatPrice(trip.refund)}`} />}
          <Row label="Payment method" value={method} />
          <Row label="Booked on" value={booked} />
        </View>

        <Text style={styles.footnote}>Prices include all fees. Keep this receipt for your records.</Text>
      </ScrollView>
      <FooterBar>
        <Button label="Share receipt" tone="dark" onPress={share} style={{ flex: 1 }} />
      </FooterBar>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: c.textSecondary,
  },
  code: {
    marginTop: 6,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  muted: {
    marginTop: 4,
    fontSize: 15,
    color: c.textSecondary,
  },
  card: {
    marginTop: 16,
    padding: 20,
    gap: 12,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.inputBorder,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
  },
  sectionTitle: {
    marginTop: 32,
    fontSize: 20,
    fontWeight: '600',
    color: c.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowLabel: {
    flexShrink: 1,
    fontSize: 16,
    color: c.text,
  },
  rowValue: {
    fontSize: 16,
    color: c.text,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  bold: {
    fontWeight: '700',
  },
  footnote: {
    marginTop: 24,
    fontSize: 13,
    lineHeight: 18,
    color: c.textSecondary,
  },
}));
