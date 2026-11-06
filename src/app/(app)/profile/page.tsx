import { redirect } from 'next/navigation';

import { PageHeader } from '@components/common/page-header/page-header';
import { ProfileForm } from '@components/profile/profile-form/profile-form';
import { ROUTES } from '@/constants';
import { getSessionProfile } from '@/lib/api/auth/server';
import content from './content.json';

export default async function ProfilePage() {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-8'>
      <PageHeader eyebrow={content.eyebrow} title={content.title} description={content.description} />
      <ProfileForm profile={profile} />
    </div>
  );
}
