import { createContext, useContext, type ReactNode } from 'react';

import { usePersistedState } from '@/hooks/use-persisted-state';

export type Wishlist = { id: string; name: string; ids: string[]; createdAt: number };

const MAX_RECENT = 12;

type WishlistContextValue = {
  lists: Wishlist[];
  /** Every saved listing id, newest first, across all lists. */
  ids: string[];
  isSaved: (id: string) => boolean;
  /** The list a listing is saved in, if any. */
  listFor: (id: string) => Wishlist | undefined;
  /** The list new saves go to by default (the one used last). */
  lastList: Wishlist | undefined;
  createList: (name: string, firstId?: string) => Wishlist;
  saveTo: (id: string, listId: string) => void;
  remove: (id: string) => void;
  renameList: (listId: string, name: string) => void;
  deleteList: (listId: string) => void;
  /** Quick save/unsave: saves to the last-used list (creating "Favorites" if needed). */
  toggle: (id: string) => void;

  recentlyViewed: string[];
  markViewed: (id: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = usePersistedState<Wishlist[]>('wishlists', []);
  const [lastListId, setLastListId] = usePersistedState<string | null>('last-wishlist', null);
  const [recentlyViewed, setRecentlyViewed] = usePersistedState<string[]>('recently-viewed', []);

  const ids = lists.flatMap((l) => l.ids);
  const lastList = lists.find((l) => l.id === lastListId) ?? lists[0];

  const saveTo = (id: string, listId: string) => {
    setLists((current) =>
      current.map((l) =>
        l.id === listId ? { ...l, ids: [id, ...l.ids.filter((x) => x !== id)] } : { ...l, ids: l.ids.filter((x) => x !== id) }
      )
    );
    setLastListId(listId);
  };

  const createList = (name: string, firstId?: string) => {
    const list: Wishlist = { id: `list-${Date.now()}`, name: name.trim(), ids: [], createdAt: Date.now() };
    setLists((current) => [
      { ...list, ids: firstId ? [firstId] : [] },
      ...current.map((l) => (firstId ? { ...l, ids: l.ids.filter((x) => x !== firstId) } : l)),
    ]);
    setLastListId(list.id);
    return list;
  };

  const remove = (id: string) => setLists((current) => current.map((l) => ({ ...l, ids: l.ids.filter((x) => x !== id) })));

  const value: WishlistContextValue = {
    lists,
    ids,
    isSaved: (id) => ids.includes(id),
    listFor: (id) => lists.find((l) => l.ids.includes(id)),
    lastList,
    createList,
    saveTo,
    remove,
    renameList: (listId, name) => setLists((current) => current.map((l) => (l.id === listId ? { ...l, name: name.trim() } : l))),
    deleteList: (listId) => setLists((current) => current.filter((l) => l.id !== listId)),
    toggle: (id) => {
      if (ids.includes(id)) return remove(id);
      if (lastList) return saveTo(id, lastList.id);
      createList('Favorites', id);
    },

    recentlyViewed,
    markViewed: (id) => setRecentlyViewed((current) => [id, ...current.filter((x) => x !== id)].slice(0, MAX_RECENT)),
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside WishlistProvider');
  return context;
}
