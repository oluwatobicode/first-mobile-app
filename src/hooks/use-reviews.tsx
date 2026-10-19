import { createContext, useContext, type ReactNode } from 'react';

import { REVIEW_CATEGORIES } from '@/data/details';
import { usePersistedState } from '@/hooks/use-persisted-state';

export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];

/** A review the guest wrote after a stay. Shown first on the listing's reviews. */
export type GuestReview = {
  id: string;
  tripId: string;
  listingId: string;
  name: string;
  rating: number;
  categories: Partial<Record<ReviewCategory, number>>;
  text: string;
  createdAt: number;
};

type ReviewsContextValue = {
  reviews: GuestReview[];
  addReview: (review: Omit<GuestReview, 'id' | 'createdAt'>) => void;
  reviewsForListing: (listingId: string) => GuestReview[];
  reviewForTrip: (tripId: string) => GuestReview | undefined;
};

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = usePersistedState<GuestReview[]>('guest-reviews', []);

  const value: ReviewsContextValue = {
    reviews,
    addReview: (review) =>
      setReviews((current) => [{ ...review, id: `review-${Date.now()}`, createdAt: Date.now() }, ...current.filter((r) => r.tripId !== review.tripId)]),
    reviewsForListing: (listingId) => reviews.filter((r) => r.listingId === listingId),
    reviewForTrip: (tripId) => reviews.find((r) => r.tripId === tripId),
  };

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export function useReviews() {
  const context = useContext(ReviewsContext);
  if (!context) throw new Error('useReviews must be used inside ReviewsProvider');
  return context;
}
