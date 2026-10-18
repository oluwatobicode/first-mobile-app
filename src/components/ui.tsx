import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AltArrowLeftIcon, CloseIcon } from '@/components/icons';
import { LoadingDots } from '@/components/loading-dots';
import { Brand } from '@/constants/theme';

type HeaderProps = {
  title?: string;
  /** `back` shows a chevron, `close` shows an X, `none` hides it. */
  leading?: 'back' | 'close' | 'none';
  onLeadingPress?: () => void;
  trailing?: ReactNode;
  /** Pad for the status bar. Sheets and modals usually don't need it. */
  safeTop?: boolean;
  bordered?: boolean;
};

export function ScreenHeader({ title, leading = 'back', onLeadingPress, trailing, safeTop = true, bordered = true }: HeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, bordered && styles.headerBorder, safeTop && { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        {leading !== 'none' && (
          <Pressable
            onPress={onLeadingPress ?? (() => router.back())}
            hitSlop={12}
            style={styles.headerLeading}
            accessibilityRole="button"
            accessibilityLabel={leading === 'back' ? 'Go back' : 'Close'}>
            {leading === 'back' ? <AltArrowLeftIcon size={24} color={Brand.text} /> : <CloseIcon size={24} color={Brand.text} />}
          </Pressable>
        )}
        {title && (
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        )}
        {trailing && <View style={styles.headerTrailing}>{trailing}</View>}
      </View>
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** `brand` is the pink gradient, `dark` is the near-black button. */
  tone?: 'brand' | 'dark';
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, disabled, loading, tone = 'brand', style }: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      style={({ pressed }) => [
        styles.button,
        tone === 'brand' ? styles.buttonBrand : styles.buttonDark,
        inactive && styles.buttonDisabled,
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}>
      {loading ? <LoadingDots /> : <Text style={styles.buttonText}>{label}</Text>}
    </Pressable>
  );
}

export function TextLink({ label, onPress, disabled, size = 16 }: { label: string; onPress: () => void; disabled?: boolean; size?: number }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={10} accessibilityRole="link">
      <Text style={[styles.link, { fontSize: size }, disabled && styles.linkDisabled]}>{label}</Text>
    </Pressable>
  );
}

/** The thick light-gray band Airbnb puts between sections. */
export function SectionBand() {
  return <View style={styles.band} />;
}

export function Radio({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioDot} />}
    </View>
  );
}

/** Sticky footer with a hairline on top, used under forms and booking screens. */
export function FooterBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{children}</View>;
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Brand.background,
  },
  headerBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  headerRow: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 64,
  },
  headerLeading: {
    position: 'absolute',
    left: 20,
  },
  headerTrailing: {
    position: 'absolute',
    right: 24,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.text,
  },
  button: {
    height: 54,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBrand: {
    backgroundColor: '#E31C5F',
    experimental_backgroundImage: 'linear-gradient(90deg, #E61E4D, #D70466)',
  },
  buttonDark: {
    backgroundColor: Brand.text,
  },
  buttonDisabled: {
    backgroundColor: '#DDDDDD',
    experimental_backgroundImage: 'none',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  link: {
    fontWeight: '600',
    color: Brand.text,
    textDecorationLine: 'underline',
  },
  linkDisabled: {
    color: '#C4C4C4',
  },
  band: {
    height: 10,
    backgroundColor: '#EBEBEB',
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#B0B0B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderWidth: 0,
    backgroundColor: Brand.text,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 14,
    backgroundColor: Brand.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
  },
});
