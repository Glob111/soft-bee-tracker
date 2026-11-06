import { ProfileForm } from '@components/profile/profile-form/profile-form';
import { ROUTES } from '@/constants';
import { requireRouteAccess } from '@/lib/api/auth/server';

export default async function ProfilePage() {
  const profile = await requireRouteAccess(ROUTES.PROFILE);

  return (
    <div className='mx-auto w-full max-w-2xl'>
      <ProfileForm profile={profile} />
    </div>
  );
}
