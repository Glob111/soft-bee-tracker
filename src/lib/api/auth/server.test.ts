import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTES } from '@/constants';
import type { UserRole } from '@/lib/api/auth/types';

const { getClaims, getUser, single, redirect } = vi.hoisted(() => ({
  getClaims: vi.fn(),
  getUser: vi.fn(),
  single: vi.fn(),
  // next/navigation's redirect throws to stop rendering; mirror that
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  })
}));

vi.mock('next/navigation', () => ({ redirect }));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () =>
    Promise.resolve({
      auth: { getClaims, getUser },
      from: () => ({ select: () => ({ eq: () => ({ single }) }) })
    })
}));

// node-only unit test of the server helper; the rule guards client bundles
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { getRouteSession, getSessionProfile, requireRouteAccess } from '@/lib/api/auth/server';

describe('getSessionProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null without a user', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(getSessionProfile()).resolves.toBeNull();
    expect(single).not.toHaveBeenCalled();
  });

  it('resets the session when the profile row is missing', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } });

    await expect(getSessionProfile()).rejects.toThrow(`NEXT_REDIRECT:${ROUTES.SIGN_OUT}`);
  });

  it('throws instead of signing out on other database errors', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    single.mockResolvedValue({ data: null, error: { code: '57014', message: 'statement timeout' } });

    await expect(getSessionProfile()).rejects.toEqual({ message: 'statement timeout', statusCode: 500 });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('getRouteSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null without valid claims', async () => {
    getClaims.mockResolvedValue({ data: null, error: new Error('invalid jwt') });

    await expect(getRouteSession()).resolves.toBeNull();
  });

  it('reads the role from the user_role claim', async () => {
    signInAs('manager');

    await expect(getRouteSession()).resolves.toEqual({ role: 'manager' });
  });

  it('fails closed on a missing or unknown claim', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'user-1', user_role: 'owner' } }, error: null });

    await expect(getRouteSession()).resolves.toEqual({ role: null });
  });
});

describe('requireRouteAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login without a session', async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    await expect(requireRouteAccess(ROUTES.CREW)).rejects.toThrow(`NEXT_REDIRECT:${ROUTES.LOGIN}`);
  });

  it.each<[string, UserRole]>([
    [ROUTES.CREW, 'worker'],
    [ROUTES.REPORTS, 'worker'],
    [ROUTES.USERS, 'worker'],
    [ROUTES.USERS, 'manager']
  ])('redirects %s for %s to access denied', async (route, role) => {
    signInAs(role);

    await expect(requireRouteAccess(route)).rejects.toThrow(`NEXT_REDIRECT:${ROUTES.ACCESS_DENIED}`);
  });

  it('redirects to access denied when the claim is missing', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'user-1' } }, error: null });

    await expect(requireRouteAccess(ROUTES.CREW)).rejects.toThrow(`NEXT_REDIRECT:${ROUTES.ACCESS_DENIED}`);
  });

  it.each<[string, UserRole]>([
    [ROUTES.CREW, 'manager'],
    [ROUTES.REPORTS, 'manager'],
    [ROUTES.USERS, 'admin']
  ])('allows %s for %s', async (route, role) => {
    signInAs(role);

    await expect(requireRouteAccess(route)).resolves.toBeUndefined();
    expect(redirect).not.toHaveBeenCalled();
  });
});

function signInAs(role: UserRole) {
  getClaims.mockResolvedValue({ data: { claims: { sub: 'user-1', user_role: role } }, error: null });
}
