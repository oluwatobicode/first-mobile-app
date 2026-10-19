import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EMPTY_WHEN, WhenPicker, whenSummary, type WhenValue } from '@/components/calendar/when-picker';
import { CategoryTabs } from '@/components/category-tabs';
import { getTripWhen, setTripWhen } from '@/components/explore/trip-when';
import {
  AddIcon,
  BuildingsIcon,
  ChefHatIcon,
  CloseIcon,
  LeafIcon,
  MagnifierIcon,
  MapPointIcon,
  MinusIcon,
  WaterIcon,
} from '@/components/icons';
import { Button, TextLink } from '@/components/ui';
import { DESTINATIONS, type Category } from '@/data/listings';
import { useFilters } from '@/hooks/use-filters';
import { createStyles, useTheme } from '@/hooks/use-theme';

type Step = 'where' | 'when' | 'who';

const GUEST_TYPES = [
  { key: 'adults', label: 'Adults', hint: 'Ages 13 or above' },
  { key: 'children', label: 'Children', hint: 'Ages 2 – 12' },
  { key: 'infants', label: 'Infants', hint: 'Under 2' },
  { key: 'pets', label: 'Pets', hint: 'Bringing a service animal?' },
] as const;

type GuestKey = (typeof GUEST_TYPES)[number]['key'];
const NO_GUESTS: Record<GuestKey, number> = { adults: 0, children: 0, infants: 0, pets: 0 };

const DESTINATION_ICONS = { nearby: MapPointIcon, beach: WaterIcon, city: BuildingsIcon, dining: ChefHatIcon, nature: LeafIcon };

const layout = LinearTransition.springify().damping(18).stiffness(160);

// ScrollView padding (14) + open card padding (26), on both sides.
const CARD_INSET = (14 + 26) * 2;

