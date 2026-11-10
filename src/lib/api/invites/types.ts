import type { UserRole } from '@/lib/api/auth/types';

export interface InviteMemberInput {
  email: string;
  role: UserRole;
}

export interface InviteFieldErrors {
  email?: string;
  role?: string;
}

// a result, not a thrown error: next hides thrown server action errors from the
// client in production, so every expected outcome is a value the dialog can show.
// 'not-sent' marks "all checks passed"; SBT-55 replaces it with the real send.
export type InviteMemberResult =
  | { status: 'not-sent'; message: string }
  | { status: 'invalid'; message: string; fieldErrors: InviteFieldErrors }
  | { status: 'forbidden'; message: string }
  | { status: 'already-invited'; message: string }
  | { status: 'already-member'; message: string }
  | { status: 'error'; message: string };

export type InviteMemberStatus = InviteMemberResult['status'];
