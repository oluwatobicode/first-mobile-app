import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Button, TextLink } from '@/components/ui';
import { createStyles } from '@/hooks/use-theme';

type Props = {
  label: string;
  value?: string;
  /** Shown under the label while editing, instead of the value. */
  description?: string;
  editing: boolean;
  /** Another row is open, so this one is dimmed and locked. */
  dimmed: boolean;
  onEdit: () => void;
  onCancel: () => void;
  /** The inline form; only mounted while editing. */
  children: ReactNode;
  actionLabel?: string;
};

/** Airbnb's personal-info row: label + value + "Edit", expanding into an inline form. */
export function EditableRow({ label, value, description, editing, dimmed, onEdit, onCancel, children, actionLabel }: Props) {
  const styles = useStyles();
  const empty = !value;
  return (
    <Animated.View layout={LinearTransition.duration(220)} style={[styles.row, dimmed && styles.dimmed]} pointerEvents={dimmed ? 'none' : 'auto'}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value} numberOfLines={editing ? undefined : 2}>
            {editing ? description : empty ? 'Not provided' : value}
          </Text>
        </View>
        <TextLink
          label={editing ? 'Cancel' : actionLabel ?? (empty ? 'Add' : 'Edit')}
          onPress={editing ? onCancel : onEdit}
          disabled={dimmed}
        />
      </View>
      {editing && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.form}>
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
}

/** Save button under an inline form. */
export function InlineSave({ onPress, disabled, loading }: { onPress: () => void; disabled?: boolean; loading?: boolean }) {
  return <Button label="Save" tone="dark" onPress={onPress} disabled={disabled} loading={loading} style={{ alignSelf: 'flex-start', minWidth: 110 }} />;
}

const useStyles = createStyles((c) => ({
  row: {
    paddingVertical: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  dimmed: {
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  label: {
    fontSize: 16,
    color: c.text,
  },
  value: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: c.textSecondary,
  },
  form: {
    marginTop: 18,
    gap: 16,
  },
}));
