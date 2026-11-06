import type { UserRole } from '@/lib/api/auth/types';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  AUTH_CONFIRM: '/auth/confirm',
  UPDATE_PASSWORD: '/auth/update-password',
  SIGN_OUT: '/auth/sign-out',
  ACCESS_DENIED: '/access-denied',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  TRACKER: '/tracker',
  CREW: '/crew',
  REPORTS: '/reports',
  USERS: '/users',
  PROFILE: '/profile'
} as const;

// reachable without a session; signed-in users are bounced from GUEST_ONLY_ROUTES_LIST
export const PUBLIC_ROUTES_LIST = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.AUTH_CONFIRM,
  ROUTES.UPDATE_PASSWORD,
  ROUTES.SIGN_OUT,
  ROUTES.ACCESS_DENIED
];

// query param carrying the page a signed-out user asked for, back to it after login
export const NEXT_PARAM = 'next';

export const GUEST_ONLY_ROUTES_LIST = [ROUTES.LOGIN, ROUTES.REGISTER];

export const ALL_ROLES: readonly UserRole[] = ['worker', 'manager', 'admin'];

// role-restricted routes. any route not public and not listed here only needs a
// session, for every role. route-access.test.ts classifies every ROUTES entry,
// so adding a route forces a decision here.
// keep in sync with RLS: hiding a page is UX, the database still enforces data access.
export const ROLE_RESTRICTED_ROUTES: Record<string, readonly UserRole[]> = {
  [ROUTES.CREW]: ['manager', 'admin'],
  [ROUTES.REPORTS]: ['manager', 'admin'],
  [ROUTES.USERS]: ['admin']
};

export const ADMIN_ROLE = 'admin';
