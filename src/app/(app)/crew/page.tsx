import { PageHeader } from '@components/common/page-header/page-header';
import { CrewTable } from '@components/crew/crew-table/crew-table';
import { InviteMemberDialog } from '@components/crew/invite-member-dialog/invite-member-dialog';
import { ROUTES } from '@/constants';
import { getRouteSession, requireRouteAccess } from '@/lib/api/auth/server';
import { getInvitableRoles } from '@/lib/api/invites';
import content from './content.json';

export default async function CrewPage() {
  await requireRouteAccess(ROUTES.CREW);
  // same cached claim requireRouteAccess just checked; picker options only, the
  // server action re-checks the inviter on every call
  const session = await getRouteSession();
  const invitableRoles = getInvitableRoles(session?.role ?? null);
  const inviteAction = invitableRoles.length > 0 ? <InviteMemberDialog invitableRoles={invitableRoles} /> : undefined;

  return (
    <>
      <PageHeader eyebrow={content.eyebrow} title={content.title} description={content.description} actions={inviteAction} />
      <CrewTable />
    </>
  );
}
