'use client';

import { format, isAfter, isSameDay, isToday } from 'date-fns';
import { ClockIcon } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@components/common/confirm-dialog/confirm-dialog';
import { EmptyState } from '@components/common/empty-state/empty-state';
import { ErrorState } from '@components/common/error-state/error-state';
import { ListSkeleton } from '@components/common/loading-state/skeletons';
import { CreateTrackerDialog } from '@components/tracker/create-tracker-dialog/create-tracker-dialog';
import { TrackerEntryRow } from '@components/tracker/day-entries/tracker-entry-row';
import { EditTrackerDialog } from '@components/tracker/edit-tracker-dialog/edit-tracker-dialog';
import { useProjectsOptions } from '@/hooks/use-projects-options';
import { useActiveLiveTracker, useDeleteTracker, useRestartLiveTracker } from '@/lib/api/trackers';
import type { Tracker } from '@/lib/api/trackers';
import { formatClock, formatDuration } from '@/lib/format-duration';
import { getWeekDays, toDateKey } from '@/lib/tracker-days';
import type { ApiError } from '@/types/api-error';
import { formatText } from '@/lib/format-text';
import content from '../content.json';

export function DayEntries({ selectedDate, onSelectDate, trackers, minutesByDate, now, isLoading, error, onRetry }: DayEntriesProps) {
  const [pendingAction, setPendingAction] = useState<PendingEntryAction | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const { projects } = useProjectsOptions(true);
  const { data: activeTracker } = useActiveLiveTracker();
  const restartTracker = useRestartLiveTracker();
  const deleteTracker = useDeleteTracker({ onSuccess: handleDeleted });
  const selectedKey = toDateKey(selectedDate);
  const dayEntries = trackers.filter((tracker) => tracker.date === selectedKey);
  const dayMinutes = minutesByDate.get(selectedKey) ?? 0;
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  function openEntryAction(type: EntryActionType, tracker: Tracker) {
    setPendingAction({ type, tracker, openedAt: Date.now() });
    setIsActionDialogOpen(true);
  }

  function handleEdit(tracker: Tracker) {
    openEntryAction('edit', tracker);
  }

  function handleDelete(tracker: Tracker) {
    openEntryAction('delete', tracker);
  }

  function handlePlay(tracker: Tracker) {
    restartTracker.mutate(tracker);
  }

  function handleDeleteConfirm() {
    if (pendingAction) {
      deleteTracker.mutate(pendingAction.tracker);
    }
  }

  function handleDeleted() {
    setIsActionDialogOpen(false);
  }

  return (
    <section aria-labelledby='day-entries-title' className='bg-card flex flex-col rounded-2xl border shadow-sm'>
      <WeekStrip selectedDate={selectedDate} minutesByDate={minutesByDate} onSelectDate={onSelectDate} />

      <div className='flex items-baseline justify-between gap-3 px-4 pt-4 sm:px-5'>
        <h2 id='day-entries-title' className='text-base font-semibold'>
          {isToday(selectedDate) ? content.dayEntries.today : format(selectedDate, 'EEEE')}
          <span className='text-muted-foreground ml-2 text-sm font-normal'>{format(selectedDate, 'd MMMM yyyy')}</span>
        </h2>
      </div>

      <div className='flex-1 px-2 py-2 sm:px-3'>
        {isLoading ? <ListSkeleton /> : null}
        {!isLoading && error ? <ErrorState error={error} onRetry={onRetry} /> : null}
        {!isLoading && !error && dayEntries.length === 0 ? (
          <EmptyState icon={ClockIcon} title={content.dayEntries.emptyTitle} description={content.dayEntries.emptyDescription} />
        ) : null}
        {!isLoading && !error && dayEntries.length > 0 ? (
          <ul className='divide-border divide-y'>
            {dayEntries.map((tracker) => (
              <TrackerEntryRow
                key={tracker.id}
                tracker={tracker}
                projectName={projectNames.get(tracker.projectId) ?? content.fallbackProjectName}
                now={now}
                hasActiveTimer={Boolean(activeTracker)}
                isPlayPending={restartTracker.isPending}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPlay={handlePlay}
              />
            ))}
          </ul>
        ) : null}
      </div>

      <div className='flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-5'>
        <span className='text-sm'>
          <span className='text-muted-foreground'>{content.dayEntries.total}</span>{' '}
          <span className='font-semibold tabular-nums'>{formatClock(dayMinutes)}</span>
        </span>
        <CreateTrackerDialog defaultDate={selectedKey} isCompact />
      </div>

      {pendingAction?.type === 'edit' ? (
        <EditTrackerDialog
          key={pendingAction.openedAt}
          tracker={pendingAction.tracker}
          open={isActionDialogOpen}
          onOpenChange={setIsActionDialogOpen}
        />
      ) : null}

      {pendingAction?.type === 'delete' ? (
        <ConfirmDialog
          open={isActionDialogOpen}
          onOpenChange={setIsActionDialogOpen}
          title={content.dayEntries.deleteDialog.title}
          description={formatText(content.dayEntries.deleteDialog.description, {
            duration: formatDuration(pendingAction.tracker.durationMinutes),
            project: projectNames.get(pendingAction.tracker.projectId) ?? content.dayEntries.deleteDialog.fallbackProject
          })}
          confirmLabel={content.dayEntries.deleteDialog.confirmButton}
          isDestructive
          isBusy={deleteTracker.isPending}
          onConfirm={handleDeleteConfirm}
        />
      ) : null}
    </section>
  );
}

