import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { MonthCalendar, WeekdayHeader } from '@/components/calendar/month-calendar';
import { AddIcon, CalendarMarkIcon, MinusIcon } from '@/components/icons';
import { createStyles, useTheme } from '@/hooks/use-theme';
import { formatRange, monthTitle, toKey, upcomingMonths } from '@/lib/dates';

export type WhenMode = 'dates' | 'months' | 'flexible';
export type FlexDays = 0 | 1 | 2 | 3 | 7;
export type StayLength = 'weekend' | 'week' | 'month';

export type WhenValue = {
  mode: WhenMode;
  start: string | null;
  end: string | null;
  /** "± 2 days" around the exact dates. */
  flexDays: FlexDays;
  /** Months mode: how long, and from which 1st of the month. */
  months: number;
  monthsStart: string;
  /** Flexible mode. `flexMonths` are 'YYYY-MM' keys. */
  stay: StayLength;
  flexMonths: string[];
};

const NEXT_MONTHS = upcomingMonths(6);
const monthKey = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, '0')}`;
const firstOf = (year: number, month: number) => toKey(new Date(year, month, 1));
const shortMonth = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return monthTitle(y, m - 1).slice(0, 3);
};

export const EMPTY_WHEN: WhenValue = {
  mode: 'dates',
  start: null,
  end: null,
  flexDays: 0,
  months: 3,
  monthsStart: firstOf(NEXT_MONTHS[1].year, NEXT_MONTHS[1].month),
  stay: 'weekend',
  flexMonths: [],
};

function joinOr(items: string[]) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`;
}

/** The collapsed "When" row: "Nov 14 – 17", "3 months from Dec 1", "A weekend in Dec or Jan". Null = nothing picked. */
export function whenSummary(value: WhenValue): string | null {
  if (value.mode === 'dates') {
    if (!value.start) return null;
    return `${formatRange(value.start, value.end)}${value.flexDays ? ` ± ${value.flexDays}` : ''}`;
  }
  if (value.mode === 'months') {
    return `${value.months} month${value.months === 1 ? '' : 's'} from ${formatRange(value.monthsStart, null)}`;
  }
  const months = value.flexMonths.map(shortMonth);
  return `A ${value.stay}${months.length ? ` in ${joinOr(months)}` : ', any time'}`;
}

const MODES: { key: WhenMode; label: string }[] = [
  { key: 'dates', label: 'Dates' },
  { key: 'months', label: 'Months' },
  { key: 'flexible', label: 'Flexible' },
];

const FLEX_OPTIONS: { key: FlexDays; label: string }[] = [
  { key: 0, label: 'Exact dates' },
  { key: 1, label: '± 1 day' },
  { key: 2, label: '± 2 days' },
  { key: 3, label: '± 3 days' },
  { key: 7, label: '± 7 days' },
];

