import { useSyncExternalStore } from 'react';

import type { WhenValue } from '@/components/calendar/when-picker';

// The dates choice from Search ("Nov 14 – 17", "A weekend in Dec or Jan"...). The global filters store only
// knows where/guests, so this tiny store carries it back to the Explore search pill (and into Search next time).

export type TripWhen = { label: string; value: WhenValue };

let current: TripWhen | null = null;
const listeners = new Set<() => void>();

export function setTripWhen(next: TripWhen | null) {
  if (next?.label === current?.label && next?.value === current?.value) return;
  current = next;
  for (const listener of listeners) listener();
}

/** The last choice, for seeding Search's state. */
export function getTripWhen() {
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getLabel = () => current?.label ?? null;

/** The label for the Explore search pill, or null. */
export function useTripWhen() {
  return useSyncExternalStore(subscribe, getLabel, getLabel);
}
