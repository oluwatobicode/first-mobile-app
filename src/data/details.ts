import { placeOf, type Listing } from '@/data/listings';

// Extra listing detail (reviews, rooms, rules, host bio...) generated from the listing id,
// so every listing looks complete without hand-writing data for each one. Same id → same output.

function seeded(id: string) {
  let hash = 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return () => {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return ((hash ^= hash >>> 16) >>> 0) / 4294967296;
  };
}

const pick = <T,>(random: () => number, items: readonly T[]) => items[Math.floor(random() * items.length)];

// ---------- Categories for the Explore strip ----------

export type CategoryTag = 'trending' | 'beachfront' | 'pools' | 'mansions' | 'city' | 'design' | 'tiny' | 'countryside';

export const CATEGORY_TAGS: { key: CategoryTag; label: string; emoji: string }[] = [
  { key: 'trending', label: 'Trending', emoji: '🔥' },
  { key: 'beachfront', label: 'Beachfront', emoji: '🏖️' },
  { key: 'pools', label: 'Amazing pools', emoji: '🏊' },
  { key: 'mansions', label: 'Mansions', emoji: '🏛️' },
  { key: 'city', label: 'Iconic cities', emoji: '🌆' },
  { key: 'design', label: 'Design', emoji: '🎨' },
  { key: 'tiny', label: 'Tiny homes', emoji: '🛖' },
  { key: 'countryside', label: 'Countryside', emoji: '🌳' },
];

const TAGS_BY_ID: Record<string, CategoryTag[]> = {
  'lekki-loft': ['trending', 'city', 'design'],
  'ikoyi-games': ['city', 'trending'],
  'vi-studio': ['city', 'tiny'],
  'maitama-villa': ['mansions', 'pools', 'trending'],
  'wuse-flat': ['city', 'design'],
  'asokoro-home': ['countryside', 'mansions'],
  'accra-beach': ['beachfront', 'trending'],
  'osu-room': ['city', 'tiny'],
};

export function tagsFor(listing: Listing): CategoryTag[] {
  return TAGS_BY_ID[listing.id] ?? [];
}

// ---------- Reviews ----------

export const REVIEW_CATEGORIES = ['Cleanliness', 'Accuracy', 'Check-in', 'Communication', 'Location', 'Value'] as const;

export type Review = { id: string; name: string; initial: string; date: string; rating: number; text: string; yearsOnApp: number };

const REVIEWERS = ['Tunde', 'Chioma', 'Kofi', 'Aisha', 'Emeka', 'Zara', 'Daniel', 'Funmi', 'Yaw', 'Halima', 'Seun', 'Ama', 'Ifeoma', 'Musa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const PRAISE = [
  'Spotless place and {host} was super responsive. The power never went off once!',
  'Exactly like the photos. Great location, easy check-in, would book again in a heartbeat.',
  '{host} gave us amazing food recommendations. The bed was so comfortable.',
  'Perfect for a work trip – fast wifi, quiet, and the AC works like magic.',
  'We loved every minute. The neighbourhood is lively but the apartment is calm.',
  'Beautiful space, thoughtful touches everywhere. Felt like home.',
  'Check-in was smooth and {host} checked on us without being intrusive. 10/10.',
  'Great value for the area. Minor noise at night but nothing serious.',
];

export function reviewsFor(listing: Listing, count = 8): Review[] {
  const random = seeded(listing.id + 'reviews');
  return Array.from({ length: count }, (_, i) => {
    const name = pick(random, REVIEWERS);
    return {
      id: `${listing.id}-review-${i}`,
      name,
      initial: name[0],
      date: `${pick(random, MONTHS)} ${2025 + (random() < 0.6 ? 1 : 0)}`,
      rating: random() < 0.85 ? 5 : 4,
      text: pick(random, PRAISE).replace('{host}', listing.host.name),
      yearsOnApp: 1 + Math.floor(random() * 8),
    };
  });
}

/** Category scores that average out close to the listing's overall rating. */
export function ratingBreakdown(listing: Listing) {
  const random = seeded(listing.id + 'breakdown');
  const scores = REVIEW_CATEGORIES.map((label) => ({
    label,
    score: Math.min(5, Math.max(4.3, listing.rating + (random() - 0.5) * 0.3)),
  }));
  // Share of reviews per star level, 5 → 1.
  const five = Math.min(0.97, 0.55 + (listing.rating - 4.5) * 0.8);
  const stars = [five, (1 - five) * 0.7, (1 - five) * 0.2, (1 - five) * 0.07, (1 - five) * 0.03];
  return { scores, stars };
}

