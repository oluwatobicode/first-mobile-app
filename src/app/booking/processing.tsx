import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { BanknoteIcon, HomeSmileIcon } from '@/components/icons';
import { Particles, PulseRing } from '@/components/particles';
import { Button, FooterBar, ScreenHeader } from '@/components/ui';
import { getListing } from '@/data/listings';
import { guestCount, isInstantBook, quoteFor, useBooking } from '@/hooks/use-booking';
import { notifyTripBooked } from '@/lib/notifications';
import { createStyles, useTheme } from '@/hooks/use-theme';

type Phase = 'preparing' | 'bank' | 'moment' | 'failed';

export default function ProcessingScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { draftFor, paymentMethods, selectedPaymentId, addTrip, remindersOn } = useBooking();
  const payment = paymentMethods.find((m) => m.id === selectedPaymentId);
  const usesCard = payment?.kind === 'card';
  // Easter egg: a card ending in 0000 fails the bank's 3D Secure check.
  const cardFails = payment?.last4 === '0000';

  const [phase, setPhase] = useState<Phase>('preparing');
  const finished = useRef(false);

  useEffect(() => {
    if (phase === 'preparing') {
      const timer = setTimeout(() => setPhase(usesCard ? 'bank' : 'moment'), 2200);
      return () => clearTimeout(timer);
    }
    if (phase === 'moment') {
      const timer = setTimeout(() => {
        if (cardFails) return setPhase('failed');
        if (finished.current) return;
        finished.current = true;

        const draft = draftFor(id);
        const quote = quoteFor(draft);
        if (!quote || !draft.checkIn) return router.back();
        const trip = addTrip({
          listingId: id,
          checkIn: draft.checkIn,
          checkOut: draft.checkOut,
          total: quote.total,
          paid: quote.dueNow,
          guestCount: guestCount(draft.guests),
        });
        const listing = getListing(id);
        if (listing) {
          // Fire and forget: the booking shouldn't wait on the permission prompt.
          notifyTripBooked({ ...trip, instant: isInstantBook(listing) }, listing, remindersOn).catch(() => {});
        }
        router.replace({ pathname: '/booking/pending', params: { tripId: trip.id } });
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [phase, usesCard, cardFails, id, draftFor, addTrip, remindersOn]);

  if (phase === 'failed') {
    return (
      <View style={styles.screen}>
        <ScreenHeader leading="close" bordered={false} />
        <Animated.View entering={FadeInDown} style={styles.failed}>
          <Text style={styles.failedTitle}>Confirm your card</Text>
          <Text style={styles.failedTitle}>Your bank couldn’t confirm this card</Text>
          <Text style={styles.body}>As a result, we can’t process your payment.</Text>
          <Text style={styles.body}>
            You can try a different card or contact your bank. If you contact your bank, mention that you need help with
            a confirmation process called 3D Secure.
          </Text>
          <Button label="OK" tone="dark" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </Animated.View>
      </View>
    );
  }

  if (phase === 'bank') {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <Animated.View entering={FadeIn} style={styles.iconStage}>
            <PulseRing />
            <MoneyIcon />
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(150)} style={styles.bankTitle}>
            Your bank may need you to confirm a few details
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(250)} style={[styles.body, styles.centered]}>
            Don’t worry – we’ll hold your booking while you take care of this
          </Animated.Text>
        </View>
        <FooterBar>
          <View />
          <Button label="Continue" tone="dark" onPress={() => setPhase('moment')} style={{ minWidth: 150 }} />
        </FooterBar>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Particles key={phase} />
      <View style={styles.center}>
        <Animated.View key={phase} entering={FadeIn.duration(400)} style={{ alignItems: 'center', gap: 28 }}>
          {phase === 'preparing' ? <HomeSmileIcon size={64} color={colors.primary} strokeWidth={1.6} /> : <MoneyIcon />}
          <Text style={styles.loadingTitle}>{phase === 'preparing' ? 'We’re getting your trip ready' : 'One moment please'}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

function MoneyIcon() {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.money}>
      <BanknoteIcon size={60} color={colors.primary} strokeWidth={1.4} />
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  loadingTitle: {
    fontSize: 26,
    fontWeight: '600',
    color: c.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  iconStage: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  money: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,56,92,0.14)',
  },
  bankTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: c.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    color: c.text,
  },
  centered: {
    textAlign: 'center',
  },
  failed: {
    padding: 24,
    gap: 12,
  },
  failedTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -0.6,
  },
}));
