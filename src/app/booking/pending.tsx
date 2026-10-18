import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { z } from 'zod';

import { TextField } from '@/components/form/text-field';
import { FormView } from '@/components/form-view';
import { UploadIcon } from '@/components/icons';
import { Button, ScreenHeader, SectionBand, TextLink } from '@/components/ui';
import { Brand } from '@/constants/theme';
import { formatPrice, getListing } from '@/data/listings';
import { useBooking } from '@/hooks/use-booking';
import { formatRange } from '@/lib/dates';
import { shareSchema, type ShareForm } from '@/lib/validation';

const MAX_EMAILS = 5;
const isEmail = (value: string) => z.email().safeParse(value.trim()).success;

export default function PendingScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { trips } = useBooking();
  const trip = trips.find((t) => t.id === tripId);
  const listing = trip && getListing(trip.listingId);

  const { control, handleSubmit, setFocus } = useForm<ShareForm>({
    resolver: zodResolver(shareSchema),
    defaultValues: { emails: [{ value: '' }] },
    mode: 'onTouched',
  });
  const { fields, append } = useFieldArray({ control, name: 'emails' });
  const emails = useWatch({ control, name: 'emails' });

  if (!trip || !listing) return null;

  const year = trip.checkIn.slice(0, 4);
  const dates = `${formatRange(trip.checkIn, trip.checkOut)}, ${year}`;
  const title = trip.status === 'confirmed' ? 'Your reservation is confirmed' : 'Your reservation is pending';
  const next = () => router.push({ pathname: '/booking/things-to-do', params: { tripId: trip.id } });
  const submit = handleSubmit(next);

  return (
    <FormView>
      <ScreenHeader
        title={title}
        leading="none"
        trailing={
          <Pressable
            hitSlop={10}
            accessibilityLabel="Share itinerary"
            onPress={() => Share.share({ message: `I’m staying at ${listing.title}, ${dates}!` })}>
            <UploadIcon size={24} />
          </Pressable>
        }
      />
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Animated.View entering={FadeInDown} style={styles.summary}>
          <Image source={listing.images[0]} style={styles.image} contentFit="cover" />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.listingTitle} numberOfLines={3}>
              {listing.title}
            </Text>
            <Text style={styles.small}>{dates}</Text>
            <Text style={styles.small}>
              {formatPrice(trip.total)} total · {formatPrice(trip.paid)} paid
            </Text>
          </View>
        </Animated.View>

        <SectionBand />

        <View style={styles.section}>
          <Text style={styles.heading}>Last step: share your travel plans</Text>
          <Text style={styles.body}>Share your itinerary with anyone else who might want to know your plans.</Text>

          {fields.map((item, index) => (
            <Animated.View key={item.id} entering={index > 0 ? FadeInDown : undefined}>
              <TextField
                control={control}
                name={`emails.${index}.value`}
                label="Add email address"
                onValueChange={(value) => {
                  // Offer another field once the last one holds a valid address.
                  if (index === fields.length - 1 && isEmail(value) && fields.length < MAX_EMAILS) {
                    append({ value: '' }, { shouldFocus: false });
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType={index < fields.length - 1 ? 'next' : 'done'}
                onSubmitEditing={() => (index < fields.length - 1 ? setFocus(`emails.${index + 1}.value`) : submit())}
              />
            </Animated.View>
          ))}

          <View style={styles.actions}>
            <TextLink label="Skip" onPress={next} size={17} />
            <Button label="Submit" tone="dark" disabled={!emails.some((e) => isEmail(e.value))} onPress={submit} style={{ minWidth: 130 }} />
          </View>
        </View>
      </ScrollView>
    </FormView>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    gap: 16,
    padding: 24,
  },
  image: {
    width: 116,
    height: 104,
    borderRadius: 12,
  },
  listingTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '500',
    color: Brand.text,
  },
  small: {
    fontSize: 14,
    color: Brand.text,
  },
  section: {
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: Brand.text,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: Brand.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
