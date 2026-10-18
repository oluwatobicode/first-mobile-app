import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

const PREFIX = 'stay:';

/**
 * Like useState, but saved on the device. Loads once on mount; `hydrated` is false until then,
 * so callers can avoid acting on the initial value before the saved one arrives.
 */
export function usePersistedState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PREFIX + key)
      .then((saved) => {
        if (!active) return;
        if (saved !== null) setValue(JSON.parse(saved) as T);
      })
      .catch(() => {})
      .finally(() => active && setHydrated(true));
    return () => {
      active = false;
    };
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)).catch(() => {});
  }, [hydrated, key, value]);

  return [value, setValue, hydrated];
}

/** Wipes everything the app saved (handy for a "reset demo" button). */
export async function clearPersistedState() {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
  await AsyncStorage.multiRemove(keys);
}
