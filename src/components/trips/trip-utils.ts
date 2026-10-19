import { getListing, type Listing } from '@/data/listings';
import type { PaymentMethod, Trip } from '@/hooks/use-booking';
import { addDays, nightsBetween, todayKey } from '@/lib/dates';

export const VAT_RATE = 0.075;

/** Stable, receipt-style code from the trip id: "HM" + 8 characters. */
export function confirmationCode(tripId: string) {
  let hash = 2166136261;
  for (const char of tripId) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  const fromHash = (hash >>> 0).toString(36).toUpperCase();
  const fromId = tripId.replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase();
  return `HM${(fromHash + fromId).padEnd(8, 'X').slice(0, 8)}`;
}

/** Full refund up to 7 days before check-in, half after that. */
export function refundFor(trip: Trip) {
  const full = trip.checkIn >= addDays(todayKey(), 7);
  return { full, amount: full ? trip.paid : Math.round(trip.paid * 0.5) };
}

export function nightsOf(trip: Trip) {
  return trip.checkOut ? Math.max(1, nightsBetween(trip.checkIn, trip.checkOut)) : 1;
}

export function statusLabel(trip: Trip) {
  if (trip.status === 'cancelled') return 'Cancelled';
  if (trip.completed) return 'Completed';
  return trip.status === 'confirmed' ? 'Confirmed' : 'Pending';
}

export function paymentLabel(methods: PaymentMethod[], selectedId: string | null) {
  const method = methods.find((m) => m.id === selectedId) ?? methods[0];
  if (!method) return 'your original payment method';
  return method.last4 ? `•••• ${method.last4}` : method.label;
}

export type TripWithListing = { trip: Trip; listing: Listing };

export function withListings(trips: Trip[]): TripWithListing[] {
  return trips
    .map((trip) => ({ trip, listing: getListing(trip.listingId) }))
    .filter((t): t is TripWithListing => Boolean(t.listing));
}
