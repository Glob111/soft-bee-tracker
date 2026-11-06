import 'server-only';

import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants';
import { createServerClient } from '@/lib/supabase/server';
import { mapUserRowToProfile, USER_COLUMNS } from '@/lib/api/auth/mappers';
import type { UserProfile } from '@/lib/api/auth/types';
import type { ApiError } from '@/types/api-error';
import { getRouteAccess, getRouteSessionFromClaim, type RouteSession } from '@/lib/route-access';

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

// defense in depth for role-restricted pages: the proxy already blocks these
// routes, but the page re-checks with the same decision (getRouteAccess) and
// the same role source, so it stays protected if the proxy matcher drifts.
// it then loads the profile only to cut blocked users (getSessionProfile);
// the role itself never comes from public.users.
export async function requireRouteAccess(pathname: string): Promise<void> {
  const access = getRouteAccess(pathname, await getRouteSession());

  if (access === 'login') {
    redirect(ROUTES.LOGIN);
  }

  if (access === 'denied') {
    redirect(ROUTES.ACCESS_DENIED);
  }

  if (!(await getSessionProfile())) {
    redirect(ROUTES.LOGIN);
  }
}

// postgREST code for .single() matching zero rows
const NO_ROWS_ERROR_CODE = 'PGRST116';
