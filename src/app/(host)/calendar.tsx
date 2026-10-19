import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { useTabBarSpace } from '@/components/glass-tab-bar';
import { hostListings } from '@/components/host/data';
import { AltArrowLeftIcon, AltArrowRightIcon } from '@/components/icons';
import { FormView } from '@/components/form-view';
import { TextField } from '@/components/form/text-field';
import { KEYBOARD_BAR_ID, KeyboardBar } from '@/components/keyboard-bar';
import { nightlyPriceSchema, type NightlyPriceForm } from '@/components/profile/schemas';
import { TabScreen } from '@/components/tab-screen';
import { Button, FooterBar, ScreenHeader, TextLink } from '@/components/ui';
import { formatPrice } from '@/data/listings';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { addDays, formatRange, isBooked, monthGrid, monthTitle, nightsBetween, todayKey } from '@/lib/dates';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MAX_MONTHS = 12;

type Blocked = Record<string, string[]>;
type Prices = Record<string, Record<string, number>>;

const shortPrice = (amount: number) => (amount >= 1_000_000 ? `₦${(amount / 1_000_000).toFixed(1)}m` : `₦${Math.round(amount / 1000)}k`);

const formatNaira = (text: string) => {
  const digits = text.replace(/\D/g, '').slice(0, 7);
  return digits ? `₦${Number(digits).toLocaleString('en-US')}` : '';
};

function daysIn(start: string, end: string | null) {
  const last = end ?? start;
  const days: string[] = [];
  for (let key = start; key <= last; key = addDays(key, 1)) days.push(key);
  return days;
}

