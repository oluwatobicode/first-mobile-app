import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CloseIcon, StarBoldIcon } from '@/components/icons';
import { Button, FooterBar, TextLink } from '@/components/ui';
import { formatPrice, getListing } from '@/data/listings';
import { isNightly, useBooking } from '@/hooks/use-booking';
import { addDays, formatDay, monthGrid, monthTitle, nightsBetween, todayKey, upcomingMonths, isBooked } from '@/lib/dates';
import { createStyles, useTheme } from '@/hooks/use-theme';

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = upcomingMonths(12);
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
  const cell = Math.floor((width - PAD * 2) / 7);
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

  const onDayPress = (key: string) => {
    if (!nightly) {
      setStart(key);
      setEnd(null);
    } else if (picking === 'start' || (start && key <= start)) {
      setStart(key);
      setEnd(null);
    } else {
      setEnd(key);
    }
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

      <View style={[styles.weekdays, { paddingHorizontal: PAD }]}>
        {WEEKDAY_LETTERS.map((letter, i) => (
          <Text key={i} style={[styles.weekday, { width: cell }]}>
            {letter}
          </Text>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: PAD, paddingBottom: 24 }}>
        {MONTHS.map(({ year, month }) => (
          <View key={`${year}-${month}`} style={styles.month}>
            <Text style={styles.monthTitle}>{monthTitle(year, month)}</Text>
            <View style={styles.grid}>
              {monthGrid(year, month).map((key, index) => {
                if (!key) return <View key={`pad-${index}`} style={{ width: cell, height: cell }} />;

                const unavailable = isUnavailable(key);
                const isStart = key === start;
                const isEnd = key === end;
                const inRange = Boolean(start && end && key > start && key < end);
                const showBand = Boolean(start && end && start !== end && (inRange || isStart || isEnd));

                return (
                  <Pressable
                    key={key}
                    disabled={unavailable && !isStart}
                    onPress={() => onDayPress(key)}
                    style={{ width: cell, height: cell, alignItems: 'center', justifyContent: 'center' }}
                    accessibilityLabel={formatDay(key)}
                    accessibilityState={{ disabled: unavailable, selected: isStart || isEnd }}>
                    {showBand && (
                      <View
                        style={[
                          styles.band,
                          { height: cell - 6 },
                          isStart && { left: '50%' },
                          isEnd && { right: '50%' },
                        ]}
                      />
                    )}
                    <View
                      style={[
                        styles.day,
                        { width: cell - 6, height: cell - 6, borderRadius: cell },
                        (isStart || isEnd) && styles.daySelected,
                      ]}>
                      <Text
                        style={[
                          styles.dayText,
                          unavailable && styles.dayUnavailable,
                          (isStart || isEnd) && styles.dayTextSelected,
                        ]}>
                        {Number(key.slice(8))}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
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
  weekdays: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  weekday: {
    textAlign: 'center',
    fontSize: 13,
    color: c.textSecondary,
  },
  month: {
    paddingTop: 24,
  },
  monthTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: c.text,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: c.surface,
  },
  day: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: c.inverse,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  dayUnavailable: {
    color: c.placeholder,
    fontWeight: '400',
    textDecorationLine: 'line-through',
  },
  dayTextSelected: {
    color: c.onInverse,
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
