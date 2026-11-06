'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartColumnIcon, ClockIcon, FolderKanbanIcon, HexagonIcon, UserCogIcon, UsersIcon, type LucideIcon } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@ui/sidebar';
import { NavUser } from '@components/layout/app-sidebar/nav-user';
import { ROUTES } from '@/constants';
import type { UserProfile, UserRole } from '@/lib/api/auth';
import { canRoleAccessRoute, matchesRoute } from '@/lib/route-access';

interface AppSidebarProps {
  profile: UserProfile;
  // from the user_role claim (getRouteSession), not profile.role, so links match the proxy
  role: UserRole | null;
}

export function AppSidebar({ profile, role }: AppSidebarProps) {
  const pathname = usePathname();
  const navItems = getVisibleNavItems(role);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' tooltip='Soft Bee Tracker' render={<Link href={ROUTES.TRACKER} />}>
              <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <HexagonIcon />
              </div>
              <div className='grid flex-1 text-left leading-tight'>
                <span className='truncate font-medium'>Soft Bee</span>
                <span className='text-muted-foreground truncate text-xs'>Tracker</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isNavItemActive(pathname, item.href)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser profile={profile} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function isNavItemActive(pathname: string, href: string): boolean {
  return matchesRoute(pathname, href);
}

// hides links the role can't open; the proxy, page checks and RLS still enforce access
function getVisibleNavItems(role: UserRole | null): NavItem[] {
  return NAV_ITEMS.filter((item) => canRoleAccessRoute(item.href, role));
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Tracker', href: ROUTES.TRACKER, icon: ClockIcon },
  { title: 'Crew', href: ROUTES.CREW, icon: UsersIcon },
  { title: 'Reports', href: ROUTES.REPORTS, icon: ChartColumnIcon },
  { title: 'Projects', href: ROUTES.PROJECTS, icon: FolderKanbanIcon },
  { title: 'Users', href: ROUTES.USERS, icon: UserCogIcon }
];

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}
