import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { NIGERIA, type Country } from '@/data/countries';
import { getListing, type Listing } from '@/data/listings';
import { addDays, nightsBetween, todayKey } from '@/lib/dates';
import { HOST_REPLY_SECONDS } from '@/lib/notifications';
import { usePersistedState } from '@/hooks/use-persisted-state';

export type Guests = { adults: number; children: number; infants: number; pets: number };
export type PayMode = 'full' | 'part';

export type PaymentMethod = {
  id: string;
  kind: 'card' | 'bank' | 'ussd';
  brand?: 'visa' | 'mastercard' | 'verve' | 'amex';
  last4?: string;
  label: string;
};

export type Draft = {
  listingId: string;
  checkIn: string | null;
  checkOut: string | null;
  guests: Guests;
  payMode: PayMode;
};

export type Trip = {
  id: string;
  listingId: string;
  status: 'pending' | 'confirmed';
  createdAt: number;
  checkIn: string;
  checkOut: string | null;
  total: number;
  paid: number;
  guestCount: number;
};

export type Phone = { country: Country; number: string; verified: boolean };

type PickerTarget = 'phone' | 'card';

const ONE_ADULT: Guests = { adults: 1, children: 0, infants: 0, pets: 0 };
const VAT = 0.075;

function emptyDraft(listingId: string): Draft {
  return { listingId, checkIn: null, checkOut: null, guests: ONE_ADULT, payMode: 'full' };
}

type BookingContextValue = {
  draftFor: (listingId: string) => Draft;
  updateDraft: (listingId: string, patch: Partial<Omit<Draft, 'listingId'>>) => void;

  paymentMethods: PaymentMethod[];
  selectedPaymentId: string | null;
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  selectPayment: (id: string) => void;

  phone: Phone | null;
  setPhone: (phone: Phone | null) => void;

  pickerCountry: Record<PickerTarget, Country>;
  setPickerCountry: (target: PickerTarget, country: Country) => void;

  trips: Trip[];
  addTrip: (trip: Omit<Trip, 'id' | 'status' | 'createdAt'>) => Trip;

  remindersOn: boolean;
  setRemindersOn: (on: boolean) => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [paymentMethods, setPaymentMethods] = usePersistedState<PaymentMethod[]>('payment-methods', []);
  const [selectedPaymentId, setSelectedPaymentId] = usePersistedState<string | null>('selected-payment', null);
  const [phone, setPhone] = usePersistedState<Phone | null>('phone', null);
  const [pickerCountry, setPickerCountryState] = useState<Record<PickerTarget, Country>>({
    phone: NIGERIA,
    card: NIGERIA,
  });
  const [trips, setTrips, tripsHydrated] = usePersistedState<Trip[]>('trips', []);
  const [remindersOn, setRemindersOn] = usePersistedState('reminders-on', true);

  // Pretend the host replies HOST_REPLY_SECONDS after a request, at the same moment the
  // "accepted" notification fires. Also catches up on requests made before the app restarted.
  useEffect(() => {
    if (!tripsHydrated) return;
    const timers = trips
      .filter((t) => t.status === 'pending')
      .map((t) =>
        setTimeout(
          () => setTrips((current) => current.map((c) => (c.id === t.id ? { ...c, status: 'confirmed' } : c))),
          Math.max(0, t.createdAt + HOST_REPLY_SECONDS * 1000 - Date.now())
        )
      );
    return () => timers.forEach(clearTimeout);
  }, [trips, tripsHydrated, setTrips]);

  const value: BookingContextValue = {
    // Only one booking is in progress at a time; opening another listing starts fresh.
    draftFor: (listingId) => (draft?.listingId === listingId ? draft : emptyDraft(listingId)),
    updateDraft: (listingId, patch) =>
      setDraft((current) => ({
        ...(current?.listingId === listingId ? current : emptyDraft(listingId)),
        ...patch,
      })),

    paymentMethods,
    selectedPaymentId,
    addPaymentMethod: (method) => {
      const id = `${method.kind}-${Date.now()}`;
      setPaymentMethods((current) => [...current, { ...method, id }]);
      setSelectedPaymentId(id);
    },
    selectPayment: setSelectedPaymentId,

    phone,
    setPhone,

    pickerCountry,
    setPickerCountry: (target, country) => setPickerCountryState((current) => ({ ...current, [target]: country })),

    trips,
    addTrip: (trip) => {
      const listing = getListing(trip.listingId);
      const instant = listing ? isInstantBook(listing) : true;
      const saved: Trip = { ...trip, id: `trip-${Date.now()}`, status: instant ? 'confirmed' : 'pending', createdAt: Date.now() };
      setTrips((current) => [saved, ...current]);
      return saved;
    },

    remindersOn,
    setRemindersOn,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used inside BookingProvider');
  return context;
}

export function guestCount(guests: Guests) {
  return guests.adults + guests.children;
}

export function guestLabel(guests: Guests) {
  const count = guestCount(guests);
  const parts = [`${count} guest${count === 1 ? '' : 's'}`];
  if (guests.infants) parts.push(`${guests.infants} infant${guests.infants === 1 ? '' : 's'}`);
  if (guests.pets) parts.push(`${guests.pets} pet${guests.pets === 1 ? '' : 's'}`);
  return parts.join(', ');
}

/** Guest favorites can be booked instantly; everything else needs the host to accept. */
export function isInstantBook(listing: Listing) {
  return listing.guestFavorite;
}

/** With "pay part now", a bit over half is charged today. */
export function splitPayment(total: number) {
  const now = Math.round(total * 0.55);
  return { now, later: total - now };
}

/** Homes are booked by the night; experiences and services are one day, priced per guest. */
export function isNightly(listing: Listing) {
  return listing.category === 'homes';
}

export type Quote = {
  units: number;
  unitLabel: string;
  subtotal: number;
  taxes: number;
  total: number;
  dueNow: number;
  dueLater: number;
  dueLaterDate: string;
  freeCancelBefore: string;
  partialRefundBefore: string;
};

export function quoteFor(draft: Draft): Quote | null {
  const listing = getListing(draft.listingId);
  if (!listing || !draft.checkIn) return null;

  const nightly = isNightly(listing);
  if (nightly && !draft.checkOut) return null;

  const units = nightly ? nightsBetween(draft.checkIn, draft.checkOut!) : Math.max(1, guestCount(draft.guests));
  const unitLabel = nightly ? `${units} night${units === 1 ? '' : 's'}` : `${units} guest${units === 1 ? '' : 's'}`;
  const subtotal = listing.price * units;
  const taxes = Math.round(subtotal * VAT);
  const total = subtotal + taxes;
  const dueNow = draft.payMode === 'part' ? splitPayment(total).now : total;

  const twoWeeksBefore = addDays(draft.checkIn, -14);
  const dueLaterDate = twoWeeksBefore > todayKey() ? twoWeeksBefore : addDays(todayKey(), 1);

  return {
    units,
    unitLabel,
    subtotal,
    taxes,
    total,
    dueNow,
    dueLater: total - dueNow,
    dueLaterDate,
    freeCancelBefore: addDays(draft.checkIn, -7) > todayKey() ? addDays(draft.checkIn, -7) : todayKey(),
    partialRefundBefore: addDays(draft.checkIn, -1),
  };
}