function WeekStrip({ selectedDate, minutesByDate, onSelectDate }: WeekStripProps) {
  const weekDays = getWeekDays(selectedDate);
  const weekMinutes = weekDays.reduce((sum, day) => sum + (minutesByDate.get(toDateKey(day)) ?? 0), 0);
  const today = new Date();

  return (
    <div className='flex items-stretch gap-1 overflow-x-auto border-b p-2 sm:p-3'>
      <div className='grid flex-1 grid-cols-7 gap-0.5'>
        {weekDays.map((day) => (
          <WeekDayButton
            key={day.toISOString()}
            day={day}
            minutes={minutesByDate.get(toDateKey(day)) ?? 0}
            isSelected={isSameDay(day, selectedDate)}
            isFuture={isAfter(day, today)}
            onSelect={onSelectDate}
          />
        ))}
      </div>
      <div className='flex shrink-0 flex-col items-end justify-center px-2 text-right'>
        <span className='text-muted-foreground text-[11px] font-medium uppercase'>{content.dayEntries.week}</span>
        <span className='text-sm font-semibold tabular-nums'>{formatClock(weekMinutes)}</span>
      </div>
    </div>
  );
}

function WeekDayButton({ day, minutes, isSelected, isFuture, onSelect }: WeekDayButtonProps) {
  function handleClick() {
    onSelect(day);
  }

  return (
    <button
      type='button'
      disabled={isFuture}
      aria-pressed={isSelected}
      aria-label={formatText(content.dayEntries.dayLabel, { day: format(day, 'EEEE d MMMM'), total: formatClock(minutes) })}
      data-selected={isSelected}
      className='hover:bg-muted data-[selected=true]:bg-foreground data-[selected=true]:text-background flex min-w-10 flex-col items-center gap-0.5 rounded-xl px-0.5 py-2 transition-colors disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent'
      onClick={handleClick}
    >
      <span className='text-[11px] font-medium uppercase opacity-70'>{format(day, 'EEE')}</span>
      <span className='text-sm font-semibold tabular-nums'>{formatClock(minutes)}</span>
    </button>
  );
}

type EntryActionType = 'edit' | 'delete';

interface PendingEntryAction {
  type: EntryActionType;
  tracker: Tracker;
  openedAt: number;
}

interface DayEntriesProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  trackers: Tracker[];
  minutesByDate: Map<string, number>;
  now: Date;
  isLoading: boolean;
  error: ApiError | null;
  onRetry: () => void;
}

interface WeekStripProps {
  selectedDate: Date;
  minutesByDate: Map<string, number>;
  onSelectDate: (date: Date) => void;
}

interface WeekDayButtonProps {
  day: Date;
  minutes: number;
  isSelected: boolean;
  isFuture: boolean;
  onSelect: (date: Date) => void;
}
