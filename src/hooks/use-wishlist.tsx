import { createContext, useContext, useState, type ReactNode } from 'react';

type WishlistContextValue = {
  ids: string[];
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  const value: WishlistContextValue = {
    ids,
    isSaved: (id) => ids.includes(id),
    toggle: (id) =>
      setIds((current) =>
        current.includes(id) ? current.filter((saved) => saved !== id) : [id, ...current]
      ),
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside WishlistProvider');
  return context;
}
