import { useSyncExternalStore } from 'react';

const subscribe = (query: string) => (onStoreChange: () => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia(query);
  mql.addEventListener('change', onStoreChange);
  return () => mql.removeEventListener('change', onStoreChange);
};

const getSnapshot = (query: string) => () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
};

const getServerSnapshot = () => false;

export const useMediaQuery = (query: string): boolean => {
  return useSyncExternalStore(subscribe(query), getSnapshot(query), getServerSnapshot);
};

/**
 * Returns how many months should be shown side-by-side in Saldos based on viewport width:
 * - < 1024px: 1
 * - < 1536px: 2
 * - >= 1536px: 3
 */
export const useMonthsToShow = (): number => {
  const isLg = useMediaQuery('(min-width: 1024px)');
  const is2xl = useMediaQuery('(min-width: 1536px)');

  if (is2xl) return 3;
  if (isLg) return 2;
  return 1;
};
