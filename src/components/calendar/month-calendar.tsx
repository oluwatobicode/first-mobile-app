import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { createStyles } from '@/hooks/use-theme';
import { formatDay, monthGrid, monthTitle, todayKey, upcomingMonths } from '@/lib/dates';

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DEFAULT_MONTHS = upcomingMonths(12);

export type CalendarMonth = { year: number; month: number };

type Props = {
  start: string | null;
  end: string | null;
  /** Called with the new selection. With `range`, the first tap sets `start`, the second sets `end`. */
  onChange: (start: string | null, end: string | null) => void;
  /** Days that can't be picked. Defaults to "anything before today". */
  isDisabled?: (key: string) => boolean;
  /** Months to render, in order. Defaults to the next 12. */
  months?: CalendarMonth[];
  /** Pick a check-in/checkout range (default) or a single day. */
  range?: boolean;
  /** Width the 7 columns share (the calendar adds no horizontal padding of its own). */
  width: number;
};

/** Cell size for a calendar laid out across `width`. */
export function calendarCell(width: number) {
  return Math.floor(width / 7);
}

/** S M T W T F S, matching the calendar's columns. Render it above a scrolling calendar so it stays put. */
export function WeekdayHeader({ width, style }: { width: number; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  const cell = calendarCell(width);
  return (
    <View style={[styles.weekdays, style]}>
      {WEEKDAY_LETTERS.map((letter, i) => (
        <Text key={i} style={[styles.weekday, { width: cell }]}>
          {letter}
        </Text>
      ))}
    </View>
  );
}

/** Stacked month grids with Airbnb-style range selection. Doesn't scroll on its own. */
export function MonthCalendar({ start, end, onChange, isDisabled, months = DEFAULT_MONTHS, range = true, width }: Props) {
  const styles = useStyles();
  const today = todayKey();
  const cell = calendarCell(width);
  const picking: 'start' | 'end' = range && start && !end ? 'end' : 'start';
  const disabled = isDisabled ?? ((key: string) => key < today);

  const onDayPress = (key: string) => {
    if (!range || picking === 'start' || (start && key <= start)) onChange(key, null);
    else onChange(start, key);
  };

  return (
    <View>
      {months.map(({ year, month }) => (
        <View key={`${year}-${month}`} style={styles.month}>
          <Text style={styles.monthTitle}>{monthTitle(year, month)}</Text>
          <View style={styles.grid}>
            {monthGrid(year, month).map((key, index) => {
              if (!key) return <View key={`pad-${index}`} style={{ width: cell, height: cell }} />;

              const unavailable = disabled(key);
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
                    <View style={[styles.band, { height: cell - 6 }, isStart && { left: '50%' }, isEnd && { right: '50%' }]} />
                  )}
                  <View
                    style={[
                      styles.day,
                      { width: cell - 6, height: cell - 6, borderRadius: cell },
                      (isStart || isEnd) && styles.daySelected,
                    ]}>
                    <Text
                      style={[styles.dayText, unavailable && styles.dayUnavailable, (isStart || isEnd) && styles.dayTextSelected]}>
                      {Number(key.slice(8))}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const useStyles = createStyles((c) => ({
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
}));
