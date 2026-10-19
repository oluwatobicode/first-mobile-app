import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AltArrowRightIcon, type SolarIcon } from '@/components/icons';
import { createStyles, useTheme } from '@/hooks/use-theme';

/** A titled group of rows, like "Settings" or "Support" on the profile tab. */
export function SettingsSection({ title, children, style }: { title?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles();
  return (
    <View style={[styles.section, style]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );
}

type RowProps = {
  Icon?: SolarIcon;
  label: string;
  hint?: string;
  onPress?: () => void;
  /** Replaces the chevron. */
  trailing?: ReactNode;
  last?: boolean;
  destructive?: boolean;
};

/** Icon + label + chevron row with a hairline under it. */
export function SettingsRow({ Icon, label, hint, onPress, trailing, last, destructive }: RowProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = destructive ? colors.error : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.pressed]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={hint ? `${label}, ${hint}` : label}>
      {Icon && <Icon size={24} color={color} />}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color }]}>{label}</Text>
        {hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      {trailing ?? (onPress ? <AltArrowRightIcon size={20} color={colors.textSecondary} /> : null)}
    </Pressable>
  );
}

/** A row with a switch, for notification-style preferences. */
export function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
  last,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (on: boolean) => void;
  last?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={(on) => {
          if (Platform.OS !== 'web') Haptics.selectionAsync();
          onValueChange(on);
        }}
        trackColor={{ true: colors.text }}
        accessibilityLabel={label}
      />
    </View>
  );
}

/** Underlined text tabs, like "Payments | Payouts". */
export function UnderlineTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const selected = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => {
              if (!selected && Platform.OS !== 'web') Haptics.selectionAsync();
              onChange(tab.key);
            }}
            style={[styles.tab, selected && styles.tabSelected]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}>
            <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Round initial avatar (inverse colours), optionally with a verified tick. */
export function Avatar({ name, size = 56, verified }: { name: string; size?: number; verified?: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{(name[0] ?? '?').toUpperCase()}</Text>
      {verified && (
        <View style={[styles.verified, { width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16 }]}>
          <Text style={[styles.verifiedText, { fontSize: size * 0.16 }]}>✓</Text>
        </View>
      )}
    </View>
  );
}

const useStyles = createStyles((c) => ({
  section: {
    marginTop: 36,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: c.text,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  pressed: {
    opacity: 0.6,
  },
  rowLabel: {
    fontSize: 16,
    color: c.text,
  },
  rowHint: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: c.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    gap: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  tab: {
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -StyleSheet.hairlineWidth,
  },
  tabSelected: {
    borderBottomColor: c.text,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textSecondary,
  },
  tabTextSelected: {
    color: c.text,
  },
  avatar: {
    backgroundColor: c.inverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: c.onInverse,
    fontWeight: '700',
  },
  verified: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: c.elevated,
  },
  verifiedText: {
    color: c.white,
    fontWeight: '800',
  },
}));
