import { createContext, useContext, type ReactNode } from 'react';

import { usePersistedState } from '@/hooks/use-persisted-state';

type SettingsContextValue = {
  /** Show the full price (with taxes, for the whole stay) on Explore instead of the nightly price. */
  displayTotalPrice: boolean;
  setDisplayTotalPrice: (on: boolean) => void;
  /** Hosting mode swaps the guest tabs for the host tabs. */
  hostMode: boolean;
  setHostMode: (on: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [displayTotalPrice, setDisplayTotalPrice] = usePersistedState('display-total-price', false);
  const [hostMode, setHostMode] = usePersistedState('host-mode', false);

  return (
    <SettingsContext.Provider value={{ displayTotalPrice, setDisplayTotalPrice, hostMode, setHostMode }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}
