import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AltArrowLeftIcon, CloseIcon } from '@/components/icons';
import { LoadingDots } from '@/components/loading-dots';
import { createStyles, useTheme } from '@/hooks/use-theme';

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
  const styles = useStyles();
  const { colors } = useTheme();
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
            {leading === 'back' ? <AltArrowLeftIcon size={24} color={colors.text} /> : <CloseIcon size={24} color={colors.text} />}
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
  /** `brand` is the pink gradient, `dark` is the near-black button (light in dark mode). */
  tone?: 'brand' | 'dark';
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, disabled, loading, tone = 'brand', style }: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const labelColor = disabled ? colors.onDisabled : tone === 'brand' ? colors.white : colors.onInverse;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      style={({ pressed }) => [
        styles.button,
        tone === 'brand' ? styles.buttonBrand : styles.buttonDark,
        disabled && styles.buttonDisabled,
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}>
      {loading ? <LoadingDots color={labelColor} /> : <Text style={[styles.buttonText, { color: labelColor }]}>{label}</Text>}
    </Pressable>
  );
}

export function TextLink({ label, onPress, disabled, size = 16 }: { label: string; onPress: () => void; disabled?: boolean; size?: number }) {
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={10} accessibilityRole="link">
      <Text style={[styles.link, { fontSize: size }, disabled && styles.linkDisabled]}>{label}</Text>
    </Pressable>
  );
}

/** The thick light-gray band Airbnb puts between sections. */
export function SectionBand() {
  const styles = useStyles();
  return <View style={styles.band} />;
}

export function Radio({ selected }: { selected: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioDot} />}
    </View>
  );
}

/** Sticky footer with a hairline on top, used under forms and booking screens. */
export function FooterBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  return <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{children}</View>;
}

const useStyles = createStyles((c) => ({
  header: {
    backgroundColor: c.background,
  },
  headerBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
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
    color: c.text,
  },
  button: {
    height: 54,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBrand: {
    backgroundColor: c.gradientSolid,
    experimental_backgroundImage: c.gradient,
  },
  buttonDark: {
    backgroundColor: c.inverse,
  },
  buttonDisabled: {
    backgroundColor: c.disabled,
    experimental_backgroundImage: 'none',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  link: {
    fontWeight: '600',
    color: c.text,
    textDecorationLine: 'underline',
  },
  linkDisabled: {
    color: c.disabledText,
  },
  band: {
    height: 10,
    backgroundColor: c.band,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: c.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderWidth: 0,
    backgroundColor: c.inverse,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: c.onInverse,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 14,
    backgroundColor: c.background,
    borderTopWidth: 0.5,
    borderTopColor: c.border,
  },
}));
