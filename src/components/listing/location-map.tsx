import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

import { HomeSmileBoldIcon } from '@/components/icons';
import type { Listing } from '@/data/listings';
import { createStyles, useTheme } from '@/hooks/use-theme';

/** Static preview map: Airbnb shows the approximate area, not the exact address, until you book. */
export function LocationMap({ listing }: { listing: Listing }) {
  const styles = useStyles();
  const { colors, scheme } = useTheme();
  return (
    <View style={styles.frame}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...listing.coords, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
        userInterfaceStyle={scheme}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsPointsOfInterests={false}
        accessibilityLabel="Map of the listing's area">
        <Circle
          center={listing.coords}
          radius={600}
          fillColor={`${colors.primary}2E`}
          strokeColor={`${colors.primary}80`}
          strokeWidth={1}
        />
        <Marker coordinate={listing.coords} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={styles.pin}>
            <HomeSmileBoldIcon size={22} color={colors.white} />
          </View>
        </Marker>
      </MapView>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  frame: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: c.surface,
    // A preview only; taps fall through to the page scroll.
    pointerEvents: 'none',
  },
  pin: {
    // Margin leaves room for the shadow, which is clipped to the marker's bounds on Android.
    margin: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 2px 8px ${c.shadow}`,
  },
}));
