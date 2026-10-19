import { BedIcon } from '@solar-icons/react-native/linear/bed';
import { BoltIcon } from '@solar-icons/react-native/linear/bolt';
import { BookIcon } from '@solar-icons/react-native/linear/book';
import { CalendarMarkIcon } from '@solar-icons/react-native/linear/calendar-mark';
import { CarIcon } from '@solar-icons/react-native/linear/car';
import { ChefHatIcon } from '@solar-icons/react-native/linear/chef-hat';
import { ConditionerIcon } from '@solar-icons/react-native/linear/conditioner';
import { FridgeIcon } from '@solar-icons/react-native/linear/fridge';
import { HangerIcon } from '@solar-icons/react-native/linear/hanger';
import { KeyIcon } from '@solar-icons/react-native/linear/key';
import { LaptopIcon } from '@solar-icons/react-native/linear/laptop';
import { PlateIcon } from '@solar-icons/react-native/linear/plate';
import { SleepingIcon } from '@solar-icons/react-native/linear/sleeping';
import { SwimmingIcon } from '@solar-icons/react-native/linear/swimming';
import { TShirtIcon } from '@solar-icons/react-native/linear/t-shirt';
import { TeaCupIcon } from '@solar-icons/react-native/linear/tea-cup';
import { TvIcon } from '@solar-icons/react-native/linear/tv';
import { WashingMachineIcon } from '@solar-icons/react-native/linear/washing-machine';
import { WaterIcon } from '@solar-icons/react-native/linear/water';
import { WaterSunIcon } from '@solar-icons/react-native/linear/water-sun';
import { WaterdropIcon } from '@solar-icons/react-native/linear/waterdrop';
import { WiFiIcon } from '@solar-icons/react-native/linear/wi-fi';
import { WindIcon } from '@solar-icons/react-native/linear/wind';

import type { SolarIcon } from '@/components/icons';
import { AMENITY_LABELS, type Amenity, type Listing } from '@/data/listings';

export type AmenityItem = {
  label: string;
  Icon: SolarIcon;
  /** Tied to a listing amenity; items without one come with every home. */
  key?: Amenity;
};

export type AmenityGroup = { title: string; items: AmenityItem[] };

export const AMENITY_GROUPS: AmenityGroup[] = [
  {
    title: 'Bathroom',
    items: [
      { label: 'Hot water', Icon: WaterIcon },
      { label: 'Shampoo and body soap', Icon: WaterdropIcon },
      { label: 'Hair dryer', Icon: WindIcon },
    ],
  },
  {
    title: 'Bedroom and laundry',
    items: [
      { label: 'Bed linens', Icon: BedIcon },
      { label: 'Extra pillows and blankets', Icon: SleepingIcon },
      { label: 'Hangers', Icon: HangerIcon },
      { label: 'Iron', Icon: TShirtIcon },
      { label: 'Washer', Icon: WashingMachineIcon },
    ],
  },
  {
    title: 'Entertainment',
    items: [
      { label: 'TV with Netflix and DStv', Icon: TvIcon },
      { label: 'Books and reading material', Icon: BookIcon },
    ],
  },
  {
    title: 'Heating and cooling',
    items: [
      { label: AMENITY_LABELS.ac, Icon: ConditionerIcon, key: 'ac' },
      { label: 'Ceiling fan', Icon: WindIcon },
    ],
  },
  {
    title: 'Internet and office',
    items: [
      { label: AMENITY_LABELS.wifi, Icon: WiFiIcon, key: 'wifi' },
      { label: 'Dedicated workspace', Icon: LaptopIcon, key: 'workspace' },
    ],
  },
  {
    title: 'Kitchen and dining',
    items: [
      { label: AMENITY_LABELS.kitchen, Icon: ChefHatIcon, key: 'kitchen' },
      { label: 'Refrigerator', Icon: FridgeIcon },
      { label: 'Dishes and silverware', Icon: PlateIcon },
      { label: 'Hot water kettle', Icon: TeaCupIcon },
    ],
  },
  {
    title: 'Location features',
    items: [{ label: AMENITY_LABELS.beach, Icon: WaterSunIcon, key: 'beach' }],
  },
  {
    title: 'Parking and facilities',
    items: [
      { label: 'Free parking on premises', Icon: CarIcon, key: 'parking' },
      { label: AMENITY_LABELS.pool, Icon: SwimmingIcon, key: 'pool' },
    ],
  },
  {
    title: 'Services',
    items: [
      { label: `${AMENITY_LABELS.generator} – 24/7 generator`, Icon: BoltIcon, key: 'generator' },
      { label: 'Self check-in', Icon: KeyIcon },
      { label: 'Long-term stays allowed', Icon: CalendarMarkIcon },
    ],
  },
];

const ALL_ITEMS = AMENITY_GROUPS.flatMap((g) => g.items);

export function hasAmenity(listing: Listing, item: AmenityItem) {
  return !item.key || listing.amenities.includes(item.key);
}

/** The listing's own amenities first (Airbnb leads with what's special), then the basics. */
export function highlightAmenities(listing: Listing, count = 6): AmenityItem[] {
  const own = listing.amenities.map(
    (key) => ALL_ITEMS.find((item) => item.key === key) ?? { label: AMENITY_LABELS[key], Icon: WiFiIcon, key }
  );
  const basics = ALL_ITEMS.filter((item) => !item.key);
  return [...own, ...basics].slice(0, count);
}

export function amenityCount(listing: Listing) {
  return ALL_ITEMS.filter((item) => hasAmenity(listing, item)).length;
}
