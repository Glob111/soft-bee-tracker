'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOutIcon, UserIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@ui/avatar';
import { Button } from '@ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@ui/dropdown-menu';
import { ROUTES } from '@/constants';
import { useSignOut } from '@/lib/api/auth';
import content from '../content.json';

interface AvatarDropdownProps {
  avatarUrl?: string;
  displayName: string;
  fallback: string;
}

export function AvatarDropdown({ avatarUrl, displayName, fallback }: AvatarDropdownProps) {
  const router = useRouter();

  const signOut = useSignOut({
    onSuccess: () => {
      router.push(ROUTES.LOGIN);
      router.refresh();
    }
  });

  function handleSignOutClick() {
    signOut.mutate();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant='ghost' size='icon' className='rounded-full' aria-label={content.accountMenu.openLabel}>
            <Avatar>
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align='end' className='min-w-40'>
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href={ROUTES.PROFILE} />}>
            <UserIcon />
            {content.accountMenu.profile}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant='destructive' disabled={signOut.isPending} onClick={handleSignOutClick}>
            <LogOutIcon />
            {content.accountMenu.logOut}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
