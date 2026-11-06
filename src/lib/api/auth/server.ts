import 'server-only';

import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants';
import { createServerClient } from '@/lib/supabase/server';
import { mapUserRowToProfile, USER_COLUMNS } from '@/lib/api/auth/mappers';
import type { UserProfile } from '@/lib/api/auth/types';
import type { ApiError } from '@/types/api-error';
import { buildLoginPath, getRouteAccess, getRouteSessionFromClaim, type RouteSession } from '@/lib/route-access';

// server-component/route-handler counterpart of useSessionProfile.
// imported via '@/lib/api/auth/server' (not the barrel) so client bundles
// never pull in next/headers.
export async function getSessionProfile(): Promise<UserProfile | null> {
  const supabase = await createServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return null;
  }

  const { data, error } = await supabase.from('users').select(USER_COLUMNS).eq('id', userData.user.id).single();

  // no profile row: the session can never use the app. server components can't
  // write cookies, so hand off to the route handler that clears them
  if (error?.code === NO_ROWS_ERROR_CODE) {
    redirect(ROUTES.SIGN_OUT);
  }

  // anything else (timeout, network, RLS) is likely transient: surface it to the
  // error boundary instead of logging the user out
  if (error) {
    throw {
      message: error.message,
      statusCode: 500
    } satisfies ApiError;
  }

  const profile = mapUserRowToProfile(data);

  // the JWT hook copies user_role only, so the proxy can't see a block; cut a
  // blocked user's live session here, the same way signInWithPassword does
  if (profile.isBlocked) {
    redirect(ROUTES.SIGN_OUT);
  }

  return profile;
}

// server counterpart of the proxy session: role from the verified user_role
// claim, so the sidebar, page guards, proxy and RLS never disagree.
// null means no valid session.
export async function getRouteSession(): Promise<RouteSession | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getClaims();

  return error || !data ? null : getRouteSessionFromClaim(data.claims.user_role);
}

/**
 * Page guard; call it at the top of every app page.tsx.
 *
 * It does not decide roles itself: it applies ROLE_RESTRICTED_ROUTES through
 * getRouteAccess, the same decision and the same user_role claim the proxy
 * uses. A route missing from that map is open to every signed-in role, so
 * restricting a page means adding it there (route-access.test.ts enforces a
 * decision for every ROUTES entry).
 *
 * On top of the proxy it adds two checks the claim can't carry: getUser() asks
 * the Auth server, so a revoked session is caught even when getClaims verified
 * the JWT locally, and getSessionProfile() cuts blocked users. The role itself
 * never comes from public.users.
 */
export async function requireRouteAccess(pathname: string): Promise<UserProfile> {
  const access = getRouteAccess(pathname, await getRouteSession());

  if (access === 'login') {
    redirect(buildLoginPath(pathname));
  }

  if (access === 'denied') {
    redirect(ROUTES.ACCESS_DENIED);
  }

  const profile = await getSessionProfile();

  // the claim said "signed in" but the Auth server says no (revoked session or
  // deleted user). /login would bounce straight back here, because the proxy
  // still sees a valid JWT and treats /login as guest-only, so clear the stale
  // cookies first
  if (!profile) {
    redirect(ROUTES.SIGN_OUT);
  }

  return profile;
}

// postgREST code for .single() matching zero rows
const NO_ROWS_ERROR_CODE = 'PGRST116';