const STAYS: { key: StayLength; label: string }[] = [
  { key: 'weekend', label: 'Weekend' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

type Props = {
  value: WhenValue;
  onChange: (value: WhenValue) => void;
  /** Inner width of the card the picker sits in. */
  width: number;
};

/** Airbnb's "When's your trip?" card body: Dates | Months | Flexible. */
export function WhenPicker({ value, onChange, width }: Props) {
  const styles = useStyles();
  const set = (patch: Partial<WhenValue>) => onChange({ ...value, ...patch });

  return (
    <View>
      <Segmented value={value.mode} width={width} onChange={(mode) => set({ mode })} />

      {value.mode === 'dates' && (
        <Animated.View entering={FadeIn.duration(200)}>
          <WeekdayHeader width={width} style={{ marginTop: 14 }} />
          <ScrollView style={styles.calendarScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            <MonthCalendar
              start={value.start}
              end={value.end}
              width={width}
              onChange={(start, end) => {
                tick();
                set({ start, end });
              }}
            />
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsScroll}>
            {FLEX_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                selected={option.key === value.flexDays}
                onPress={() => {
                  tick();
                  set({ flexDays: option.key });
                }}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {value.mode === 'months' && <MonthsDial value={value} onChange={set} />}

      {value.mode === 'flexible' && (
        <Animated.View entering={FadeIn.duration(200)}>
          <Text style={styles.subheading}>Stay for a</Text>
          <View style={styles.chipsWrap}>
            {STAYS.map((stay) => (
              <Chip
                key={stay.key}
                label={stay.label}
                selected={stay.key === value.stay}
                onPress={() => {
                  tick();
                  set({ stay: stay.key });
                }}
              />
            ))}
          </View>
          <Text style={styles.subheading}>Go anytime</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthCards} style={styles.monthCardsScroll}>
            {NEXT_MONTHS.map(({ year, month }) => {
              const key = monthKey(year, month);
              const selected = value.flexMonths.includes(key);
              const [name] = monthTitle(year, month).split(' ');
              return (
                <MonthCard
                  key={key}
                  name={name}
                  year={year}
                  selected={selected}
                  onPress={() => {
                    tick();
                    set({
                      flexMonths: selected
                        ? value.flexMonths.filter((k) => k !== key)
                        : [...value.flexMonths, key].sort(),
                    });
                  }}
                />
              );
            })}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

function Segmented({ value, width, onChange }: { value: WhenMode; width: number; onChange: (mode: WhenMode) => void }) {
  const styles = useStyles();
  const segment = (width - 8) / MODES.length;
  const index = MODES.findIndex((m) => m.key === value);
  const x = useSharedValue(index * segment);

  useEffect(() => {
    x.set(withSpring(index * segment, { damping: 20, stiffness: 220 }));
  }, [index, segment, x]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      <Animated.View style={[styles.segmentIndicator, { width: segment }, indicatorStyle]} />
      {MODES.map((mode) => {
        const active = mode.key === value;
        return (
          <Pressable
            key={mode.key}
            onPress={() => {
              if (active) return;
              tick();
              onChange(mode.key);
            }}
            style={[styles.segment, { width: segment }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{mode.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const DIAL = 190;
const DOT = 14;

function MonthsDial({ value, onChange }: { value: WhenValue; onChange: (patch: Partial<WhenValue>) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [editingStart, setEditingStart] = useState(false);
  const step = (delta: number) => {
    const months = Math.min(12, Math.max(1, value.months + delta));
    if (months === value.months) return;
    tick();
    onChange({ months });
  };

  const radius = DIAL / 2 - DOT;
  const starts = NEXT_MONTHS.slice(1).map(({ year, month }) => firstOf(year, month));

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.dialWrap}>
      <Text style={styles.subheading}>How long?</Text>
      <View style={styles.dialRow}>
        <StepButton icon="minus" disabled={value.months <= 1} onPress={() => step(-1)} />
        <View style={{ width: DIAL, height: DIAL }}>
          {Array.from({ length: 12 }, (_, i) => {
            // Dot 0 sits at 12 o'clock, then clockwise.
            const angle = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
            const filled = i < value.months;
            return (
              <View
                key={i}
                style={[
                  styles.dialDot,
                  {
                    left: DIAL / 2 + radius * Math.cos(angle) - DOT / 2,
                    top: DIAL / 2 + radius * Math.sin(angle) - DOT / 2,
                    backgroundColor: filled ? colors.primary : colors.surface,
                  },
                ]}
              />
            );
          })}
          <View style={styles.dialCenter}>
            <Text style={styles.dialNumber}>{value.months}</Text>
            <Text style={styles.dialLabel}>{value.months === 1 ? 'month' : 'months'}</Text>
          </View>
        </View>
        <StepButton icon="plus" disabled={value.months >= 12} onPress={() => step(1)} />
      </View>

      <Text style={styles.startLine}>
        Starting <Text style={styles.startStrong}>{formatRange(value.monthsStart, null)}</Text> ·{' '}
        <Text style={styles.editLink} onPress={() => setEditingStart((on) => !on)} accessibilityRole="link">
          {editingStart ? 'Done' : 'Edit'}
        </Text>
      </Text>
      {editingStart && (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsScroll}>
        {starts.map((key) => (
          <Chip
            key={key}
            label={formatRange(key, null)}
            selected={key === value.monthsStart}
            onPress={() => {
              tick();
              onChange({ monthsStart: key });
            }}
          />
        ))}
      </ScrollView>
      )}
    </Animated.View>
  );
}

function StepButton({ icon, disabled, onPress }: { icon: 'plus' | 'minus'; disabled: boolean; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = disabled ? colors.disabled : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={[styles.stepButton, { borderColor: disabled ? colors.border : colors.textSecondary }]}
      accessibilityLabel={icon === 'plus' ? 'More months' : 'Fewer months'}>
      {icon === 'plus' ? <AddIcon size={18} color={color} strokeWidth={2} /> : <MinusIcon size={18} color={color} strokeWidth={2} />}
    </Pressable>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function MonthCard({ name, year, selected, onPress }: { name: string; year: number; selected: boolean; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.monthCard, selected && styles.monthCardSelected, pressed && { transform: [{ scale: 0.97 }] }]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}>
      <CalendarMarkIcon size={30} color={selected ? colors.text : colors.textSecondary} strokeWidth={1.5} />
      <Text style={styles.monthName}>{name}</Text>
      <Text style={styles.monthYear}>{year}</Text>
    </Pressable>
  );
}

const useStyles = createStyles((c) => ({
  segmented: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    backgroundColor: c.surface,
  },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 999,
    backgroundColor: c.elevated,
    boxShadow: `0 1px 4px ${c.shadow}`,
  },
  segment: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textSecondary,
  },
  segmentTextActive: {
    color: c.text,
  },
  calendarScroll: {
    height: 330,
  },
  chipsScroll: {
    alignSelf: 'stretch',
    flexGrow: 0,
    marginTop: 14,
    marginHorizontal: -26,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 26,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
  },
  chipSelected: {
    borderColor: c.text,
    backgroundColor: c.surface,
  },
  chipText: {
    fontSize: 14,
    color: c.text,
    fontWeight: '500',
  },
  chipTextSelected: {
    fontWeight: '700',
  },
  subheading: {
    marginTop: 22,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  dialWrap: {
    alignItems: 'center',
  },
  dialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dialDot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  dialCenter: {
    position: 'absolute',
    top: DOT * 2,
    left: DOT * 2,
    right: DOT * 2,
    bottom: DOT * 2,
    borderRadius: DIAL,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.elevated,
    boxShadow: `0 4px 14px ${c.shadow}`,
  },
  dialNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  dialLabel: {
    marginTop: -4,
    fontSize: 15,
    fontWeight: '600',
    color: c.textSecondary,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLine: {
    marginTop: 20,
    fontSize: 15,
    color: c.textSecondary,
  },
  startStrong: {
    color: c.text,
    fontWeight: '700',
  },
  editLink: {
    color: c.text,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  monthCardsScroll: {
    marginHorizontal: -26,
  },
  monthCards: {
    gap: 10,
    paddingHorizontal: 26,
  },
  monthCard: {
    width: 104,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: c.border,
  },
  monthCardSelected: {
    borderWidth: 2,
    borderColor: c.text,
    backgroundColor: c.surface,
  },
  monthName: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  monthYear: {
    fontSize: 13,
    color: c.textSecondary,
  },
}));
