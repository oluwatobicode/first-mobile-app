import { Image } from 'expo-image';
import { View } from 'react-native';

import { HeartIcon } from '@/components/icons';
import { createStyles, useTheme } from '@/hooks/use-theme';

type Props = {
  images: string[];
  size: number;
  /** `collage` is the wishlists-tab cover (big left, two stacked right); `single` shows only the first photo. */
  variant?: 'collage' | 'single';
  radius?: number;
};

/** Airbnb-style wishlist cover: up to three photos, or a soft placeholder when the list is empty. */
export function WishlistCover({ images, size, variant = 'collage', radius = 20 }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const photos = variant === 'single' ? images.slice(0, 1) : images.slice(0, 3);
  const frame = [styles.frame, { width: size, height: size, borderRadius: radius }];

  if (photos.length === 0) {
    return (
      <View style={[frame, styles.placeholder]}>
        <HeartIcon size={size * 0.24} color={colors.placeholder} strokeWidth={1.6} />
      </View>
    );
  }

  if (photos.length === 1) {
    return (
      <View style={frame}>
        <Image source={photos[0]} style={styles.fill} contentFit="cover" transition={200} />
      </View>
    );
  }

  return (
    <View style={[frame, styles.row]}>
      <Image source={photos[0]} style={styles.big} contentFit="cover" transition={200} />
      <View style={styles.column}>
        <Image source={photos[1]} style={styles.fill} contentFit="cover" transition={200} />
        {photos[2] ? (
          <Image source={photos[2]} style={styles.fill} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.fill, styles.placeholder]} />
        )}
      </View>
    </View>
  );
}

const GAP = 2;

const useStyles = createStyles((c) => ({
  frame: {
    overflow: 'hidden',
    borderCurve: 'continuous',
    backgroundColor: c.background,
  },
  placeholder: {
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  big: {
    flex: 2,
  },
  column: {
    flex: 1,
    gap: GAP,
  },
}));
