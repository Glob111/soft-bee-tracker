import Link from 'next/link';

import { LoginForm } from '@/components/auth/login-form/login-form';
import { AuthHeading } from '@components/layout/auth-shell/auth-heading';
import { ROUTES } from '@/constants';
import content from './content.json';

export default function LoginPage() {
  return (
    <div className='mx-auto flex w-full max-w-sm flex-col gap-8'>
      <AuthHeading title={content.title} description={content.description} />

      <LoginForm />

      <p className='text-muted-foreground text-center text-xs'>
        {content.termsPrefix}{' '}
        <Link className='text-foreground font-medium underline-offset-4 hover:underline' href={ROUTES.TERMS}>
          {content.termsLink}
        </Link>
        .
      </p>
    </div>
  );
}
