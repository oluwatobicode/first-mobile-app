export type Category = 'homes' | 'experiences' | 'services';

export type Amenity = 'wifi' | 'pool' | 'generator' | 'kitchen' | 'parking' | 'ac' | 'workspace' | 'beach';

export const AMENITY_LABELS: Record<Amenity, string> = {
  wifi: 'Wifi',
  pool: 'Pool',
  generator: 'Power backup',
  kitchen: 'Kitchen',
  parking: 'Free parking',
  ac: 'Air conditioning',
  workspace: 'Workspace',
  beach: 'Beachfront',
};

export type Listing = {
  id: string;
  category: Category;
  section: string;
  title: string;
  location: string;
  details: string;
  price: number;
  priceNote: string;
  rating: number;
  reviews: number;
  guestFavorite: boolean;
  rareFind: boolean;
  host: { name: string; years: number; superhost: boolean };
  images: string[];
  coords: { latitude: number; longitude: number };
  amenities: Amenity[];
};

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&q=80`;

export const CATEGORIES: { key: Category; label: string; emoji: string; isNew?: boolean }[] = [
  { key: 'homes', label: 'Homes', emoji: '🏡' },
  { key: 'experiences', label: 'Experiences', emoji: '🎈', isNew: true },
  { key: 'services', label: 'Services', emoji: '🛎️', isNew: true },
];

export const LISTINGS: Listing[] = [
  {
    id: 'lekki-loft',
    category: 'homes',
    section: 'Popular homes in Lagos',
    title: 'Apartment in Lekki Phase 1',
    location: 'Apartment in Lagos, Nigeria',
    details: '2 beds · 2 baths · Fast wifi',
    price: 92500,
    priceNote: 'night',
    rating: 4.97,
    reviews: 214,
    guestFavorite: true,
    rareFind: true,
    host: { name: 'Tolu', years: 6, superhost: true },
    images: [img('1505691938895-1758d7feb511'), img('1522708323590-d24dbb6b0267'), img('1484154218962-a197022b5858')],
    coords: { latitude: 6.4478, longitude: 3.4723 },
    amenities: ['wifi', 'generator', 'kitchen', 'ac', 'workspace'],
  },
  {
    id: 'ikoyi-games',
    category: 'homes',
    section: 'Popular homes in Lagos',
    title: 'Place to stay in Ikoyi',
    location: 'Home in Lagos, Nigeria',
    details: '3 beds · Pool table · Generator',
    price: 61000,
    priceNote: 'night',
    rating: 4.8,
    reviews: 98,
    guestFavorite: false,
    rareFind: false,
    host: { name: 'Chidi', years: 3, superhost: false },
    images: [img('1502672260266-1c1ef2d93688'), img('1493809842364-78817add7ffb'), img('1554995207-c18c203602cb')],
    coords: { latitude: 6.4541, longitude: 3.4347 },
    amenities: ['wifi', 'generator', 'parking', 'ac'],
  },
  {
    id: 'vi-studio',
    category: 'homes',
    section: 'Popular homes in Lagos',
    title: 'Studio in Victoria Island',
    location: 'Room in Lagos, Nigeria',
    details: '1 queen bed · Shared bathroom',
    price: 48000,
    priceNote: 'night',
    rating: 4.91,
    reviews: 301,
    guestFavorite: true,
    rareFind: false,
    host: { name: 'Amaka', years: 7, superhost: true },
    images: [img('1560448204-e02f11c3d0e2'), img('1540518614846-7eded433c457'), img('1560185007-cde436f6a4d0')],
    coords: { latitude: 6.4281, longitude: 3.4219 },
    amenities: ['wifi', 'ac', 'workspace'],
  },
  {
    id: 'maitama-villa',
    category: 'homes',
    section: 'Available next month in Abuja',
    title: 'Villa in Maitama',
    location: 'Villa in Abuja, Nigeria',
    details: '4 beds · Private pool · Garden',
    price: 190500,
    priceNote: 'night',
    rating: 5.0,
    reviews: 57,
    guestFavorite: true,
    rareFind: true,
    host: { name: 'Fatima', years: 4, superhost: true },
    images: [img('1613490493576-7fde63acd811'), img('1600596542815-ffad4c1539a9'), img('1600607687939-ce8a6c25118c')],
    coords: { latitude: 9.082, longitude: 7.4951 },
    amenities: ['wifi', 'pool', 'generator', 'kitchen', 'parking', 'ac'],
  },
  {
    id: 'wuse-flat',
    category: 'homes',
    section: 'Available next month in Abuja',
    title: 'Apartment in Wuse 2',
    location: 'Apartment in Abuja, Nigeria',
    details: '2 beds · Balcony · Gym access',
    price: 56000,
    priceNote: 'night',
    rating: 4.99,
    reviews: 143,
    guestFavorite: true,
    rareFind: false,
    host: { name: 'Ibrahim', years: 5, superhost: true },
    images: [img('1586023492125-27b2c045efd7'), img('1600210492486-724fe5c67fb0'), img('1556020685-ae41abfc9365')],
    coords: { latitude: 9.0765, longitude: 7.4704 },
    amenities: ['wifi', 'generator', 'kitchen', 'ac', 'workspace'],
  },
  {
    id: 'asokoro-home',
    category: 'homes',
    section: 'Available next month in Abuja',
    title: 'Home in Asokoro',
    location: 'Home in Abuja, Nigeria',
    details: '3 beds · Quiet street · Parking',
    price: 79000,
    priceNote: 'night',
    rating: 4.86,
    reviews: 76,
    guestFavorite: false,
    rareFind: false,
    host: { name: 'Ngozi', years: 2, superhost: false },
    images: [img('1600585154340-be6161a56a0c'), img('1564013799919-ab600027ffc6'), img('1595526114035-0d45ed16cfbf')],
    coords: { latitude: 9.0437, longitude: 7.5244 },
    amenities: ['generator', 'kitchen', 'parking'],
  },
  {
    id: 'accra-beach',
    category: 'homes',
    section: 'Weekend getaways to Accra',
    title: 'Beach house in Labadi',
    location: 'Home in Accra, Ghana',
    details: '3 beds · Ocean view · Hammock',
    price: 122000,
    priceNote: 'night',
    rating: 4.94,
    reviews: 189,
    guestFavorite: true,
    rareFind: true,
    host: { name: 'Kwame', years: 8, superhost: true },
    images: [img('1499793983690-e29da59ef1c2'), img('1505693416388-ac5ce068fe85'), img('1566073771259-6a8506099945')],
    coords: { latitude: 5.56, longitude: -0.149 },
    amenities: ['wifi', 'kitchen', 'beach', 'parking'],
  },
  {
    id: 'osu-room',
    category: 'homes',
    section: 'Weekend getaways to Accra',
    title: 'Hotel room in Osu',
    location: 'Room in Accra, Ghana',
    details: '1 king bed · Breakfast included',
    price: 44500,
    priceNote: 'night',
    rating: 4.78,
    reviews: 412,
    guestFavorite: false,
    rareFind: false,
    host: { name: 'Efua', years: 9, superhost: true },
    images: [img('1631049307264-da0ec9d70304'), img('1618773928121-c32242e63f39'), img('1512917774080-9991f1c4c750')],
    coords: { latitude: 5.556, longitude: -0.182 },
    amenities: ['wifi', 'ac'],
  },
  {
    id: 'jollof-class',
    category: 'experiences',
    section: 'Popular experiences in Lagos',
    title: 'Cook party jollof with a pro chef',
    location: 'Cooking class in Lagos, Nigeria',
    details: '3 hours · Up to 8 guests',
    price: 35000,
    priceNote: 'per guest',
    rating: 4.98,
    reviews: 532,
    guestFavorite: true,
    rareFind: true,
    host: { name: 'Mama Bisi', years: 5, superhost: true },
    images: [img('1556910103-1c02745aae4d'), img('1504674900247-0877df9cc836'), img('1559339352-11d035aa65de')],
    coords: { latitude: 6.5095, longitude: 3.3711 },
    amenities: ['kitchen', 'ac'],
  },
  {
    id: 'boat-tour',
    category: 'experiences',
    section: 'Popular experiences in Lagos',
    title: 'Sunset boat ride to Tarkwa Bay',
    location: 'Boat tour in Lagos, Nigeria',
    details: '4 hours · Drinks included',
    price: 48000,
    priceNote: 'per guest',
    rating: 4.9,
    reviews: 221,
    guestFavorite: false,
    rareFind: false,
    host: { name: 'Segun', years: 3, superhost: false },
    images: [img('1544551763-46a013bb70d5'), img('1507525428034-b723cf961d3e'), img('1519046904884-53103b34b206')],
    coords: { latitude: 6.45, longitude: 3.392 },
    amenities: ['beach'],
  },
  {
    id: 'afrobeats-night',
    category: 'experiences',
    section: 'Popular experiences in Lagos',
    title: 'Afrobeats live music night',
    location: 'Nightlife in Lagos, Nigeria',
    details: '5 hours · Ages 18+',
    price: 25000,
    priceNote: 'per guest',
    rating: 4.85,
    reviews: 167,
    guestFavorite: true,
    rareFind: false,
    host: { name: 'DJ Kemi', years: 2, superhost: false },
    images: [img('1493225457124-a3eb161ffa5f'), img('1511379938547-c1f69419868d'), img('1527529482837-4698179dc6ce')],
    coords: { latitude: 6.6018, longitude: 3.3515 },
    amenities: ['ac'],
  },
  {
    id: 'private-chef',
    category: 'services',
    section: 'Services in your stay',
    title: 'Private chef for a dinner party',
    location: 'Chef in Lagos, Nigeria',
    details: 'Up to 12 guests · Groceries included',
    price: 120000,
    priceNote: 'per event',
    rating: 4.96,
    reviews: 88,
    guestFavorite: true,
    rareFind: true,
    host: { name: 'Chef Dayo', years: 4, superhost: true },
    images: [img('1414235077428-338989a2e8c0'), img('1517248135467-4c7edcad34c4'), img('1559339352-11d035aa65de')],
    coords: { latitude: 6.44, longitude: 3.5 },
    amenities: ['kitchen'],
  },
  {
    id: 'photoshoot',
    category: 'services',
    section: 'Services in your stay',
    title: 'Lifestyle photoshoot around Lagos',
    location: 'Photographer in Lagos, Nigeria',
    details: '2 hours · 40 edited photos',
    price: 60000,
    priceNote: 'per session',
    rating: 4.93,
    reviews: 129,
    guestFavorite: false,
    rareFind: false,
    host: { name: 'Zainab', years: 6, superhost: true },
    images: [img('1542038784456-1ea8e935640e'), img('1522337360788-8b13dee7a37e'), img('1527529482837-4698179dc6ce')],
    coords: { latitude: 6.455, longitude: 3.394 },
    amenities: [],
  },
  {
    id: 'spa-day',
    category: 'services',
    section: 'Wellness at home',
    title: 'In-home massage and spa day',
    location: 'Spa in Abuja, Nigeria',
    details: '90 minutes · All oils included',
    price: 45000,
    priceNote: 'per guest',
    rating: 4.88,
    reviews: 74,
    guestFavorite: true,
    rareFind: false,
    host: { name: 'Halima', years: 3, superhost: false },
    images: [img('1540555700478-4be289fbecef'), img('1576013551627-0cc20b96c2a7'), img('1534438327276-14e5300c3a48')],
    coords: { latitude: 9.03, longitude: 7.49 },
    amenities: ['ac', 'parking'],
  },
];

export function getListing(id: string) {
  return LISTINGS.find((listing) => listing.id === id);
}

export function sectionsFor(category: Category) {
  const sections = new Map<string, Listing[]>();
  for (const listing of LISTINGS.filter((l) => l.category === category)) {
    sections.set(listing.section, [...(sections.get(listing.section) ?? []), listing]);
  }
  return [...sections.entries()].map(([title, data]) => ({ title, data }));
}

export function formatPrice(amount: number) {
  return `₦${Math.round(amount).toLocaleString('en-US')}`;
}

/** What the explore cards show: homes are quoted for a 2-night stay. */
export function cardPriceLabel(listing: Listing) {
  return listing.category === 'homes'
    ? `${formatPrice(listing.price * 2)} for 2 nights`
    : `${formatPrice(listing.price)} ${listing.priceNote}`;
}

/** "Apartment in Lagos, Nigeria" → { kind: 'Apartment', place: 'Lagos, Nigeria', city: 'Lagos' } */
export function placeOf(listing: Listing) {
  const [kind, place = ''] = listing.location.split(' in ');
  return { kind, place, city: place.split(',')[0] };
}

export const DESTINATIONS = [
  { icon: 'nearby', tint: '#EAF1FB', color: '#2E6BC6', title: 'Nearby', subtitle: 'Find what’s around you' },
  { icon: 'beach', tint: '#FDF6EA', color: '#B7882F', title: 'Lekki, Lagos', subtitle: 'Popular beach destination' },
  { icon: 'city', tint: '#FDF6EA', color: '#B7882F', title: 'Abuja, FCT', subtitle: 'For sights like Aso Rock and Millennium Park' },
  { icon: 'dining', tint: '#FDF6EA', color: '#B7882F', title: 'Accra, Ghana', subtitle: 'For its top-notch dining' },
  { icon: 'nature', tint: '#FDF6EA', color: '#B7882F', title: 'Obudu, Cross River', subtitle: 'Cool mountain getaway' },
] as const;
