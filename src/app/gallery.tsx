import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ZoomablePhoto } from '@/components/gallery/zoomable-photo';
import { CloseIcon } from '@/components/icons';
import { getListing } from '@/data/listings';
import { createStyles } from '@/hooks/use-theme';

export default function GalleryScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { id, index } = useLocalSearchParams<{ id: string; index?: string }>();
  const images = getListing(id)?.images ?? [];
  const initialIndex = Math.min(Math.max(Number(index) || 0, 0), Math.max(images.length - 1, 0));

  const [current, setCurrent] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const dismissProgress = useSharedValue(0);

  const close = useCallback(() => router.back(), []);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dismissProgress.value, [0, 1], [1, 0.35]),
  }));
  const chromeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dismissProgress.value, [0, 0.5], [1, 0], 'clamp'),
  }));

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Animated.View style={[styles.backdrop, backgroundStyle]} />

      <FlatList
        data={images}
        keyExtractor={(uri) => uri}
        horizontal
        pagingEnabled
        scrollEnabled={!zoomed}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index: i }) => (
          <ZoomablePhoto
            uri={item}
            width={width}
            height={height}
            active={i === current}
            dismissProgress={dismissProgress}
            onZoomChange={i === current ? setZoomed : noop}
            onDismiss={close}
          />
        )}
      />

      <Animated.View style={[styles.topBar, { top: insets.top + 8 }, chromeStyle]} pointerEvents="box-none">
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close photos"
          hitSlop={8}
          style={({ pressed }) => [styles.closeButton, pressed && { transform: [{ scale: 0.92 }] }]}>
          <CloseIcon size={20} color={styles.counterText.color} strokeWidth={2} />
        </Pressable>
        {images.length > 0 && (
          <Text style={styles.counterText}>
            {current + 1} / {images.length}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

function noop() {}

const useStyles = createStyles((c) => ({
  screen: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    // Always black — a photo viewer reads best on black in both themes.
    backgroundColor: c.black,
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34,34,34,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    color: c.white,
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
}));
