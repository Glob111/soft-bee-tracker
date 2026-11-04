import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getIsMobileServerSnapshot, getIsMobileSnapshot, subscribeToMobileQuery } from './use-mobile';

interface FakeMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

describe('use-mobile store helpers', () => {
  let mediaQueryList: FakeMediaQueryList;
  let matchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mediaQueryList = {
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    matchMedia = vi.fn((query: string) => {
      mediaQueryList.media = query;
      return mediaQueryList;
    });
    vi.stubGlobal('window', { matchMedia });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('queries the mobile breakpoint (below 768px)', () => {
    getIsMobileSnapshot();

    expect(matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('returns the current media query match as the snapshot', () => {
    mediaQueryList.matches = true;
    expect(getIsMobileSnapshot()).toBe(true);

    mediaQueryList.matches = false;
    expect(getIsMobileSnapshot()).toBe(false);
  });

  it('subscribes to media query changes and unsubscribes with the same listener', () => {
    const onStoreChange = vi.fn();

    const unsubscribe = subscribeToMobileQuery(onStoreChange);

    expect(mediaQueryList.addEventListener).toHaveBeenCalledWith('change', onStoreChange);

    unsubscribe();

    expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith('change', onStoreChange);
  });

  it('renders desktop on the server', () => {
    expect(getIsMobileServerSnapshot()).toBe(false);
  });
});