export default function SearchScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState<Category>('homes');
  const [step, setStep] = useState<Step>('where');
  const [query, setQuery] = useState('');
  const { filters, setFilters } = useFilters();
  const [where, setWhere] = useState<string | null>(filters.where);
  const [when, setWhen] = useState<WhenValue>(() => getTripWhen()?.value ?? EMPTY_WHEN);
  // Months / Flexible always describe a trip; Dates only once a day is picked.
  const [whenTouched, setWhenTouched] = useState(() => getTripWhen() !== null);
  const whenLabel = whenTouched ? whenSummary(when) : null;
  const [guests, setGuests] = useState(NO_GUESTS);

  const guestCount = guests.adults + guests.children;
  const guestSummary =
    guestCount === 0 ? null : `${guestCount} guest${guestCount > 1 ? 's' : ''}${guests.pets ? `, ${guests.pets} pet${guests.pets > 1 ? 's' : ''}` : ''}`;

  const destinations = DESTINATIONS.filter((d) =>
    `${d.title} ${d.subtitle}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  const clearAll = () => {
    setQuery('');
    setWhere(null);
    setWhen(EMPTY_WHEN);
    setWhenTouched(false);
    setGuests(NO_GUESTS);
    setStep('where');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <CategoryTabs value={category} onChange={setCategory} compact />
        <Pressable onPress={() => router.back()} style={styles.closeButton} accessibilityLabel="Close search">
          <CloseIcon size={20} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.cards} keyboardShouldPersistTaps="handled">
        {step === 'where' ? (
          <Animated.View layout={layout} entering={FadeIn} style={[styles.card, styles.cardOpen]}>
            <Text style={styles.bigTitle}>Where?</Text>
            <View style={styles.inputWrap}>
              <MagnifierIcon size={22} strokeWidth={2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search destinations"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (query.trim()) {
                    setWhere(query.trim());
                    setStep('when');
                  }
                }}
              />
            </View>
            <Text style={styles.smallHeading}>Suggested destinations</Text>
            {destinations.map((d) => {
              const Icon = DESTINATION_ICONS[d.icon];
              return (
              <Pressable
                key={d.title}
                style={({ pressed }) => [styles.destination, pressed && { opacity: 0.6 }]}
                onPress={() => {
                  setWhere(d.title);
                  setStep('when');
                }}>
                <View style={[styles.destinationIcon, { backgroundColor: d.tint }]}>
                  <Icon size={30} color={d.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destinationTitle}>{d.title}</Text>
                  <Text style={styles.destinationSubtitle}>{d.subtitle}</Text>
                </View>
              </Pressable>
              );
            })}
            {destinations.length === 0 && (
              <Text style={styles.destinationSubtitle}>Press search on your keyboard to look for “{query}”.</Text>
            )}
          </Animated.View>
        ) : (
          <CollapsedRow label="Where" value={where ?? 'I’m flexible'} onPress={() => setStep('where')} />
        )}

        {step === 'when' ? (
          <Animated.View layout={layout} entering={FadeIn} style={[styles.card, styles.cardOpen]}>
            <Text style={styles.bigTitle}>When’s your trip?</Text>
            <WhenPicker
              value={when}
              width={width - CARD_INSET}
              onChange={(next) => {
                setWhen(next);
                setWhenTouched(true);
              }}
            />
            <View style={styles.whenFooter}>
              <TextLink
                label="Reset"
                disabled={!whenTouched}
                onPress={() => {
                  setWhen(EMPTY_WHEN);
                  setWhenTouched(false);
                }}
              />
              <Button label={whenLabel ? 'Next' : 'Skip'} tone="dark" onPress={() => setStep('who')} style={styles.whenNext} />
            </View>
          </Animated.View>
        ) : (
          <CollapsedRow label="When" value={whenLabel ?? 'Add dates'} onPress={() => setStep('when')} />
        )}

        {step === 'who' ? (
          <Animated.View layout={layout} entering={FadeIn} style={[styles.card, styles.cardOpen]}>
            <Text style={styles.bigTitle}>Who’s coming?</Text>
            {GUEST_TYPES.map((type, index) => (
              <View key={type.key} style={[styles.guestRow, index > 0 && styles.guestRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destinationTitle}>{type.label}</Text>
                  <Text style={styles.destinationSubtitle}>{type.hint}</Text>
                </View>
                <Stepper
                  value={guests[type.key]}
                  onChange={(value) => setGuests((g) => ({ ...g, [type.key]: value }))}
                />
              </View>
            ))}
          </Animated.View>
        ) : (
          <CollapsedRow label="Who" value={guestSummary ?? 'Add guests'} onPress={() => setStep('who')} />
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={clearAll} hitSlop={10}>
          <Text style={styles.clearAll}>Clear all</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            // "Nearby" isn't a place we can filter by, so it just shows everything.
            setFilters({ where: where && where !== 'Nearby' ? where : null, guests: guestCount });
            // Dates aren't part of the global filters; they ride along to the Explore search pill.
            setTripWhen(whenLabel ? { label: whenLabel, value: when } : null);
            router.back();
          }}
          style={({ pressed }) => [styles.searchButton, pressed && { transform: [{ scale: 0.97 }] }]}>
          <MagnifierIcon size={22} color={colors.white} strokeWidth={2.2} />
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CollapsedRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Animated.View layout={layout}>
      <Pressable onPress={onPress} style={[styles.card, styles.cardCollapsed]}>
        <Text style={styles.collapsedLabel}>{label}</Text>
        <Text style={styles.collapsedValue}>{value}</Text>
      </Pressable>
    </Animated.View>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const styles = useStyles();
  return (
    <View style={styles.stepper}>
      <StepperButton icon="minus" disabled={value === 0} onPress={() => onChange(value - 1)} />
      <Text style={styles.stepperValue}>{value}</Text>
      <StepperButton icon="plus" disabled={value >= 16} onPress={() => onChange(value + 1)} />
    </View>
  );
}

function StepperButton({ icon, disabled, onPress }: { icon: 'plus' | 'minus'; disabled: boolean; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = disabled ? colors.border : colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.stepperButton, { borderColor: color }]}
      accessibilityLabel={icon === 'plus' ? 'Increase' : 'Decrease'}>
      {icon === 'plus' ? (
        <AddIcon size={18} color={disabled ? colors.disabled : colors.text} strokeWidth={2} />
      ) : (
        <MinusIcon size={18} color={disabled ? colors.disabled : colors.text} strokeWidth={2} />
      )}
    </Pressable>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.canvas,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.background,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
  cards: {
    padding: 14,
    gap: 14,
  },
  card: {
    backgroundColor: c.background,
    borderRadius: 28,
    borderCurve: 'continuous',
    boxShadow: '0 4px 18px rgba(0,0,0,0.08)',
  },
  cardOpen: {
    padding: 26,
  },
  cardCollapsed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 22,
    borderRadius: 18,
  },
  collapsedLabel: {
    fontSize: 15,
    color: c.textSecondary,
    fontWeight: '500',
  },
  collapsedValue: {
    fontSize: 15,
    color: c.text,
    fontWeight: '600',
  },
  bigTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 60,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.inputBorder,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: c.text,
  },
  smallHeading: {
    marginTop: 22,
    marginBottom: 6,
    fontSize: 13,
    color: c.text,
    fontWeight: '500',
  },
  destination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  destinationIcon: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  destinationSubtitle: {
    marginTop: 2,
    fontSize: 14,
    color: c.textSecondary,
  },
  whenFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  whenNext: {
    minWidth: 110,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  guestRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepperValue: {
    minWidth: 18,
    textAlign: 'center',
    fontSize: 16,
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: c.canvas,
  },
  clearAll: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
    textDecorationLine: 'underline',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 54,
    paddingHorizontal: 26,
    borderRadius: 14,
    backgroundColor: c.gradientSolid,
    experimental_backgroundImage: c.gradient,
  },
  searchButtonText: {
    color: c.white,
    fontSize: 17,
    fontWeight: '700',
  },
}));
