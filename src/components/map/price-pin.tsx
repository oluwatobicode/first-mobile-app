import { Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { formatPrice, type Listing } from '@/data/listings';
import { createStyles } from '@/hooks/use-theme';

type Props = {
  listing: Listing;
  selected: boolean;
  onPress: () => void;
};

export function PricePin({ listing, selected, onPress }: Props) {
  const styles = useStyles();
  return (
    <Marker
      coordinate={listing.coords}
      onPress={onPress}
      stopPropagation
      tracksViewChanges={false}
      zIndex={selected ? 2 : 1}
      accessibilityLabel={`${listing.title}, ${formatPrice(listing.price)}`}>
      <View style={[styles.pill, selected && styles.pillSelected]}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{formatPrice(listing.price)}</Text>
      </View>
    </Marker>
  );
}

const useStyles = createStyles((c) => ({
  pill: {
    // Margin leaves room for the shadow, which is clipped to the marker's bounds on Android.
    margin: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: c.elevated,
    borderWidth: 1,
    borderColor: c.border,
    boxShadow: `0 2px 6px ${c.shadow}`,
  },
  pillSelected: {
    backgroundColor: c.inverse,
    borderColor: c.inverse,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: c.text,
  },
  labelSelected: {
    color: c.onInverse,
  },
}));
