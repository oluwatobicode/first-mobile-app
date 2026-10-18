import { router } from 'expo-router';

import { VerifyCodeScreen } from '@/components/verify-code-screen';
import { exitAuth, useAuth } from '@/hooks/use-auth';
import { useBooking } from '@/hooks/use-booking';

export default function AuthVerifyScreen() {
  const { pending, findByPhone, signIn } = useAuth();
  const { setPhone } = useBooking();

  if (pending?.method !== 'phone') return null;
  const { country, number } = pending;

  return (
    <VerifyCodeScreen
      leading="back"
      destination={`${country.dial} ${number}`}
      onVerified={() => {
        // A confirmed number also counts as the phone needed for bookings.
        setPhone({ country, number, verified: true });
        const account = findByPhone(country, number);
        if (account) {
          signIn(account);
          exitAuth();
        } else {
          router.push('/finish-signup');
        }
      }}
    />
  );
}
