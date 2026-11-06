import { ROUTES } from '@/constants';
import { requireRouteAccess } from '@/lib/api/auth/server';

export default async function Page() {
  await requireRouteAccess(ROUTES.HOME);

  return <h1 className='text-4xl font-bold'>Welcome to Next.js!</h1>;
}
