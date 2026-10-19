import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Confetti } from '@/components/confetti';
import { TextField } from '@/components/form/text-field';
import { FormView } from '@/components/form-view';
import { CheckCircleBoldIcon } from '@/components/icons';
import { REVIEW_MAX, REVIEW_MIN, reviewTextSchema, type ReviewTextForm } from '@/components/trips/schemas';
import { BigStarRow, ratingLabel, StarRow } from '@/components/trips/stars';
import { Button, FooterBar, ScreenHeader, TextLink } from '@/components/ui';
import { REVIEW_CATEGORIES } from '@/data/details';
import { getListing, type Listing } from '@/data/listings';
import { useAuth } from '@/hooks/use-auth';
import { useBooking, type Trip } from '@/hooks/use-booking';
import { useReviews, type ReviewCategory } from '@/hooks/use-reviews';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { formatRange } from '@/lib/dates';

const STEPS = 4;

export default function ReviewScreen() {
  const { tripId, rating } = useLocalSearchParams<{ tripId: string; rating?: string }>();
  const { trips } = useBooking();
  const trip = trips.find((t) => t.id === tripId);
  const listing = trip ? getListing(trip.listingId) : undefined;
  if (!trip || !listing) return <ScreenHeader title="Review" leading="close" />;
  return <ReviewFlow trip={trip} listing={listing} initialRating={Number(rating)} />;
}

function ReviewFlow({ trip, listing, initialRating }: { trip: Trip; listing: Listing; initialRating: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addReview, reviewForTrip } = useReviews();
  const existing = reviewForTrip(trip.id);

  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(() =>
    initialRating >= 1 && initialRating <= 5 ? Math.round(initialRating) : (existing?.rating ?? 0)
  );
  const [categories, setCategories] = useState<Partial<Record<ReviewCategory, number>>>(() => existing?.categories ?? {});

  const { control, handleSubmit } = useForm<ReviewTextForm>({
    resolver: zodResolver(reviewTextSchema),
    defaultValues: { text: existing?.text ?? '' },
    mode: 'onTouched',
  });
  const text = useWatch({ control, name: 'text' }) ?? '';
  const length = text.trim().length;

  const progress = useSharedValue((step + 1) / STEPS);
  useEffect(() => {
    progress.set(withTiming((step + 1) / STEPS, { duration: 300 }));
  }, [step, progress]);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const allCategoriesRated = REVIEW_CATEGORIES.every((category) => (categories[category] ?? 0) > 0);

  const submit = handleSubmit(({ text: body }) => {
    addReview({
      tripId: trip.id,
      listingId: listing.id,
      name: user?.firstName ?? 'Guest',
      rating,
      categories,
      text: body,
    });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep(3);
  });

  const next = () => {
    if (step === 2) submit();
    else setStep((s) => s + 1);
  };

  const done = step === 3;

  return (
    <FormView>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title={done ? undefined : 'Rate your stay'} leading={done ? 'none' : 'close'} safeTop={false} bordered={false} />
        <View style={styles.track}>
          <Animated.View style={[styles.fill, progressStyle]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {step === 0 && (
          <Animated.View key="overall" entering={FadeInRight.duration(220)} style={styles.center}>
            <Image source={listing.images[0]} style={styles.photo} contentFit="cover" />
            <Text style={[styles.heading, styles.centerText]}>How was your stay at {listing.title}?</Text>
            <Text style={[styles.muted, styles.centerText]}>
              Hosted by {listing.host.name} · {formatRange(trip.checkIn, trip.checkOut)}
            </Text>
            <View style={{ marginTop: 32 }}>
              <BigStarRow value={rating} onChange={setRating} />
            </View>
            <Text style={styles.ratingLabel}>{rating ? ratingLabel(rating) : 'Tap a star to rate'}</Text>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View key="categories" entering={FadeInRight.duration(220)}>
            <Text style={styles.heading}>Rate the details</Text>
            <Text style={styles.muted}>Your ratings help {listing.host.name} and future guests.</Text>
            <View style={{ marginTop: 16 }}>
              {REVIEW_CATEGORIES.map((category, i) => (
                <View key={category} style={[styles.categoryRow, i === REVIEW_CATEGORIES.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.categoryLabel}>{category}</Text>
                  <StarRow
                    value={categories[category] ?? 0}
                    size={24}
                    gap={6}
                    label={category}
                    onChange={(value) => setCategories((current) => ({ ...current, [category]: value }))}
                  />
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View key="text" entering={FadeInRight.duration(220)}>
            <Text style={styles.heading}>Write a public review</Text>
            <Text style={styles.muted}>Tell future guests what you loved and anything they should know.</Text>
            <View style={{ marginTop: 20 }}>
              <TextField
                control={control}
                name="text"
                label="Your review"
                placeholder={`What was it like staying with ${listing.host.name}?`}
                multiline
                maxLength={REVIEW_MAX}
                textAlignVertical="top"
                style={{ minHeight: 140 }}
              />
            </View>
            <Text style={[styles.counter, length > 0 && length < REVIEW_MIN && { color: colors.error }]}>
              {length < REVIEW_MIN ? `${REVIEW_MIN - length} more characters needed · ` : ''}
              {text.length}/{REVIEW_MAX}
            </Text>
          </Animated.View>
        )}

        {done && (
          <View style={[styles.center, { paddingTop: 48 }]}>
            <Animated.View entering={ZoomIn.springify().damping(12)}>
              <CheckCircleBoldIcon size={72} color={colors.primary} />
            </Animated.View>
            <Text style={[styles.heading, styles.centerText, { marginTop: 24 }]}>Thanks for your review!</Text>
            <Text style={[styles.muted, styles.centerText]}>
              Your review helps {listing.host.name} and guests like you. It’s now showing on the listing.
            </Text>
          </View>
        )}
      </ScrollView>

      <FooterBar>
        {done ? (
          <Button label="Done" tone="dark" onPress={() => router.back()} style={{ flex: 1 }} />
        ) : (
          <>
            {step > 0 ? <TextLink label="Back" onPress={() => setStep((s) => s - 1)} /> : <View />}
            <Button
              label={step === 2 ? 'Submit' : 'Next'}
              tone={step === 2 ? 'brand' : 'dark'}
              onPress={next}
              disabled={(step === 0 && !rating) || (step === 1 && !allCategoriesRated)}
            />
          </>
        )}
      </FooterBar>

      {done && <Confetti />}
    </FormView>
  );
}

const useStyles = createStyles((c) => ({
  track: {
    height: 4,
    backgroundColor: c.band,
  },
  fill: {
    height: 4,
    backgroundColor: c.inverse,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  center: {
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 24,
    backgroundColor: c.surface,
  },
  heading: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: c.text,
    marginBottom: 8,
  },
  muted: {
    fontSize: 15,
    lineHeight: 21,
    color: c.textSecondary,
  },
  ratingLabel: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '600',
    color: c.text,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  categoryLabel: {
    fontSize: 17,
    color: c.text,
  },
  counter: {
    marginTop: 10,
    fontSize: 13,
    color: c.textSecondary,
    textAlign: 'right',
  },
}));
