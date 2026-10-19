import { getListing, type Listing } from '@/data/listings';
import { addDays, todayKey } from '@/lib/dates';

// Demo data for hosting mode. Everything here is static and frontend-only.

/** The homes the signed-in person "hosts" in the demo. */
export const HOST_LISTING_IDS = ['lekki-loft', 'maitama-villa', 'accra-beach'];

export function hostListings(): Listing[] {
  return HOST_LISTING_IDS.map((id) => getListing(id)).filter((l): l is Listing => Boolean(l));
}

export type ReservationStatus = 'checkingOut' | 'hosting' | 'arriving' | 'upcoming';

export type Reservation = {
  id: string;
  guest: string;
  from: string;
  guests: number;
  listingId: string;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
};

/** Built relative to today so the "Today" tab always looks current. */
export function hostReservations(): Reservation[] {
  const today = todayKey();
  const [a, b, c] = HOST_LISTING_IDS;
  return [
    { id: 'r1', guest: 'Kwame Mensah', from: 'Accra, Ghana', guests: 2, listingId: a, checkIn: addDays(today, -2), checkOut: addDays(today, 3), status: 'hosting' },
    { id: 'r2', guest: 'Amara Eze', from: 'Enugu, Nigeria', guests: 3, listingId: b, checkIn: today, checkOut: addDays(today, 4), status: 'arriving' },
    { id: 'r3', guest: 'Fatima Bello', from: 'Kano, Nigeria', guests: 1, listingId: c, checkIn: addDays(today, 1), checkOut: addDays(today, 2), status: 'arriving' },
    { id: 'r4', guest: 'Jide Adeyemi', from: 'Ibadan, Nigeria', guests: 4, listingId: a, checkIn: addDays(today, 6), checkOut: addDays(today, 9), status: 'upcoming' },
    { id: 'r5', guest: 'Efua Asante', from: 'Kumasi, Ghana', guests: 2, listingId: c, checkIn: addDays(today, 11), checkOut: addDays(today, 15), status: 'upcoming' },
    { id: 'r6', guest: 'Tunde Bakare', from: 'London, UK', guests: 2, listingId: b, checkIn: addDays(today, 19), checkOut: addDays(today, 24), status: 'upcoming' },
  ];
}

/** Nightly earnings for the last six months, in naira. The last one is this month. */
export const MONTHLY_EARNINGS = [780_000, 920_500, 655_000, 1_102_000, 990_000, 1_245_000];

export const HOST_TIPS = [
  { id: 't1', emoji: '📸', title: 'Refresh your photos', body: 'Listings with bright, recent photos get up to 20% more bookings.' },
  { id: 't2', emoji: '🔌', title: 'Mention power backup', body: 'Guests in Lagos and Abuja filter by generator and inverter more than any other amenity.' },
  { id: 't3', emoji: '🎉', title: 'Detty December is coming', body: 'Demand peaks from mid-December. Set your holiday prices early.' },
  { id: 't4', emoji: '⚡', title: 'Turn on Instant Book', body: 'Guests can book without waiting, and you rank higher in search.' },
];

export type GuestThread = {
  id: string;
  guest: string;
  listingId: string;
  preview: string;
  time: string;
  unread: boolean;
  status: string;
};

export const GUEST_THREADS: GuestThread[] = [
  { id: 'g1', guest: 'Amara Eze', listingId: 'maitama-villa', preview: 'Hi! We land at Nnamdi Azikiwe around 2pm — is early check-in possible?', time: '9:41', unread: true, status: 'Arriving today' },
  { id: 'g2', guest: 'Kwame Mensah', listingId: 'lekki-loft', preview: 'The generator kicked in perfectly last night, thank you 🙏🏾', time: 'Yesterday', unread: true, status: 'Currently hosting' },
  { id: 'g3', guest: 'Fatima Bello', listingId: 'accra-beach', preview: 'Is there parking for one car?', time: 'Mon', unread: false, status: 'Arriving tomorrow' },
  { id: 'g4', guest: 'Jide Adeyemi', listingId: 'lekki-loft', preview: 'Booking confirmed. See you soon!', time: 'Sun', unread: false, status: 'Upcoming' },
  { id: 'g5', guest: 'Efua Asante', listingId: 'accra-beach', preview: 'Can you recommend a good spot for waakye nearby?', time: 'Sat', unread: false, status: 'Upcoming' },
  { id: 'g6', guest: 'Ngozi Okafor', listingId: 'maitama-villa', preview: 'Thanks for a lovely stay! Left you a review.', time: 'Oct 2', unread: false, status: 'Past guest' },
];
