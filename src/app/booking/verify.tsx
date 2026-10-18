import { router } from 'expo-router';

import { VerifyCodeScreen } from '@/components/verify-code-screen';
import { useBooking } from '@/hooks/use-booking';

export default function BookingVerifyScreen() {
  const { phone, setPhone } = useBooking();

  return (
    <VerifyCodeScreen
      destination={phone ? `${phone.country.dial} ${phone.number}` : 'your phone'}
      onVerified={() => {
        if (phone) setPhone({ ...phone, verified: true });
        // Close this modal and the phone number screen behind it.
        router.dismiss(2);
      }}
    />
  );
}
