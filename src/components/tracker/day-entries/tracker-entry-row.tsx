'use client';

import { PencilIcon, PlayIcon, Trash2Icon } from 'lucide-react';

import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import type { Tracker, TrackerStatus } from '@/lib/api/trackers';
import { formatHoursMinutes } from '@/lib/format-duration';
import { isLiveTrackerActive } from '@/lib/live-tracker';
import { getTrackerMinutes } from '@/lib/tracker-days';
import content from '../content.json';

export function TrackerEntryRow({
  tracker,
  projectName,
  now,
  hasActiveTimer,
  isPlayPending,
  onEdit,
  onDelete,
  onPlay
}: TrackerEntryRowProps) {
  const isActiveTimer = isLiveTrackerActive(tracker);
  const isEditable = tracker.status === 'new' && !isActiveTimer;

  function handleEditClick() {
    onEdit(tracker);
  }

  function handleDeleteClick() {
    onDelete(tracker);
  }

  function handlePlayClick() {
    onPlay(tracker);
  }

  return (
    <li className='flex items-center gap-3 px-2 py-3'>
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='truncate font-semibold'>{projectName}</span>
        <span className='text-muted-foreground truncate text-sm'>{tracker.description?.trim() || content.entryRow.noDescription}</span>
      </div>

      <span className='shrink-0 font-medium tabular-nums'>{formatHoursMinutes(getTrackerMinutes(tracker, now))}</span>

      <div className='flex shrink-0 items-center gap-1'>
        {isActiveTimer ? (
          <EntryBadge
            label={tracker.liveStatus === 'start' ? content.entryRow.live : content.entryRow.paused}
            variant={tracker.liveStatus === 'start' ? 'brand' : 'warning'}
          />
        ) : null}
        {!isActiveTimer && !isEditable ? <EntryBadge {...LOCKED_STATUS_BADGES[tracker.status]} /> : null}
        {isEditable ? (
          <>
            <Button
              variant='ghost'
              size='icon'
              aria-label={content.entryRow.editLabel}
              title={content.entryRow.edit}
              onClick={handleEditClick}
            >
              <PencilIcon />
            </Button>
            <Button
              variant='outline'
              size='icon-lg'
              aria-label={content.entryRow.continueLabel}
              title={hasActiveTimer ? content.entryRow.stopRunningFirst : content.entryRow.continue}
              disabled={hasActiveTimer || isPlayPending}
              className='text-deep-teal dark:text-electric-green rounded-full'
              onClick={handlePlayClick}
            >
              <PlayIcon className='translate-x-px fill-current' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={content.entryRow.deleteLabel}
              title={content.entryRow.delete}
              className='text-destructive hover:text-destructive'
              onClick={handleDeleteClick}
            >
              <Trash2Icon />
            </Button>
          </>
        ) : null}
      </div>
    </li>
  );
}

function EntryBadge({ label, variant }: EntryBadgeProps) {
  return <Badge variant={variant}>{label}</Badge>;
}

const LOCKED_STATUS_BADGES: Record<TrackerStatus, EntryBadgeProps> = {
  new: { label: content.entryRow.status.new, variant: 'info' },
  approved: { label: content.entryRow.status.approved, variant: 'success' },
  rejected: { label: content.entryRow.status.rejected, variant: 'destructive' }
};

interface EntryBadgeProps {
  label: string;
  variant: 'brand' | 'warning' | 'info' | 'success' | 'destructive';
}

interface TrackerEntryRowProps {
  tracker: Tracker;
  projectName: string;
  now: Date;
  hasActiveTimer: boolean;
  isPlayPending: boolean;
  onEdit: (tracker: Tracker) => void;
  onDelete: (tracker: Tracker) => void;
  onPlay: (tracker: Tracker) => void;
}
