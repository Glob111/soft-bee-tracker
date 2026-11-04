import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

export function useIsMobile() {
  return React.useSyncExternalStore(subscribeToMobileQuery, getIsMobileSnapshot, getIsMobileServerSnapshot);
}

export function subscribeToMobileQuery(onStoreChange: () => void) {
  const mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);

  mediaQueryList.addEventListener('change', onStoreChange);

  return function unsubscribeFromMobileQuery() {
    mediaQueryList.removeEventListener('change', onStoreChange);
  };
}

export function getIsMobileSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

// Server render has no viewport; match the previous behavior of rendering desktop first.
export function getIsMobileServerSnapshot() {
  return false;
}
