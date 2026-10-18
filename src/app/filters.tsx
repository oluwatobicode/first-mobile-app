import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { RangeSlider } from '@/components/range-slider';
import { Button, FooterBar, ScreenHeader, TextLink } from '@/components/ui';
import { AMENITY_LABELS, formatPrice, LISTINGS, type Amenity } from '@/data/listings';
import { NO_FILTERS, PRICE_MAX, PRICE_MIN, useFilters, type Filters } from '@/hooks/use-filters';
import { createStyles, useTheme } from '@/hooks/use-theme';

const AMENITIES = Object.keys(AMENITY_LABELS) as Amenity[];
const BUCKETS = 24;

/** Bar heights for the price histogram above the slider. */
const HISTOGRAM = (() => {
  const counts = Array.from({ length: BUCKETS }, () => 0);
  for (const l of LISTINGS) counts[Math.min(BUCKETS - 1, Math.floor((l.price / PRICE_MAX) * BUCKETS))] += 1;
  const peak = Math.max(...counts, 1);
  return counts.map((n) => 0.15 + (n / peak) * 0.85);
})();

export default function FiltersSheet() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { filters, setFilters } = useFilters();
  // Edit a local copy; nothing changes on Explore until "Show stays".
  const [draft, setDraft] = useState<Filters>(filters);
  const update = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }));

  const matches = LISTINGS.filter(
    (l) =>
      l.price >= draft.minPrice &&
      (draft.maxPrice >= PRICE_MAX || l.price <= draft.maxPrice) &&
      draft.amenities.every((a) => l.amenities.includes(a)) &&
      (!draft.guestFavoriteOnly || l.guestFavorite)
  ).length;

  const toggleAmenity = (amenity: Amenity) =>
    update({
      amenities: draft.amenities.includes(amenity)
        ? draft.amenities.filter((a) => a !== amenity)
        : [...draft.amenities, amenity],
    });

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Filters" leading="close" safeTop={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Price range</Text>
        <Text style={styles.hint}>Nightly prices for homes, per guest for experiences</Text>

        <View style={styles.histogram}>
          {HISTOGRAM.map((h, i) => {
            const bucketPrice = (i / BUCKETS) * PRICE_MAX;
            const inRange = bucketPrice >= draft.minPrice && bucketPrice <= draft.maxPrice;
            return (
              <View
                key={i}
                style={[styles.bar, { height: `${h * 100}%`, backgroundColor: inRange ? colors.primary : colors.border }]}
              />
            );
          })}
        </View>
        <RangeSlider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={5000}
          low={draft.minPrice}
          high={draft.maxPrice}
          onChange={(minPrice, maxPrice) => update({ minPrice, maxPrice })}
        />
        <View style={styles.priceRow}>
          <PriceBox label="Minimum" value={formatPrice(draft.minPrice)} />
          <View style={styles.priceDash} />
          <PriceBox label="Maximum" value={draft.maxPrice >= PRICE_MAX ? `${formatPrice(PRICE_MAX)}+` : formatPrice(draft.maxPrice)} />
        </View>

        <View style={styles.rule} />

        <Text style={styles.heading}>Amenities</Text>
        <View style={styles.chips}>
          {AMENITIES.map((amenity) => {
            const selected = draft.amenities.includes(amenity);
            return (
              <Pressable
                key={amenity}
                onPress={() => toggleAmenity(amenity)}
                style={[styles.chip, selected && styles.chipSelected]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}>
                {selected && <CheckIcon size={16} color={colors.text} strokeWidth={2.4} />}
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{AMENITY_LABELS[amenity]}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.rule} />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Guest favorites</Text>
            <Text style={styles.hint}>The most loved homes, according to guests</Text>
          </View>
          <Switch
            value={draft.guestFavoriteOnly}
            onValueChange={(guestFavoriteOnly) => update({ guestFavoriteOnly })}
            trackColor={{ true: colors.inverse }}
            accessibilityLabel="Guest favorites only"
          />
        </View>
      </ScrollView>

      <FooterBar>
        <TextLink
          label="Clear all"
          onPress={() => setDraft({ ...NO_FILTERS, where: draft.where, guests: draft.guests })}
        />
        <Button
          label={matches === 0 ? 'No matches' : `Show ${matches} ${matches === 1 ? 'stay' : 'stays'}`}
          tone="dark"
          disabled={matches === 0}
          onPress={() => {
            setFilters(draft);
            router.back();
          }}
          style={{ minWidth: 170 }}
        />
      </FooterBar>
    </View>
  );
}

function PriceBox({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.priceBox}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>{value}</Text>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: c.text,
  },
  hint: {
    marginTop: 4,
    fontSize: 14,
    color: c.textSecondary,
  },
  histogram: {
    height: 64,
    marginTop: 24,
    marginHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    flex: 1,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  priceDash: {
    width: 12,
    height: 1,
    backgroundColor: c.inputBorder,
  },
  priceBox: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.inputBorder,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: c.textSecondary,
  },
  priceValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  rule: {
    height: 0.5,
    backgroundColor: c.border,
    marginVertical: 28,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
  },
  chipSelected: {
    borderWidth: 2,
    borderColor: c.text,
    backgroundColor: c.surface,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  chipText: {
    fontSize: 15,
    color: c.text,
  },
  chipTextSelected: {
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
}));
