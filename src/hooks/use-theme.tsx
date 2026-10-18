import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Appearance, StyleSheet, useColorScheme } from 'react-native';

import { Palette, type Scheme, type ThemeColors } from '@/constants/theme';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme-preference';

type ThemeContextValue = {
  scheme: Scheme;
  colors: ThemeColors;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyToNative(preference: ThemePreference) {
  // Native pieces (keyboard, alerts, switches, glass) follow this too, not just our styles.
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const system = useColorScheme();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setPreferenceState(saved);
          applyToNative(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    applyToNative(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const scheme: Scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  return (
    <ThemeContext.Provider value={{ scheme, colors: Palette[scheme], preference, setPreference }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside AppThemeProvider');
  return context;
}

/**
 * Themed StyleSheet. Both variants are built once, up front, so switching themes is instant:
 *
 *   const useStyles = createStyles((c) => ({ screen: { backgroundColor: c.background } }));
 *   const styles = useStyles();
 */
export function createStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: ThemeColors) => T) {
  const sheets = {
    light: StyleSheet.create(factory(Palette.light)),
    dark: StyleSheet.create(factory(Palette.dark)),
  };
  return function useStyles() {
    return sheets[useTheme().scheme];
  };
}
