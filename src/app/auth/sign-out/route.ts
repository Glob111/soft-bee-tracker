import { type NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@/constants';
import { createServerClient } from '@/lib/supabase/server';

const SUPABASE_COOKIE_PREFIX = 'sb-';

// resets a broken session (e.g. no readable public.users row) from server
// components, which can't write cookies themselves. local scope: only this
// browser's session is dropped, other devices stay signed in.
// GET on purpose: a server component can only redirect here. the cost is that
// any site can link to it and sign a user out (logout CSRF); it can't sign
// anyone in or read data, so we accept that.
export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  await supabase.auth.signOut({ scope: 'local' });

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = ROUTES.LOGIN;
  loginUrl.search = '';

  const response = NextResponse.redirect(loginUrl);

  // signOut drops the cookie it knows; chunked (`...auth-token.0`) or stale
  // sb-* cookies can outlive it and keep the proxy seeing a user
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith(SUPABASE_COOKIE_PREFIX)) {
      response.cookies.set(name, '', { path: '/', maxAge: 0 });
    }
  });

  return response;
}
