import { router } from 'expo-router';

import { getListing } from '@/data/listings';
import { useToast } from '@/hooks/use-toast';

/** First photo of each listing, skipping ids that no longer exist. */
export function coverImages(ids: string[], limit = 3) {
  return ids
    .map((id) => getListing(id)?.images[0])
    .filter((image) => image !== undefined)
    .slice(0, limit);
}

export function savedCount(count: number) {
  return `${count} saved`;
}

export function openSaveSheet(listingId: string, toastOffset = 0) {
  router.push({ pathname: '/save-to-wishlist', params: { id: listingId, offset: String(toastOffset) } });
}

/** "Saved to {list}" toast with the listing photo and a "Change" action that reopens the picker. */
export function useSavedToast() {
  const toast = useToast();
  return (listingId: string, listName: string, offset = 0) =>
    toast.show({
      message: `Saved to ${listName}`,
      image: getListing(listingId)?.images[0],
      offset,
      action: { label: 'Change', onPress: () => openSaveSheet(listingId, offset) },
    });
}
