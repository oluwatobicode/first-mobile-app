import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/** Acceleration magnitude (in g) that counts as a jolt. Resting is ~1g. */
const THRESHOLD = 1.8;
/** How many jolts inside the window make a shake. */
const JOLTS = 3;
const WINDOW_MS = 600;
/** One shake triggers once, however long the user keeps going. */
const COOLDOWN_MS = 2000;
const UPDATE_INTERVAL_MS = 50;

/**
 * Calls `onShake` when the device is shaken. No-op on web or when there's no accelerometer.
 */
export function useShake(onShake: () => void, enabled = true) {
  const callback = useRef(onShake);

  useEffect(() => {
    callback.current = onShake;
  }, [onShake]);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    let cancelled = false;
    let subscription: { remove: () => void } | undefined;
    let jolts: number[] = [];
    let lastShake = 0;

    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!available || cancelled) return;
        Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const now = Date.now();
          if (now - lastShake < COOLDOWN_MS) return;
          if (Math.sqrt(x * x + y * y + z * z) < THRESHOLD) return;

          jolts = jolts.filter((t) => now - t < WINDOW_MS);
          jolts.push(now);
          if (jolts.length >= JOLTS) {
            jolts = [];
            lastShake = now;
            callback.current();
          }
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);
}
