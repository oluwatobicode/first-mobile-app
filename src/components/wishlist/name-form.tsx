import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { TextField } from '@/components/form/text-field';
import { Button, TextLink } from '@/components/ui';
import { WISHLIST_NAME_MAX, wishlistNameSchema, type WishlistNameForm } from '@/components/wishlist/schema';
import { createStyles } from '@/hooks/use-theme';

type Props = {
  defaultName?: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

/** Name input with a character counter and Cancel / submit actions. Used to create and rename wishlists. */
export function WishlistNameFields({ defaultName = '', submitLabel, onSubmit, onCancel }: Props) {
  const styles = useStyles();
  const { control, handleSubmit } = useForm<WishlistNameForm>({
    resolver: zodResolver(wishlistNameSchema),
    defaultValues: { name: defaultName },
    mode: 'onTouched',
  });
  const name = useWatch({ control, name: 'name' });
  const submit = handleSubmit((values) => onSubmit(values.name));

  return (
    <View style={styles.wrap}>
      <View>
        <TextField
          control={control}
          name="name"
          label="Name"
          maxLength={WISHLIST_NAME_MAX}
          autoFocus
          autoCapitalize="sentences"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <Text style={styles.counter}>
          {name.length}/{WISHLIST_NAME_MAX} characters
        </Text>
      </View>

      <View style={styles.actions}>
        <TextLink label="Cancel" onPress={onCancel} size={17} />
        <Button label={submitLabel} tone="dark" onPress={submit} disabled={name.trim().length === 0} style={styles.submit} />
      </View>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  wrap: {
    gap: 24,
  },
  counter: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  submit: {
    minWidth: 130,
  },
}));
