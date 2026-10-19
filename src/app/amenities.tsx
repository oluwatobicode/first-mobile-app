import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AMENITY_GROUPS, hasAmenity, type AmenityItem } from '@/components/listing/amenity-catalog';
import { ScreenHeader } from '@/components/ui';
import { getListing } from '@/data/listings';
import { createStyles, useTheme } from '@/hooks/use-theme';

export default function AmenitiesScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = getListing(id);

  const groups = listing
    ? AMENITY_GROUPS.map((g) => ({ title: g.title, items: g.items.filter((item) => hasAmenity(listing, item)) })).filter(
        (g) => g.items.length > 0
      )
    : [];
  // Airbnb lists what's missing at the very bottom, struck through.
  const missing = listing ? AMENITY_GROUPS.flatMap((g) => g.items).filter((item) => !hasAmenity(listing, item)) : [];

  return (
    <View style={styles.screen}>
      <ScreenHeader leading="close" safeTop={false} bordered={false} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.title}>What this place offers</Text>
        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.items.map((item) => (
              <Row key={item.label} item={item} />
            ))}
          </View>
        ))}
        {missing.length > 0 && (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Not included</Text>
            {missing.map((item) => (
              <Row key={item.label} item={item} missing />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ item, missing }: { item: AmenityItem; missing?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { Icon } = item;
  return (
    <View style={styles.row} accessibilityLabel={missing ? `${item.label}, not included` : item.label}>
      <Icon size={26} color={missing ? colors.textSecondary : colors.text} />
      <Text style={[styles.label, missing && styles.missing]}>{item.label}</Text>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: c.text,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  group: {
    marginTop: 28,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: c.text,
  },
  missing: {
    color: c.textSecondary,
    textDecorationLine: 'line-through',
  },
}));
