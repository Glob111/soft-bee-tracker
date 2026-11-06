import type { UserRole } from '@/lib/api/auth';

export const MOCK_CREW: CrewMember[] = [
  {
    id: 'u1',
    firstName: 'Olena',
    lastName: 'Koval',
    email: 'olena@softbee.dev',
    role: 'admin',
    position: 'Delivery lead',
    isBlocked: false,
    monthMinutes: 7920
  },
  {
    id: 'u2',
    firstName: 'Andrii',
    lastName: 'Melnyk',
    email: 'andrii@softbee.dev',
    role: 'manager',
    position: 'Project manager',
    isBlocked: false,
    monthMinutes: 6600
  },
  {
    id: 'u3',
    firstName: 'Iryna',
    lastName: 'Shevchenko',
    email: 'iryna@softbee.dev',
    role: 'worker',
    position: 'Frontend engineer',
    isBlocked: false,
    monthMinutes: 6240
  },
  {
    id: 'u4',
    firstName: 'Taras',
    lastName: 'Bondar',
    email: 'taras@softbee.dev',
    role: 'worker',
    position: 'Backend engineer',
    isBlocked: false,
    monthMinutes: 5880
  },
  {
    id: 'u5',
    firstName: 'Sofiia',
    lastName: 'Tkachenko',
    email: 'sofiia@softbee.dev',
    role: 'worker',
    position: 'QA engineer',
    isBlocked: true,
    monthMinutes: 1200
  },
  {
    id: 'u6',
    firstName: 'Maksym',
    lastName: 'Kravets',
    email: 'maksym@softbee.dev',
    role: 'worker',
    position: 'Designer',
    isBlocked: false,
    monthMinutes: 4980
  }
];

export interface CrewMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  position: string;
  isBlocked: boolean;
  monthMinutes: number;
}
