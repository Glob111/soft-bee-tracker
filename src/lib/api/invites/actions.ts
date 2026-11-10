'use server';

import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';

import type { UserRole } from '@/lib/api/auth/types';
import { getRouteSession, getSessionProfile } from '@/lib/api/auth/server';
import { canInviteRole, getInvitableRoles } from '@/lib/api/invites/permissions';
import type { InviteMemberInput, InviteMemberResult } from '@/lib/api/invites/types';
import { formatText } from '@/lib/format-text';
import { inviteMemberFormSchema } from '@/lib/schemas/invite-member-form.schema';
import { createServiceClient } from '@/lib/supabase/server';
import content from './content.json';

/**
 * Validates an invite on the server (SBT-54). Checks run cheapest and most
 * fundamental first:
 * 1. a live, unblocked session whose user_role claim may invite at all
 * 2. the input, with the same zod schema the dialog uses
 * 3. the requested role is one this inviter may assign
 * 4. the email has no account and no open invite
 *
 * Every check passing returns 'not-sent'; SBT-55 replaces that last step with
 * the Supabase invite. The client's input is never trusted: a hand-crafted call
 * runs the same checks as the dialog.
 */
export async function inviteMember(input: InviteMemberInput): Promise<InviteMemberResult> {
  try {
    const inviterRole = await getInviterRole();

    if (inviterRole === undefined) {
      return { status: 'forbidden', message: content.signInRequired };
    }

    if (getInvitableRoles(inviterRole).length === 0) {
      return { status: 'forbidden', message: content.notAllowed };
    }

    const parsed = inviteMemberFormSchema.safeParse(input);

    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);

      return {
        status: 'invalid',
        message: content.invalidInput,
        fieldErrors: { email: fieldErrors.email?.[0], role: fieldErrors.role?.[0] }
      };
    }

    const { email, role } = parsed.data;

    if (!canInviteRole(inviterRole, role)) {
      return { status: 'forbidden', message: formatText(content.roleNotAllowed, { role }) };
    }

    const existingAccount = await findExistingAccount(email);

    if (existingAccount === 'member') {
      return { status: 'already-member', message: formatText(content.alreadyMember, { email }) };
    }

    if (existingAccount === 'invited') {
      return { status: 'already-invited', message: formatText(content.alreadyInvited, { email }) };
    }

    return { status: 'not-sent', message: formatText(content.readyToSend, { email }) };
  } catch (error) {
    // redirect() from the session checks (e.g. a blocked user sent to sign-out)
    // must propagate so next performs the navigation
    unstable_rethrow(error);

    return { status: 'error', message: content.unexpectedError };
  }
}

// undefined: no usable session (signed out, revoked or blocked).
// getSessionProfile asks the Auth server and redirects blocked users, so a
// session the proxy still trusts can't invite after it was revoked or blocked.
async function getInviterRole(): Promise<UserRole | null | undefined> {
  const session = await getRouteSession();

  if (!session) {
    return undefined;
  }

  const profile = await getSessionProfile();

  return profile ? session.role : undefined;
}

// the service client reads other users' rows and auth data, which the
// inviter's own RLS-scoped session can't see. server-only: createServiceClient
// lives in lib/supabase/server and this file only runs as a server action.
async function findExistingAccount(email: string): Promise<ExistingAccount> {
  const supabase = createServiceClient();
  const { data: row, error: rowError } = await supabase.from('users').select('id').eq('email', email).maybeSingle();

  if (rowError) {
    throw rowError;
  }

  if (!row) {
    return null;
  }

  const { data, error } = await supabase.auth.admin.getUserById(row.id);

  if (error) {
    throw error;
  }

  // an accepted invite (or any finished sign-up) confirms the email; anything
  // else is an invite or sign-up still waiting, which SBT-55 can resend
  return data.user.email_confirmed_at ? 'member' : 'invited';
}

type ExistingAccount = 'member' | 'invited' | null;
