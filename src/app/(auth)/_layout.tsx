import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

// The whole auth flow lives in one modal with its own stack, so steps push inside it
// and finishing (or closing) dismisses everything at once.
export const unstable_settings = { initialRouteName: 'login' };

export default function AuthLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
