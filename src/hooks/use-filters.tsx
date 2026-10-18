import { createContext, useContext, useState, type ReactNode } from 'react';

import { LISTINGS, placeOf, type Amenity, type Category, type Listing } from '@/data/listings';

export const PRICE_MIN = 0;
export const PRICE_MAX = 400000;

export type Filters = {
  /** City or region name from Search ("Lagos", "Abuja", "Accra"...). */
  where: string | null;
  guests: number;
  minPrice: number;
  maxPrice: number;
  amenities: Amenity[];
  guestFavoriteOnly: boolean;
};

export const NO_FILTERS: Filters = {
  where: null,
  guests: 0,
  minPrice: PRICE_MIN,
  maxPrice: PRICE_MAX,
  amenities: [],
  guestFavoriteOnly: false,
};

type FiltersContextValue = {
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  clearFilters: () => void;
  /** How many filters are on, for the "Filters (2)" badge. */
  activeCount: number;
  /** Listings in a category that pass every filter. */
  apply: (category?: Category) => Listing[];
};

const FiltersContext = createContext<FiltersContextValue | null>(null);

/** Search terms like "Lekki, Lagos" or "Abuja, FCT" match any listing whose place mentions one of the words. */
function matchesWhere(listing: Listing, where: string) {
  const place = `${placeOf(listing).place} ${listing.title}`.toLowerCase();
  return where
    .toLowerCase()
    .split(/[,\s]+/)
    .filter((word) => word.length > 2)
    .some((word) => place.includes(word));
}

function maxGuests(listing: Listing) {
  const beds = /(\d+)\s*(?:beds?|queen|king)/i.exec(listing.details);
  const upTo = /up to (\d+)/i.exec(listing.details);
  if (upTo) return Number(upTo[1]);
  return beds ? Number(beds[1]) * 2 : 2;
}

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<Filters>(NO_FILTERS);

  const activeCount =
    (filters.where ? 1 : 0) +
    (filters.guests ? 1 : 0) +
    (filters.minPrice > PRICE_MIN || filters.maxPrice < PRICE_MAX ? 1 : 0) +
    filters.amenities.length +
    (filters.guestFavoriteOnly ? 1 : 0);

  const value: FiltersContextValue = {
    filters,
    setFilters: (patch) => setFiltersState((current) => ({ ...current, ...patch })),
    clearFilters: () => setFiltersState(NO_FILTERS),
    activeCount,
    apply: (category) =>
      LISTINGS.filter((l) => {
        if (category && l.category !== category) return false;
        if (filters.where && !matchesWhere(l, filters.where)) return false;
        if (filters.guests && maxGuests(l) < filters.guests) return false;
        if (l.price < filters.minPrice || (filters.maxPrice < PRICE_MAX && l.price > filters.maxPrice)) return false;
        if (filters.amenities.some((a) => !l.amenities.includes(a))) return false;
        if (filters.guestFavoriteOnly && !l.guestFavorite) return false;
        return true;
      }),
  };

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const context = useContext(FiltersContext);
  if (!context) throw new Error('useFilters must be used inside FiltersProvider');
  return context;
}
