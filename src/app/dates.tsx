import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { MonthCalendar, WeekdayHeader } from '@/components/calendar/month-calendar';
import { CloseIcon, StarBoldIcon } from '@/components/icons';
import { Button, FooterBar, TextLink } from '@/components/ui';
import { formatPrice, getListing } from '@/data/listings';
import { isNightly, useBooking } from '@/hooks/use-booking';
import { addDays, formatDay, nightsBetween, todayKey, isBooked } from '@/lib/dates';
import { createStyles, useTheme } from '@/hooks/use-theme';

const PAD = 16;

export default function DatesScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = getListing(id);
  const { draftFor, updateDraft } = useBooking();
  const draft = draftFor(id);
  const { width } = useWindowDimensions();

  const [start, setStart] = useState<string | null>(draft.checkIn);
  const [end, setEnd] = useState<string | null>(draft.checkOut);
  const [saving, setSaving] = useState(false);

  if (!listing) return null;

  const nightly = isNightly(listing);
  const today = todayKey();
  const picking: 'start' | 'end' = nightly && start && !end ? 'end' : 'start';

  // While choosing checkout, you can't stay past the next night that's already booked.
  let checkoutLimit: string | null = null;
  if (picking === 'end' && start) {
    let day = addDays(start, 1);
    for (let i = 0; i < 60 && !isBooked(listing.id, day); i++) day = addDays(day, 1);
    checkoutLimit = day;
  }

  const isUnavailable = (key: string) => {
    if (key < today) return true;
    if (picking === 'end' && start && key > start) return key > checkoutLimit!;
    return isBooked(listing.id, key);
  };

  const complete = nightly ? Boolean(start && end) : Boolean(start);
  const nights = start && end ? nightsBetween(start, end) : 0;

  let title = nightly ? 'Select check-in date' : 'Select a date';
  let subtitle = 'Prices on calendar do not include taxes and fees';
  if (nightly && start && !end) {
    title = 'Select checkout date';
    subtitle = `${formatDay(start)} -`;
  } else if (nightly && start && end) {
    title = `${nights} night${nights === 1 ? '' : 's'}`;
    subtitle = `${formatDay(start)} - ${formatDay(end)}`;
  } else if (!nightly && start) {
    title = formatDay(start);
    subtitle = `${formatPrice(listing.price)} ${listing.priceNote}`;
  }

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      updateDraft(listing.id, { checkIn: start, checkOut: nightly ? end : null });
      router.back();
    }, 700);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close">
          <CloseIcon size={24} />
        </Pressable>
        <TextLink
          label="Clear dates"
          disabled={!start}
          onPress={() => {
            setStart(null);
            setEnd(null);
          }}
        />
      </View>

      <View style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <WeekdayHeader width={width - PAD * 2} style={{ paddingHorizontal: PAD }} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 24 }}>
        <MonthCalendar
          start={start}
          end={end}
          range={nightly}
          width={width - PAD * 2}
          isDisabled={isUnavailable}
          onChange={(nextStart, nextEnd) => {
            setStart(nextStart);
            setEnd(nextEnd);
          }}
        />
      </ScrollView>

      <FooterBar>
        <View style={{ flex: 1 }}>
          {complete && start ? (
            <Text style={styles.footerPrice}>
              {nightly
                ? `${formatPrice(listing.price * nights)} for ${nights} night${nights === 1 ? '' : 's'}`
                : `${formatPrice(listing.price)} ${listing.priceNote}`}
            </Text>
          ) : (
            <Text style={styles.footerPrice}>Add dates for prices</Text>
          )}
          <View style={styles.footerRating}>
            <StarBoldIcon size={14} color={colors.text} />
            <Text style={styles.footerRatingText}>{listing.rating.toFixed(2)}</Text>
          </View>
        </View>
        <Button label="Save" tone="dark" disabled={!complete} loading={saving} onPress={save} style={{ minWidth: 150 }} />
      </FooterBar>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  heading: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: c.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    color: c.text,
  },
  footerPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  footerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  footerRatingText: {
    fontSize: 14,
    color: c.text,
  },
}));
