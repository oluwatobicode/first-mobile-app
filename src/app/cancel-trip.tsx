import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useController, useForm, useWatch, type Control } from 'react-hook-form';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { FieldMessage, TextField } from '@/components/form/text-field';
import { FormView } from '@/components/form-view';
import { CANCEL_REASONS, cancelSchema, type CancelForm } from '@/components/trips/schemas';
import { paymentLabel, refundFor } from '@/components/trips/trip-utils';
import { Button, FooterBar, Radio, ScreenHeader, TextLink } from '@/components/ui';
import { formatPrice, getListing, type Listing } from '@/data/listings';
import { useBooking, type Trip } from '@/hooks/use-booking';
import { createStyles } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { formatRange } from '@/lib/dates';

export default function CancelTripScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { trips } = useBooking();
  const trip = trips.find((t) => t.id === tripId);
  const listing = trip ? getListing(trip.listingId) : undefined;
  if (!trip || !listing) return <ScreenHeader title="Cancel reservation" leading="close" safeTop={false} />;
  return <CancelFlow trip={trip} listing={listing} />;
}

function CancelFlow({ trip, listing }: { trip: Trip; listing: Listing }) {
  const styles = useStyles();
  const { cancelTrip, paymentMethods, selectedPaymentId } = useBooking();
  const toast = useToast();
  const [step, setStep] = useState<'reason' | 'refund'>('reason');

  const { control, handleSubmit } = useForm<CancelForm>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { details: '' },
    mode: 'onTouched',
  });
  const reason = useWatch({ control, name: 'reason' });

  const refund = refundFor(trip);
  const method = paymentLabel(paymentMethods, selectedPaymentId);

  const confirm = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    cancelTrip(trip.id, refund.amount);
    router.back();
    toast.show({ message: `Reservation cancelled · ${formatPrice(refund.amount)} refund on its way` });
  };

  return (
    <FormView>
      <ScreenHeader
        title="Cancel reservation"
        leading={step === 'reason' ? 'close' : 'back'}
        onLeadingPress={step === 'reason' ? undefined : () => setStep('reason')}
        safeTop={false}
      />
      <View style={styles.progress}>
        <View style={[styles.progressFill, { width: step === 'reason' ? '50%' : '100%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <View style={styles.summary}>
          <Image source={listing.images[0]} style={styles.summaryImage} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle} numberOfLines={1}>
              {listing.title}
            </Text>
            <Text style={styles.muted}>
              {formatRange(trip.checkIn, trip.checkOut)}, {trip.checkIn.slice(0, 4)} · {trip.guestCount} guest{trip.guestCount === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        {step === 'reason' ? (
          <Animated.View key="reason" entering={FadeInRight.duration(220)}>
            <Text style={styles.heading}>Why do you need to cancel?</Text>
            <Text style={styles.muted}>Your answer is only shared with us, not the host.</Text>
            <ReasonList control={control} />
            {reason === 'Other' && (
              <View style={{ marginTop: 16 }}>
                <TextField control={control} name="details" label="Tell us more" multiline maxLength={300} style={{ minHeight: 80 }} />
              </View>
            )}
          </Animated.View>
        ) : (
          <Animated.View key="refund" entering={FadeInRight.duration(220)}>
            <Text style={styles.heading}>{refund.full ? 'You’ll get a full refund' : 'You’ll get a partial refund'}</Text>
            <Text style={styles.muted}>
              {refund.full
                ? 'You’re cancelling at least 7 days before check-in, so everything you paid comes back.'
                : 'Check-in is less than 7 days away, so 50% of what you paid is refunded.'}
            </Text>

            <View style={styles.breakdown}>
              <View style={styles.line}>
                <Text style={styles.lineLabel}>You paid</Text>
                <Text style={styles.lineValue}>{formatPrice(trip.paid)}</Text>
              </View>
              {!refund.full && (
                <View style={styles.line}>
                  <Text style={styles.lineLabel}>Non-refundable (50%)</Text>
                  <Text style={styles.lineValue}>−{formatPrice(trip.paid - refund.amount)}</Text>
                </View>
              )}
              <View style={[styles.line, styles.totalLine]}>
                <Text style={styles.totalLabel}>Refund</Text>
                <Text style={styles.totalLabel}>{formatPrice(refund.amount)}</Text>
              </View>
            </View>

            <Text style={styles.note}>Refund goes to {method} in 5–7 business days.</Text>
            <Text style={styles.note}>Reason: {reason}</Text>
          </Animated.View>
        )}
      </ScrollView>

      <FooterBar>
        {step === 'reason' ? (
          <>
            <TextLink label="Keep reservation" onPress={() => router.back()} />
            <Button label="Next" tone="dark" onPress={handleSubmit(() => setStep('refund'))} />
          </>
        ) : (
          <Button label="Confirm cancellation" onPress={confirm} style={{ flex: 1 }} />
        )}
      </FooterBar>
    </FormView>
  );
}

function ReasonList({ control }: { control: Control<CancelForm> }) {
  const styles = useStyles();
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ control, name: 'reason' });

  return (
    <View style={{ marginTop: 12 }} accessibilityRole="radiogroup">
      {CANCEL_REASONS.map((option, i) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          style={[styles.option, i === CANCEL_REASONS.length - 1 && styles.optionLast]}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === option }}>
          <Text style={styles.optionLabel}>{option}</Text>
          <Radio selected={value === option} />
        </Pressable>
      ))}
      <FieldMessage error={error?.message} />
    </View>
  );
}

const useStyles = createStyles((c) => ({
  progress: {
    height: 4,
    backgroundColor: c.band,
  },
  progressFill: {
    height: 4,
    backgroundColor: c.inverse,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 20,
    marginBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  summaryImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: c.surface,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: c.text,
    marginBottom: 8,
  },
  muted: {
    fontSize: 15,
    lineHeight: 21,
    color: c.textSecondary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionLabel: {
    fontSize: 17,
    color: c.text,
  },
  breakdown: {
    marginTop: 24,
    padding: 20,
    gap: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.inputBorder,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineLabel: {
    fontSize: 16,
    color: c.text,
  },
  lineValue: {
    fontSize: 16,
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  totalLine: {
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: c.text,
  },
  note: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 21,
    color: c.textSecondary,
  },
}));
