import { Stack } from 'expo-router';

import { Brand } from '@/constants/theme';

// The whole auth flow lives in one modal with its own stack, so steps push inside it
// and finishing (or closing) dismisses everything at once.
export const unstable_settings = { initialRouteName: 'login' };

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Brand.background } }} />;
}