export default function HostCalendarScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const toast = useToast();
  const tabBarSpace = useTabBarSpace();
  const listings = hostListings();
  const [listingId, setListingId] = useState(listings[0]?.id ?? '');
  const listing = listings.find((l) => l.id === listingId) ?? listings[0];
  const [offset, setOffset] = useState(0);
  const [range, setRange] = useState<{ start: string; end: string | null } | null>(null);
  const [blocked, setBlocked] = usePersistedState<Blocked>('host-blocked-nights', {});
  const [prices, setPrices] = usePersistedState<Prices>('host-night-prices', {});
  const [pricing, setPricing] = useState(false);

  const today = todayKey();
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const year = first.getFullYear();
  const month = first.getMonth();
  const cells = monthGrid(year, month);

  const blockedSet = new Set(blocked[listingId] ?? []);
  const priceFor = (key: string) => prices[listingId]?.[key] ?? listing.price;
  const bookedOn = (key: string) => key >= today && isBooked(listingId, key);

  const selectedDays = range ? daysIn(range.start, range.end) : [];
  const selectable = selectedDays.filter((d) => !bookedOn(d));
  const allBlocked = selectable.length > 0 && selectable.every((d) => blockedSet.has(d));

  const tapDay = (key: string) => {
    if (key < today || bookedOn(key)) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (!range || range.end || key < range.start) setRange({ start: key, end: null });
    else if (key === range.start) setRange(null);
    else setRange({ start: range.start, end: key });
  };

  const selectListing = (id: string) => {
    setListingId(id);
    setRange(null);
  };

  const toggleBlock = () => {
    setBlocked((current) => {
      const set = new Set(current[listingId] ?? []);
      for (const day of selectable) {
        if (allBlocked) set.delete(day);
        else set.add(day);
      }
      return { ...current, [listingId]: [...set] };
    });
    toast.show({
      message: allBlocked ? `${selectable.length} ${selectable.length === 1 ? 'night' : 'nights'} opened` : `${selectable.length} ${selectable.length === 1 ? 'night' : 'nights'} blocked`,
      offset: tabBarSpace,
    });
    setRange(null);
  };

  const savePrice = (price: number) => {
    setPrices((current) => {
      const forListing = { ...(current[listingId] ?? {}) };
      for (const day of selectable) forListing[day] = price;
      return { ...current, [listingId]: forListing };
    });
    setPricing(false);
    setRange(null);
    toast.show({ message: `Price set to ${formatPrice(price)} a night`, offset: tabBarSpace });
  };

  return (
    <View style={styles.screen}>
      <TabScreen title="Calendar">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
          {listings.map((l) => {
            const selected = l.id === listingId;
            return (
              <Pressable
                key={l.id}
                onPress={() => selectListing(l.id)}
                style={[styles.chip, selected && styles.chipSelected]}
                accessibilityRole="tab"
                accessibilityState={{ selected }}>
                <Image source={l.images[0]} style={styles.chipImage} contentFit="cover" />
                <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
                  {l.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.monthRow}>
          <Pressable
            onPress={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            hitSlop={10}
            style={[styles.monthArrow, offset === 0 && { opacity: 0.3 }]}
            accessibilityLabel="Previous month">
            <AltArrowLeftIcon size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.monthTitle}>{monthTitle(year, month)}</Text>
          <Pressable
            onPress={() => setOffset((o) => Math.min(MAX_MONTHS - 1, o + 1))}
            disabled={offset === MAX_MONTHS - 1}
            hitSlop={10}
            style={[styles.monthArrow, offset === MAX_MONTHS - 1 && { opacity: 0.3 }]}
            accessibilityLabel="Next month">
            <AltArrowRightIcon size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.weekdays}>
          {WEEKDAYS.map((d, i) => (
            <Text key={i} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>

        <Animated.View key={`${listingId}-${offset}`} entering={FadeIn.duration(180)} style={styles.grid}>
          {cells.map((key, i) => {
            if (!key) return <View key={`pad-${i}`} style={styles.cell} />;
            const past = key < today;
            const booked = bookedOn(key);
            const isBlocked = blockedSet.has(key);
            const inRange = range ? key >= range.start && key <= (range.end ?? range.start) : false;
            const isEdge = range ? key === range.start || key === range.end : false;
            const custom = prices[listingId]?.[key] !== undefined;
            const day = Number(key.slice(-2));
            return (
              <Pressable
                key={key}
                onPress={() => tapDay(key)}
                disabled={past || booked}
                style={styles.cell}
                accessibilityRole="button"
                accessibilityState={{ selected: inRange, disabled: past || booked }}
                accessibilityLabel={`${key}${booked ? ', booked' : isBlocked ? ', blocked' : `, ${formatPrice(priceFor(key))}`}`}>
                <View
                  style={[
                    styles.dayBox,
                    booked && styles.dayBooked,
                    isBlocked && !booked && styles.dayBlocked,
                    inRange && !isEdge && styles.dayInRange,
                    isEdge && styles.dayEdge,
                  ]}>
                  {isBlocked && !booked && !isEdge && <View style={styles.stripe} />}
                  <Text
                    style={[
                      styles.dayText,
                      past && styles.dayPast,
                      booked && styles.dayTextBooked,
                      isEdge && styles.dayTextEdge,
                      isBlocked && !isEdge && styles.dayTextBlocked,
                    ]}>
                    {day}
                  </Text>
                  {!past && !booked && !isBlocked && (
                    <Text style={[styles.dayPrice, custom && styles.dayPriceCustom, isEdge && styles.dayTextEdge]}>{shortPrice(priceFor(key))}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        <View style={styles.legend}>
          <Legend swatch={styles.dayBooked} label="Booked" />
          <Legend swatch={styles.legendAvailable} label="Available" />
          <Legend swatch={styles.dayBlocked} label="Blocked" striped />
        </View>
        <Text style={styles.hint}>Tap a start and end date to block nights or change the nightly price. Base price {formatPrice(listing.price)}.</Text>
        <View style={{ height: range ? 150 : 0 }} />
      </TabScreen>

      {range && (
        <Animated.View entering={FadeInDown.springify().damping(18)} exiting={FadeOutDown.duration(160)} style={[styles.footer, { bottom: tabBarSpace }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerTitle}>{formatRange(range.start, range.end)}</Text>
            <Text style={styles.footerHint}>
              {selectable.length} {selectable.length === 1 ? 'night' : 'nights'}
              {range.end && selectable.length < nightsBetween(range.start, range.end) + 1 ? ' · booked nights skipped' : ''}
            </Text>
            <View style={{ marginTop: 6 }}>
              <TextLink label="Clear" size={14} onPress={() => setRange(null)} />
            </View>
          </View>
          <View style={styles.footerActions}>
            <Button label={allBlocked ? 'Open nights' : 'Block nights'} tone="dark" onPress={toggleBlock} disabled={selectable.length === 0} style={styles.footerButton} />
            <Button label="Change price" onPress={() => setPricing(true)} disabled={selectable.length === 0} style={styles.footerButton} />
          </View>
        </Animated.View>
      )}

      <Modal visible={pricing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPricing(false)}>
        <PriceSheet
          initial={range ? priceFor(range.start) : listing.price}
          title={range ? formatRange(range.start, range.end) : ''}
          onClose={() => setPricing(false)}
          onSave={savePrice}
        />
      </Modal>
    </View>
  );
}

function Legend({ swatch, label, striped }: { swatch: object; label: string; striped?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, swatch]}>{striped && <View style={styles.stripe} />}</View>
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function PriceSheet({ initial, title, onClose, onSave }: { initial: number; title: string; onClose: () => void; onSave: (price: number) => void }) {
  const styles = useStyles();
  const { control, handleSubmit } = useForm<NightlyPriceForm>({
    resolver: zodResolver(nightlyPriceSchema),
    defaultValues: { price: formatNaira(String(initial)) },
    mode: 'onChange',
  });
  const save = handleSubmit(({ price }) => onSave(Number(price.replace(/\D/g, ''))));

  return (
    <FormView>
      <KeyboardBar label="Save" onPress={save} />
      <ScreenHeader title="Change price" leading="close" onLeadingPress={onClose} safeTop={false} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Nightly price</Text>
        <Text style={styles.sheetBody}>For {title}. Guests see this before taxes and service fees.</Text>
        <TextField
          control={control}
          name="price"
          label="Price per night"
          format={formatNaira}
          keyboardType="number-pad"
          inputAccessoryViewID={KEYBOARD_BAR_ID}
          autoFocus
          style={styles.priceInput}
          helper="Between ₦5,000 and ₦5,000,000."
        />
      </View>
      <FooterBar>
        <TextLink label="Cancel" onPress={onClose} />
        <Button label="Save" tone="dark" onPress={save} style={{ minWidth: 120 }} />
      </FooterBar>
    </FormView>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  bleed: {
    marginHorizontal: -24,
    marginTop: -8,
  },
  chips: {
    paddingHorizontal: 24,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 240,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.border,
  },
  chipSelected: {
    borderWidth: 2,
    borderColor: c.text,
    paddingLeft: 5,
    paddingRight: 13,
    paddingVertical: 5,
  },
  chipImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: c.surface,
  },
  chipText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '500',
    color: c.text,
  },
  chipTextSelected: {
    fontWeight: '700',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.text,
  },
  weekdays: {
    flexDirection: 'row',
    marginTop: 18,
    marginBottom: 6,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.82,
    padding: 2,
  },
  dayBox: {
    flex: 1,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  dayBooked: {
    backgroundColor: 'rgba(255,56,92,0.16)',
  },
  dayBlocked: {
    backgroundColor: c.surface,
  },
  dayInRange: {
    backgroundColor: c.band,
  },
  dayEdge: {
    backgroundColor: c.inverse,
  },
  stripe: {
    position: 'absolute',
    width: '160%',
    height: 1.5,
    backgroundColor: c.border,
    transform: [{ rotate: '-50deg' }],
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  dayPast: {
    color: c.disabledText,
    textDecorationLine: 'line-through',
  },
  dayTextBooked: {
    color: c.primaryDark,
  },
  dayTextBlocked: {
    color: c.textSecondary,
  },
  dayTextEdge: {
    color: c.onInverse,
  },
  dayPrice: {
    fontSize: 10,
    color: c.textSecondary,
  },
  dayPriceCustom: {
    fontWeight: '700',
    color: c.text,
  },
  legend: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 18,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendAvailable: {
    borderWidth: 1,
    borderColor: c.border,
  },
  legendText: {
    fontSize: 13,
    color: c.textSecondary,
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: c.textSecondary,
  },
  footer: {
    position: 'absolute',
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: c.elevated,
    borderWidth: 0.5,
    borderColor: c.border,
    boxShadow: `0 8px 28px ${c.shadow}`,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
  },
  footerHint: {
    marginTop: 2,
    fontSize: 13,
    color: c.textSecondary,
  },
  footerActions: {
    gap: 8,
  },
  footerButton: {
    height: 42,
    paddingHorizontal: 16,
  },
  sheet: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: c.text,
  },
  sheetBody: {
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
    marginBottom: 8,
  },
  priceInput: {
    fontSize: 28,
    fontWeight: '700',
  },
}));
