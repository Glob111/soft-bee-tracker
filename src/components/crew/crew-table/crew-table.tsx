'use client';

import { EllipsisIcon, SearchIcon, ShieldIcon, UserCheckIcon, UserXIcon, UsersIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@components/common/confirm-dialog/confirm-dialog';
import { DataTable, type DataTableColumn } from '@components/common/data-table/data-table';
import { EmptyState } from '@components/common/empty-state/empty-state';
import { IconInput } from '@components/common/form/icon-input';
import { ChangeRoleDialog } from '@components/crew/change-role-dialog/change-role-dialog';
import { RoleBadge, ROLE_OPTIONS } from '@components/crew/role-badge';
import { Avatar, AvatarFallback } from '@ui/avatar';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select';
import type { UserRole } from '@/lib/api/auth';
import { formatDuration } from '@/lib/format-duration';
import { getUserAvatarFallback } from '@/lib/utils';
import { MOCK_CREW, type CrewMember } from '@/mocks/crew.mock';
import { formatText } from '@/lib/format-text';
import content from '../content.json';

export function CrewTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [crew, setCrew] = useState<CrewMember[]>(MOCK_CREW);
  const [pendingAction, setPendingAction] = useState<PendingMemberAction | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const members = filterMembers(crew, searchQuery, roleFilter);

  const openMemberAction = useCallback((type: MemberActionType, member: CrewMember) => {
    setPendingAction({ type, member, openedAt: Date.now() });
    setIsActionDialogOpen(true);
  }, []);
  const columns = useMemo(() => buildColumns(openMemberAction), [openMemberAction]);

  function renderMobileRow(member: CrewMember) {
    return <MobileMemberRow member={member} onAction={openMemberAction} />;
  }

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(event.target.value);
  }

  function handleRoleFilterChange(value: RoleFilter | null) {
    setRoleFilter(value ?? 'all');
  }

  function updateMember(memberId: string, changes: Partial<CrewMember>) {
    setCrew((current) => current.map((member) => (member.id === memberId ? { ...member, ...changes } : member)));
  }

  function handleRoleConfirm(member: CrewMember, role: UserRole) {
    updateMember(member.id, { role });
    setIsActionDialogOpen(false);
    toast.success(formatText(content.actions.roleChanged, { name: getFullName(member), role: getRoleLabel(role) }));
  }

  function handleBlockConfirm() {
    if (!pendingAction) {
      return;
    }

    const { member } = pendingAction;
    const isBlocked = !member.isBlocked;

    updateMember(member.id, { isBlocked });
    setIsActionDialogOpen(false);
    toast.success(formatText(isBlocked ? content.actions.accessBlocked : content.actions.accessRestored, { name: getFullName(member) }));
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='sm:w-80'>
          <IconInput
            icon={SearchIcon}
            placeholder={content.table.searchPlaceholder}
            aria-label={content.table.searchLabel}
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <Select<RoleFilter> value={roleFilter} onValueChange={handleRoleFilterChange} items={ROLE_FILTER_OPTIONS}>
          <SelectTrigger className='w-full sm:w-44' aria-label={content.table.roleFilterLabel}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className='text-muted-foreground text-sm sm:ml-auto'>{formatText(content.table.peopleCount, { count: members.length })}</span>
      </div>

      <DataTable
        columns={columns}
        rows={members}
        getRowId={getMemberId}
        renderMobileRow={renderMobileRow}
        emptyState={<EmptyState icon={UsersIcon} title={content.table.emptyTitle} description={content.table.emptyDescription} />}
      />

      {pendingAction?.type === 'role' ? (
        <ChangeRoleDialog
          key={pendingAction.openedAt}
          member={pendingAction.member}
          open={isActionDialogOpen}
          onOpenChange={setIsActionDialogOpen}
          onConfirm={handleRoleConfirm}
        />
      ) : null}

      {pendingAction?.type === 'block' ? (
        <ConfirmDialog
          open={isActionDialogOpen}
          onOpenChange={setIsActionDialogOpen}
          {...getBlockDialogCopy(pendingAction.member)}
          onConfirm={handleBlockConfirm}
        />
      ) : null}
    </div>
  );
}

function MemberIdentity({ member }: { member: CrewMember }) {
  return (
    <div className='flex items-center gap-3'>
      <Avatar className='size-9'>
        <AvatarFallback>{getUserAvatarFallback(member)}</AvatarFallback>
      </Avatar>
      <div className='flex min-w-0 flex-col'>
        <span className='truncate font-medium'>
          {member.firstName} {member.lastName}
        </span>
        <span className='text-muted-foreground truncate text-xs'>{member.email}</span>
      </div>
    </div>
  );
}

