import { router } from 'expo-router';
import { useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { ListingCard } from '@/components/listing-card';
import { EmptyState, TabScreen } from '@/components/tab-screen';
import { getListing } from '@/data/listings';
import { useWishlist } from '@/hooks/use-wishlist';
import { createStyles } from '@/hooks/use-theme';

export default function WishlistsScreen() {
  const styles = useStyles();
  const { ids } = useWishlist();
  const { width } = useWindowDimensions();
  const cardWidth = (Math.min(width, 800) - 24 * 2 - 14) / 2;
  const saved = ids.map(getListing).filter((listing) => listing !== undefined);

  return (
    <TabScreen title="Wishlists">
      {saved.length === 0 ? (
        <EmptyState
          emoji="💖"
          heading="Create your first wishlist"
          body="As you explore, tap the heart icon to save your favorite homes and experiences here."
          action={{ label: 'Start exploring', onPress: () => router.navigate('/') }}
        />
      ) : (
        <View style={styles.grid}>
          {saved.map((listing) => (
            <Animated.View key={listing.id} entering={FadeIn} layout={LinearTransition}>
              <ListingCard listing={listing} width={cardWidth} />
            </Animated.View>
          ))}
        </View>
      )}
    </TabScreen>
  );
}

const useStyles = createStyles((c) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 24,
  },
}));
