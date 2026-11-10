import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserRole } from '@/lib/api/auth/types';

const { getRouteSession, resolveSessionProfile, maybeSingle, getUserById, eq, inviteUserByEmail } = vi.hoisted(() => ({
  getRouteSession: vi.fn(),
  resolveSessionProfile: vi.fn(),
  maybeSingle: vi.fn(),
  getUserById: vi.fn(),
  eq: vi.fn(),
  inviteUserByEmail: vi.fn()
}));

vi.mock('@/lib/api/auth/server', () => ({ getRouteSession, resolveSessionProfile }));

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: (column: string, value: string) => {
          eq(column, value);
          return { maybeSingle };
        }
      })
    }),
    auth: { admin: { getUserById, inviteUserByEmail } }
  })
}));

// next's redirect() throws a NEXT_REDIRECT error that must escape the action
vi.mock('next/navigation', () => ({
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
  }
}));

import { inviteMember } from '@/lib/api/invites/actions';

describe('inviteMember', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    noExistingAccount();
  });

  describe('permission to invite', () => {
    it('refuses without a session', async () => {
      getRouteSession.mockResolvedValue(null);

      await expect(inviteMember({ email: 'new@softbee.dev', role: 'worker' })).resolves.toMatchObject({ status: 'forbidden' });
      expect(maybeSingle).not.toHaveBeenCalled();
    });

    it('refuses a session the Auth server no longer accepts', async () => {
      getRouteSession.mockResolvedValue({ role: 'admin' });
      resolveSessionProfile.mockResolvedValue({ kind: 'none' });

      await expect(inviteMember({ email: 'new@softbee.dev', role: 'worker' })).resolves.toMatchObject({ status: 'forbidden' });
    });

    it.each<[UserRole | null]>([['worker'], [null]])('refuses an inviter whose role is %s', async (role) => {
      signInAs(role);

      await expect(inviteMember({ email: 'new@softbee.dev', role: 'worker' })).resolves.toMatchObject({
        status: 'forbidden',
        message: "Your role can't invite teammates."
      });
    });

    it.each<UserRole>(['manager', 'admin'])('refuses a manager inviting someone as %s', async (role) => {
      signInAs('manager');

      await expect(inviteMember({ email: 'new@softbee.dev', role })).resolves.toMatchObject({ status: 'forbidden' });
      expect(maybeSingle).not.toHaveBeenCalled();
    });

    // a thrown redirect would leave the useMutation call pending, so the reset
    // comes back as a value the dialog follows with a full page load
    it('returns the sign-out path for a blocked user instead of redirecting', async () => {
      getRouteSession.mockResolvedValue({ role: 'admin' });
      resolveSessionProfile.mockResolvedValue({ kind: 'reset', signOutPath: '/auth/sign-out?reason=blocked' });

      await expect(inviteMember({ email: 'new@softbee.dev', role: 'worker' })).resolves.toEqual({
        status: 'signed-out',
        message: 'Your session has ended. Signing you out…',
        signOutPath: '/auth/sign-out?reason=blocked'
      });
      expect(maybeSingle).not.toHaveBeenCalled();
    });

    it('lets next control-flow errors escape', async () => {
      getRouteSession.mockResolvedValue({ role: 'admin' });
      resolveSessionProfile.mockRejectedValue(new Error('NEXT_REDIRECT:/somewhere'));

      await expect(inviteMember({ email: 'new@softbee.dev', role: 'worker' })).rejects.toThrow('NEXT_REDIRECT');
    });
  });

  describe('input', () => {
    it('returns field errors for a bad email and role', async () => {
      signInAs('admin');

      const result = await inviteMember({ email: 'nope', role: 'owner' as UserRole });

      expect(result).toMatchObject({
        status: 'invalid',
        fieldErrors: { email: 'Enter a valid email address', role: 'Choose a role' }
      });
      expect(maybeSingle).not.toHaveBeenCalled();
    });

    it('looks up the normalized email', async () => {
      signInAs('admin');

      await inviteMember({ email: '  New@SoftBee.dev ', role: 'worker' });

      expect(eq).toHaveBeenCalledWith('email', 'new@softbee.dev');
    });
  });

  describe('existing accounts and repeat invitations', () => {
    it('rejects an email that already has an account', async () => {
      signInAs('admin');
      existingAccount({ email_confirmed_at: '2026-11-01T10:00:00Z', invited_at: null });

      await expect(inviteMember({ email: 'worker@softbee.dev', role: 'worker' })).resolves.toEqual({
        status: 'already-member',
        message: 'worker@softbee.dev already has an account.'
      });
    });

    it('rejects a repeat invitation that has not been accepted', async () => {
      signInAs('manager');
      existingAccount({ email_confirmed_at: null, invited_at: '2026-11-09T10:00:00Z' });

      await expect(inviteMember({ email: 'pending@softbee.dev', role: 'worker' })).resolves.toMatchObject({
        status: 'already-invited'
      });
    });

    it('reports a lookup failure without leaking it', async () => {
      signInAs('admin');
      maybeSingle.mockResolvedValue({ data: null, error: { message: 'connection refused' } });

      await expect(inviteMember({ email: 'new@softbee.dev', role: 'worker' })).resolves.toEqual({
        status: 'error',
        message: "We couldn't check this invite. Try again in a moment."
      });
    });
  });

  describe('a valid invite', () => {
    it.each<[UserRole, UserRole]>([
      ['admin', 'admin'],
      ['admin', 'manager'],
      ['manager', 'worker']
    ])('passes every check for %s inviting a %s, and sends nothing yet', async (inviter, role) => {
      signInAs(inviter);

      await expect(inviteMember({ email: 'new@softbee.dev', role })).resolves.toMatchObject({ status: 'not-sent' });
      expect(inviteUserByEmail).not.toHaveBeenCalled();
    });
  });
});

function signInAs(role: UserRole | null) {
  getRouteSession.mockResolvedValue({ role });
  resolveSessionProfile.mockResolvedValue({ kind: 'active', profile: { id: 'inviter-1', isBlocked: false } });
}

function noExistingAccount() {
  maybeSingle.mockResolvedValue({ data: null, error: null });
}

function existingAccount(user: { email_confirmed_at: string | null; invited_at: string | null }) {
  maybeSingle.mockResolvedValue({ data: { id: 'user-2' }, error: null });
  getUserById.mockResolvedValue({ data: { user: { id: 'user-2', ...user } }, error: null });
}
