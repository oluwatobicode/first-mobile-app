import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';

import { Radio, ScreenHeader } from '@/components/ui';
import { COUNTRIES } from '@/data/countries';
import { useBooking } from '@/hooks/use-booking';
import { createStyles, useTheme } from '@/hooks/use-theme';

export default function CountryPicker() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { target = 'phone' } = useLocalSearchParams<{ target?: 'phone' | 'card' }>();
  const { pickerCountry, setPickerCountry } = useBooking();
  const selected = pickerCountry[target];

  return (
    <>
      <ScreenHeader title="Country/Region" leading="close" safeTop={false} />
      <FlatList
        style={styles.list}
        data={COUNTRIES}
        keyExtractor={(c) => c.name}
        initialScrollIndex={Math.max(0, COUNTRIES.findIndex((c) => c.name === selected.name) - 3)}
        getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}
            onPress={() => {
              setPickerCountry(target, item);
              router.back();
            }}>
            <Text style={styles.name}>
              {target === 'phone' ? `${item.name} (${item.dial})` : item.name}
            </Text>
            <Radio selected={item.name === selected.name} />
          </Pressable>
        )}
      />
    </>
  );
}

const ROW_HEIGHT = 76;

const useStyles = createStyles((c) => ({
  list: {
    flex: 1,
    backgroundColor: c.background,
  },
  row: {
    height: ROW_HEIGHT,
    marginHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  name: {
    fontSize: 17,
    color: c.text,
  },
}));
