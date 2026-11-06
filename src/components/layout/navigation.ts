import { ChartColumnIcon, ClockIcon, FolderKanbanIcon, UserIcon, UsersIcon, type LucideIcon } from 'lucide-react';

import { ROUTES } from '@/constants';
import content from './content.json';

export const NAV_ITEMS: NavItem[] = [
  { title: content.navigation.tracker, href: ROUTES.TRACKER, icon: ClockIcon },
  { title: content.navigation.crew, href: ROUTES.CREW, icon: UsersIcon },
  { title: content.navigation.reports, href: ROUTES.REPORTS, icon: ChartColumnIcon },
  { title: content.navigation.projects, href: ROUTES.PROJECTS, icon: FolderKanbanIcon }
];

const SECTION_ITEMS: NavItem[] = [...NAV_ITEMS, { title: content.navigation.profile, href: ROUTES.PROFILE, icon: UserIcon }];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findSectionItem(pathname: string): NavItem | undefined {
  return SECTION_ITEMS.find((item) => isNavItemActive(pathname, item.href));
}

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}
