'use client';

import { usePathname } from 'next/navigation';

import { Separator } from '@ui/separator';
import { SidebarTrigger } from '@ui/sidebar';
import { AvatarDropdown } from '@components/layout/app-header/avatar-dropdown';
import { findSectionItem } from '@components/layout/navigation';
import { ThemeToggle } from '@components/layout/theme-toggle/theme-toggle';
import type { UserProfile } from '@/lib/api/auth';
import { getUserAvatarFallback } from '@/lib/utils';

interface AppHeaderProps {
  profile: UserProfile;
}

export function AppHeader({ profile }: AppHeaderProps) {
  const pathname = usePathname();
  const section = findSectionItem(pathname);

  return (
    <header className='glass sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 rounded-t-xl border-b px-4'>
      <div className='flex min-w-0 items-center gap-2'>
        <SidebarTrigger />
        <Separator orientation='vertical' className='mr-1 data-vertical:h-4' />
        {section ? (
          <div className='flex min-w-0 items-center gap-2 text-sm'>
            <section.icon className='text-muted-foreground size-4 shrink-0' />
            <span className='truncate font-medium'>{section.title}</span>
          </div>
        ) : null}
      </div>

      <div className='flex items-center gap-1'>
        <ThemeToggle />
        <div className='md:hidden'>
          <AvatarDropdown
            avatarUrl={profile.avatarUrl ?? undefined}
            displayName={`${profile.firstName} ${profile.lastName}`.trim() || profile.username}
            fallback={getUserAvatarFallback(profile)}
          />
        </div>
      </div>
    </header>
  );
}
