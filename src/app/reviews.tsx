import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon, MagnifierIcon } from '@/components/icons';
import { CATEGORY_ICONS, RatingBars, RatingHeading, ReviewCard, useListingReviews } from '@/components/listing/reviews';
import { ScreenHeader } from '@/components/ui';
import { ratingBreakdown } from '@/data/details';
import { getListing, type Listing } from '@/data/listings';
import { createStyles, useTheme } from '@/hooks/use-theme';

export default function ReviewsScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = getListing(id);

  return (
    <View style={styles.screen}>
      <ScreenHeader leading="close" safeTop={false} bordered={false} />
      {listing ? <Reviews listing={listing} /> : <Text style={styles.empty}>Listing not found</Text>}
    </View>
  );
}

function Reviews({ listing }: { listing: Listing }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { reviews, total } = useListingReviews(listing, 14);
  const { scores, stars } = ratingBreakdown(listing);

  const needle = query.trim().toLowerCase();
  const shown = needle ? reviews.filter((r) => r.text.toLowerCase().includes(needle) || r.name.toLowerCase().includes(needle)) : reviews;

  const header = (
    <View>
      <RatingHeading listing={listing} total={total} compact />

      <View style={styles.summary}>
        <View style={styles.overall}>
          <Text style={styles.label}>Overall rating</Text>
          <RatingBars stars={stars} />
        </View>
        {scores.map(({ label, score }) => {
          const Icon = CATEGORY_ICONS[label];
          return (
            <View key={label} style={styles.category}>
              <Icon size={24} />
              <Text style={[styles.label, { flex: 1 }]}>{label}</Text>
              <Text style={styles.score}>{score.toFixed(1)}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.count}>{total} reviews</Text>
      <View style={styles.search}>
        <MagnifierIcon size={20} color={colors.text} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search reviews"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="never"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
            <CloseIcon size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <FlatList
      data={shown}
      keyExtractor={(r) => r.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      ListHeaderComponent={header}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<Text style={styles.empty}>No reviews mention “{query.trim()}”.</Text>}
      renderItem={({ item }) => <ReviewCard review={item} variant="row" />}
    />
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
  summary: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
  },
  overall: {
    gap: 8,
    paddingBottom: 18,
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  score: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  count: {
    fontSize: 22,
    fontWeight: '600',
    color: c.text,
    marginTop: 28,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.inputBorder,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: c.text,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.border,
  },
  empty: {
    fontSize: 16,
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
}));
