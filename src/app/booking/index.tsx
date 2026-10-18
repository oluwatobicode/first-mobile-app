import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CalendarMarkIcon, CheckIcon, MedalRibbonIcon, StarBoldIcon } from '@/components/icons';
import { PaymentBadge } from '@/components/payment-badge';
import { Button, Radio, ScreenHeader, SectionBand, TextLink } from '@/components/ui';
import { Brand } from '@/constants/theme';
import { formatPrice, getListing, placeOf, type Listing } from '@/data/listings';
import { useAuth } from '@/hooks/use-auth';
import { guestLabel, isInstantBook, quoteFor, splitPayment, useBooking, type PayMode } from '@/hooks/use-booking';
import { formatLong, formatRange } from '@/lib/dates';

export default function RequestToBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = getListing(id);
  if (!listing) return null;
  return <RequestToBook listing={listing} />;
}

function RequestToBook({ listing }: { listing: Listing }) {
  const { draftFor, updateDraft, paymentMethods, selectedPaymentId, phone } = useBooking();
  const { user } = useAuth();
  const draft = draftFor(listing.id);
  const quote = quoteFor(draft);
  const payment = paymentMethods.find((m) => m.id === selectedPaymentId);
  const instant = isInstantBook(listing);
  const { kind } = placeOf(listing);
  const cta = instant ? 'Confirm and pay' : 'Request to book';
  const split = quote ? splitPayment(quote.total) : null;

  const openDates = () => router.push({ pathname: '/dates', params: { id: listing.id } });
  const openGuests = () => router.push({ pathname: '/booking/guests', params: { id: listing.id } });
  const openPayWith = () => router.push('/booking/pay-with');
  const openPhone = () => router.push('/booking/phone');
  const setPayMode = (payMode: PayMode) => updateDraft(listing.id, { payMode });

  const submit = () => {
    if (!user) return router.push('/login');
    if (!quote) return openDates();
    if (!payment) return openPayWith();
    if (!phone?.verified) return openPhone();
    router.push({ pathname: '/booking/processing', params: { id: listing.id } });
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={cta} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.section, styles.summary]}>
          <Image source={listing.images[0]} style={styles.summaryImage} contentFit="cover" />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.muted}>{kind}</Text>
            <Text style={styles.summaryTitle} numberOfLines={3}>
              {listing.title}
            </Text>
            <View style={styles.inline}>
              <StarBoldIcon size={14} color={Brand.text} />
              <Text style={styles.small}>
                {listing.rating.toFixed(2)} <Text style={styles.muted}>({listing.reviews})</Text>
              </Text>
              {listing.host.superhost && (
                <>
                  <Text style={styles.muted}> · </Text>
                  <MedalRibbonIcon size={14} />
                  <Text style={styles.muted}>Superhost</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <SectionBand />
        <Section title="Your trip">
          <EditRow
            label="Dates"
            value={draft.checkIn ? formatRange(draft.checkIn, draft.checkOut) : 'Add your dates'}
            onEdit={openDates}
          />
          <EditRow label="Guests" value={guestLabel(draft.guests)} onEdit={openGuests} />
        </Section>

        {quote && (
          <>
            <SectionBand />
            <Section title="Choose how to pay">
              <Pressable style={styles.payOption} onPress={() => setPayMode('full')}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Pay in full</Text>
                  <Text style={styles.body}>Pay the total ({formatPrice(quote.total)}) now and you’re all set.</Text>
                </View>
                <Radio selected={draft.payMode === 'full'} />
              </Pressable>
              <View style={styles.rule} />
              <Pressable style={styles.payOption} onPress={() => setPayMode('part')}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Pay part now, part later</Text>
                  <Text style={styles.body}>
                    {formatPrice(split!.now)} due today, {formatPrice(split!.later)} on{' '}
                    {formatLong(quote.dueLaterDate)}. No extra fees.{' '}
                    <Text style={styles.inlineLink} onPress={() => Alert.alert('Pay part now', 'Pay about half today and the rest two weeks before your trip.')}>
                      More info
                    </Text>
                  </Text>
                </View>
                <Radio selected={draft.payMode === 'part'} />
              </Pressable>
            </Section>

            <SectionBand />
            <Section title="Your total">
              <PriceRow label={quote.unitLabel} value={formatPrice(quote.subtotal)} />
              <PriceRow label="Taxes (7.5% VAT)" value={formatPrice(quote.taxes)} />
              <View style={styles.rule} />
              <PriceRow label="Total (NGN)" value={formatPrice(quote.total)} bold />
              <View style={{ alignSelf: 'flex-end', marginTop: 12 }}>
                <TextLink
                  label="Price breakdown"
                  onPress={() =>
                    Alert.alert(
                      'Price breakdown',
                      `${formatPrice(listing.price)} × ${quote.unitLabel} = ${formatPrice(quote.subtotal)}\nVAT 7.5% = ${formatPrice(quote.taxes)}\n\nTotal ${formatPrice(quote.total)}`
                    )
                  }
                />
              </View>
              {draft.payMode === 'part' && (
                <>
                  <View style={styles.rule} />
                  <PriceRow label="Due now" value={formatPrice(quote.dueNow)} bold />
                  <PriceRow label={`Due ${formatLong(quote.dueLaterDate)}`} value={formatPrice(quote.dueLater)} />
                </>
              )}
            </Section>
          </>
        )}

        <SectionBand />
        <Section title="Pay with">
          {payment ? (
            <View style={styles.row}>
              <PaymentBadge method={payment} />
              <Text style={[styles.body, { flex: 1 }]}>{payment.label}</Text>
              <TextLink label="Edit" onPress={openPayWith} />
            </View>
          ) : (
            <ActionRow title="Payment method" body="Add a card or bank transfer to pay for this trip." action="Add" onPress={openPayWith} />
          )}
        </Section>

        <SectionBand />
        <Section title="Required for your trip">
          {phone?.verified ? (
            <View>
              <View style={styles.inline}>
                <Text style={styles.label}>Phone number</Text>
                <CheckIcon size={20} strokeWidth={2.2} />
              </View>
              <Text style={styles.body}>
                {phone.country.dial} {phone.number}
              </Text>
            </View>
          ) : (
            <ActionRow
              title="Phone number"
              body="Add and confirm your phone number to get trip updates."
              action="Add"
              onPress={openPhone}
            />
          )}
        </Section>

        {quote && (
          <>
            <SectionBand />
            <Section title="Cancellation policy">
              <Text style={styles.body}>
                Free cancellation before {formatLong(quote.freeCancelBefore)}. Cancel before {formatLong(quote.partialRefundBefore)} for a
                partial refund.{' '}
                <Text style={styles.inlineLinkBold} onPress={() => Alert.alert('Cancellation policy', 'Full refund up to a week before check-in, 50% after that.')}>
                  Learn more
                </Text>
              </Text>
            </Section>
          </>
        )}

        <SectionBand />
        <Section title="Ground rules">
          <Text style={styles.body}>We ask every guest to remember a few simple things about what makes a great guest.</Text>
          <Text style={[styles.body, styles.bullet]}>•  Follow the house rules</Text>
          <Text style={[styles.body, styles.bullet]}>•  Treat your Host’s home like your own</Text>
        </Section>

        {!instant && (
          <>
            <SectionBand />
            <View style={[styles.section, styles.row, { alignItems: 'flex-start', gap: 18 }]}>
              <CalendarMarkIcon size={36} color={Brand.primary} />
              <Text style={[styles.body, { flex: 1 }]}>
                <Text style={styles.label}>
                  Your reservation won’t be confirmed until the Host accepts your request (within 24 hours).
                </Text>{' '}
                You won’t be charged until then.
              </Text>
            </View>
          </>
        )}

        <SectionBand />
        <View style={styles.section}>
          <Text style={styles.legal}>
            By selecting the button below, I agree to the <Text style={styles.legalLink}>Host’s House Rules</Text>,{' '}
            <Text style={styles.legalLink}>Ground rules for guests</Text>, and the{' '}
            <Text style={styles.legalLink}>Rebooking and Refund Policy</Text>, and that I can be charged if I’m responsible for
            damage.{instant ? '' : ' I agree to pay the total amount shown if the Host accepts my booking request.'}
          </Text>
          <Button label={cta} onPress={submit} style={{ marginTop: 22 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: 16 }}>{children}</View>
    </View>
  );
}

function EditRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.body}>{value}</Text>
      </View>
      <TextLink label="Edit" onPress={onEdit} />
    </View>
  );
}

function PriceRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.body, { flex: 1 }, bold && styles.label]}>{label}</Text>
      <Text style={[styles.body, bold && styles.label]}>{value}</Text>
    </View>
  );
}

function ActionRow({ title, body, action, onPress }: { title: string; body: string; action: string; onPress: () => void }) {
  return (
    <View style={[styles.row, { alignItems: 'flex-start' }]}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.label}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.outlineButton, pressed && { backgroundColor: Brand.surface }]}>
        <Text style={styles.outlineButtonText}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Brand.text,
    marginBottom: 20,
  },
  summary: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 24,
  },
  summaryImage: {
    width: 130,
    height: 104,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    lineHeight: 21,
    color: Brand.text,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.text,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    color: Brand.text,
  },
  small: {
    fontSize: 13,
    color: Brand.text,
  },
  muted: {
    fontSize: 13,
    color: Brand.textSecondary,
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  inlineLink: {
    textDecorationLine: 'underline',
  },
  inlineLinkBold: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  bullet: {
    paddingLeft: 4,
  },
  legal: {
    fontSize: 13,
    lineHeight: 19,
    color: Brand.text,
  },
  legalLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  outlineButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Brand.text,
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
  },
});
