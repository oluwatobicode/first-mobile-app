import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { MapPointIcon, StarBoldIcon } from '@/components/icons';
import { Button, FooterBar, ScreenHeader, TextLink } from '@/components/ui';
import { cardPriceLabel, LISTINGS, placeOf } from '@/data/listings';
import { useShake } from '@/hooks/use-shake';
import { createStyles, useTheme } from '@/hooks/use-theme';

/** Number of flips before the reel stops. */
const STEPS = 16;
const isNative = Platform.OS !== 'web';

/** Ease-out reel: quick flips at first, slowing to a stop over roughly two seconds. */
function delayFor(step: number) {
  const t = step / STEPS;
  return 40 + 260 * t * t;
}

/** A random listing index that isn't the one currently showing. */
function nextIndex(current: number) {
  if (LISTINGS.length < 2) return 0;
  const next = Math.floor(Math.random() * (LISTINGS.length - 1));
  return next >= current ? next + 1 : next;
}

export default function SurpriseScreen() {
  const styles = useStyles();
  const { colors } = useTheme();

  const [index, setIndex] = useState(() => Math.floor(Math.random() * LISTINGS.length));
  const [spinning, setSpinning] = useState(true);
  const [spinId, setSpinId] = useState(0);

  const scale = useSharedValue(1);
  const tilt = useSharedValue(0);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }, { rotate: `${tilt.get()}deg` }],
  }));

  // Warm the cache so the reel doesn't flash blank photos.
  useEffect(() => {
    Image.prefetch(LISTINGS.map((l) => l.images[0])).catch(() => {});
  }, []);

  // Each spin is a chain of timeouts that get further apart, then a bounce on landing.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let step = 0;

    const tick = () => {
      step += 1;
      setIndex((current) => nextIndex(current));
      tilt.set(withSequence(withTiming(step % 2 ? -1.5 : 1.5, { duration: 40 }), withTiming(0, { duration: 80 })));

      if (step < STEPS) {
        if (isNative) Haptics.selectionAsync().catch(() => {});
        timer = setTimeout(tick, delayFor(step));
        return;
      }

      setSpinning(false);
      scale.set(withSequence(withTiming(0.92, { duration: 90 }), withSpring(1, { damping: 7, stiffness: 220 })));
      if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    };

    timer = setTimeout(tick, delayFor(0));
    return () => clearTimeout(timer);
  }, [spinId, scale, tilt]);

  const spinAgain = () => {
    if (spinning) return;
    setSpinning(true);
    setSpinId((id) => id + 1);
  };

  useShake(spinAgain, !spinning);

  const listing = LISTINGS[index];

  return (
    <View style={styles.screen}>
      <ScreenHeader leading="close" safeTop={false} bordered={false} />

      <View style={styles.body}>
        <Text style={styles.title}>Your surprise trip 🎲</Text>
        <Text style={styles.subtitle}>
          {spinning ? 'Shuffling stays…' : isNative ? 'Not feeling it? Shake again for another.' : 'Here’s where you’re headed.'}
        </Text>

        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.photoWrap}>
            <Image source={listing.images[0]} style={styles.photo} contentFit="cover" transition={spinning ? 0 : 200} />
          </View>
          <View style={styles.info}>
            <Text style={styles.listingTitle} numberOfLines={1}>
              {listing.title}
            </Text>
            {!spinning && (
              <Animated.View entering={FadeIn.duration(250)} style={styles.details}>
                <View style={styles.row}>
                  <MapPointIcon size={16} color={colors.textSecondary} />
                  <Text style={styles.meta} numberOfLines={1}>
                    {placeOf(listing).place}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.price}>{cardPriceLabel(listing)}</Text>
                  <View style={styles.rating}>
                    <StarBoldIcon size={14} color={colors.text} />
                    <Text style={styles.ratingText}>
                      {listing.rating.toFixed(2).replace(/0$/, '')} ({listing.reviews})
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </View>

      <FooterBar>
        <TextLink label="Spin again" onPress={spinAgain} disabled={spinning} />
        <Button
          label="View this stay"
          disabled={spinning}
          onPress={() => router.replace({ pathname: '/listing/[id]', params: { id: listing.id } })}
          style={{ minWidth: 170 }}
        />
      </FooterBar>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 8,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: c.textSecondary,
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: c.elevated,
    boxShadow: `0 6px 20px ${c.shadow}`,
  },
  photoWrap: {
    aspectRatio: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: c.surface,
  },
  photo: {
    flex: 1,
  },
  info: {
    padding: 18,
    gap: 8,
    minHeight: 104,
  },
  listingTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: c.text,
  },
  details: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    flexShrink: 1,
    fontSize: 15,
    color: c.textSecondary,
  },
  price: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
}));