function MemberStatus({ isBlocked }: { isBlocked: boolean }) {
  return isBlocked ? (
    <Badge variant='destructive'>{content.table.status.blocked}</Badge>
  ) : (
    <Badge variant='success'>{content.table.status.active}</Badge>
  );
}

function MemberActions({ member, onAction }: MemberActionsProps) {
  function handleChangeRoleClick() {
    onAction('role', member);
  }

  function handleBlockClick() {
    onAction('block', member);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='ghost' size='icon-sm' aria-label={content.actions.menuLabel} />}>
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-44'>
        <DropdownMenuItem onClick={handleChangeRoleClick}>
          <ShieldIcon />
          {content.actions.changeRole}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {member.isBlocked ? (
          <DropdownMenuItem onClick={handleBlockClick}>
            <UserCheckIcon />
            {content.actions.restoreAccess}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant='destructive' onClick={handleBlockClick}>
            <UserXIcon />
            {content.actions.blockAccess}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileMemberRow({ member, onAction }: MemberActionsProps) {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-start justify-between gap-2'>
        <MemberIdentity member={member} />
        <MemberActions member={member} onAction={onAction} />
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <RoleBadge role={member.role} />
        <MemberStatus isBlocked={member.isBlocked} />
        <span className='text-muted-foreground ml-auto text-xs tabular-nums'>
          {formatText(content.table.monthHours, { hours: formatDuration(member.monthMinutes) })}
        </span>
      </div>
    </div>
  );
}

function getMemberId(member: CrewMember): string {
  return member.id;
}

function filterMembers(members: CrewMember[], searchQuery: string, roleFilter: RoleFilter): CrewMember[] {
  const query = searchQuery.trim().toLowerCase();

  return members.filter((member) => {
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesQuery = !query || `${member.firstName} ${member.lastName} ${member.email}`.toLowerCase().includes(query);

    return matchesRole && matchesQuery;
  });
}

function getFullName(member: CrewMember): string {
  return `${member.firstName} ${member.lastName}`;
}

function getRoleLabel(role: UserRole): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

function getBlockDialogCopy(member: CrewMember) {
  const name = getFullName(member);

  return member.isBlocked
    ? {
        title: content.actions.restoreDialog.title,
        description: formatText(content.actions.restoreDialog.description, { name }),
        confirmLabel: content.actions.restoreDialog.confirmButton,
        isDestructive: false
      }
    : {
        title: content.actions.blockDialog.title,
        description: formatText(content.actions.blockDialog.description, { name }),
        confirmLabel: content.actions.blockDialog.confirmButton,
        isDestructive: true
      };
}

function buildColumns(onAction: MemberActionHandler): DataTableColumn<CrewMember>[] {
  return [
    { id: 'member', header: content.table.columns.member, cell: (member) => <MemberIdentity member={member} /> },
    {
      id: 'position',
      header: content.table.columns.position,
      cell: (member) => <span className='text-muted-foreground'>{member.position}</span>
    },
    { id: 'role', header: content.table.columns.role, cell: (member) => <RoleBadge role={member.role} /> },
    { id: 'status', header: content.table.columns.status, cell: (member) => <MemberStatus isBlocked={member.isBlocked} /> },
    {
      id: 'hours',
      header: content.table.columns.hours,
      className: 'text-right',
      cell: (member) => <span className='font-medium tabular-nums'>{formatDuration(member.monthMinutes)}</span>
    },
    {
      id: 'actions',
      header: <span className='sr-only'>{content.table.columns.actions}</span>,
      className: 'w-12',
      cell: (member) => <MemberActions member={member} onAction={onAction} />
    }
  ];
}

const ROLE_FILTER_OPTIONS: Array<{ value: RoleFilter; label: string }> = [{ value: 'all', label: content.table.allRoles }, ...ROLE_OPTIONS];

type RoleFilter = UserRole | 'all';

type MemberActionType = 'role' | 'block';

type MemberActionHandler = (type: MemberActionType, member: CrewMember) => void;

interface PendingMemberAction {
  type: MemberActionType;
  member: CrewMember;
  openedAt: number;
}

interface MemberActionsProps {
  member: CrewMember;
  onAction: MemberActionHandler;
}