// ---------- Rooms, rules, neighbourhood ----------

export type Bedroom = { name: string; beds: string };

export function bedroomsFor(listing: Listing): Bedroom[] {
  const count = Number(/(\d+)\s*beds?/.exec(listing.details)?.[1] ?? 1);
  const random = seeded(listing.id + 'rooms');
  return Array.from({ length: count }, (_, i) => ({
    name: i === 0 ? 'Bedroom 1' : random() < 0.25 && i === count - 1 ? 'Living room' : `Bedroom ${i + 1}`,
    beds: i === 0 ? (random() < 0.5 ? '1 king bed' : '1 queen bed') : random() < 0.5 ? '1 double bed' : '2 single beds',
  }));
}

export type HouseRules = { checkIn: string; checkOut: string; maxGuests: number; pets: boolean; smoking: boolean; parties: boolean; quietHours: string };

export function rulesFor(listing: Listing): HouseRules {
  const random = seeded(listing.id + 'rules');
  const beds = Number(/(\d+)\s*beds?/.exec(listing.details)?.[1] ?? 1);
  return {
    checkIn: random() < 0.5 ? '2:00 PM' : '3:00 PM',
    checkOut: random() < 0.6 ? '11:00 AM' : '12:00 PM',
    maxGuests: listing.category === 'homes' ? beds * 2 : 8,
    pets: random() < 0.3,
    smoking: false,
    parties: false,
    quietHours: '10:00 PM – 7:00 AM',
  };
}

export const SAFETY = ['Carbon monoxide alarm', 'Smoke alarm', 'Security camera at the gate', 'Fire extinguisher'];

const NEIGHBOURHOODS: Record<string, string> = {
  Lagos:
    'Lively, loud and full of life. You’re close to beach clubs, great suya spots and the best nightlife in West Africa. Traffic is real – plan around rush hour.',
  Abuja:
    'Calm, green and well planned. Wide roads, quick drives to Millennium Park and Jabi Lake, and plenty of good restaurants nearby.',
  Accra:
    'Warm, friendly and walkable. Osu’s Oxford Street, Labadi Beach and the Jamestown lighthouse are all a short ride away.',
};

export function neighbourhoodFor(listing: Listing) {
  const { city } = placeOf(listing);
  return NEIGHBOURHOODS[city] ?? 'A great neighbourhood with lots to explore nearby.';
}

// ---------- Host ----------

export type HostDetails = {
  responseRate: number;
  responseTime: string;
  languages: string[];
  about: string;
  joinedYear: number;
  reviews: number;
  verified: boolean;
  work: string;
};

const WORK = ['Architect', 'Chef', 'Product designer', 'Teacher', 'Photographer', 'Entrepreneur', 'Nurse', 'Musician'];
const LANGUAGES = [['English', 'Yoruba'], ['English', 'Igbo'], ['English', 'Hausa'], ['English', 'Twi'], ['English', 'French']];

export function hostDetailsFor(listing: Listing): HostDetails {
  const random = seeded(listing.id + 'host');
  return {
    responseRate: 95 + Math.floor(random() * 6),
    responseTime: random() < 0.7 ? 'within an hour' : 'within a few hours',
    languages: pick(random, LANGUAGES),
    about: `Hi, I’m ${listing.host.name}! I love meeting people from everywhere and sharing the best of my city. I’m always a message away if you need anything during your stay.`,
    joinedYear: new Date().getFullYear() - listing.host.years,
    reviews: listing.reviews + Math.floor(random() * 120),
    verified: true,
    work: pick(random, WORK),
  };
}

// ---------- Photo tour ----------

const ROOMS_FOR_HOMES = ['Living room', 'Bedroom', 'Kitchen', 'Bathroom', 'Exterior'];
const ROOMS_FOR_OTHERS = ['Highlights', 'What you’ll do', 'Where you’ll be'];

/** Groups the listing's photos into rooms for the photo tour. */
export function photoRoomsFor(listing: Listing) {
  const rooms = listing.category === 'homes' ? ROOMS_FOR_HOMES : ROOMS_FOR_OTHERS;
  return listing.images.map((image, i) => ({ room: rooms[i % rooms.length], images: [image] }));
}
