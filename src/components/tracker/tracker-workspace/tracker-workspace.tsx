'use client';

import { startOfMonth } from 'date-fns';
import { useState, useSyncExternalStore } from 'react';

import { DayEntries } from '@components/tracker/day-entries/day-entries';
import { TrackerCalendar, TrackerCalendarSkeleton } from '@components/tracker/tracker-calendar/tracker-calendar';
import { Skeleton } from '@ui/skeleton';
import { useLiveMinuteNow } from '@/hooks/use-live-minute-now';
import { useTrackers } from '@/lib/api/trackers';
import { isLiveTrackerActive } from '@/lib/live-tracker';
import { sumMinutesByDate, toDateKey } from '@/lib/tracker-days';

export function TrackerWorkspace() {
  const isClient = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);

  if (!isClient) {
    return (
      <div className={WORKSPACE_GRID_CLASS}>
        <TrackerCalendarSkeleton />
        <Skeleton className='h-96 rounded-2xl' />
      </div>
    );
  }

  return <TrackerWorkspaceContent />;
}

function TrackerWorkspaceContent() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const { data: trackers = [], isLoading, error, refetch } = useTrackers();
  const runningStartDate =
    trackers.find((tracker) => isLiveTrackerActive(tracker) && tracker.liveStatus === 'start')?.startLiveDate ?? null;
  const now = useLiveMinuteNow(runningStartDate);
  const minutesByDate = sumMinutesByDate(trackers, now);

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setVisibleMonth(startOfMonth(date));
  }

  function handleRetry() {
    void refetch();
  }

  return (
    <div className={WORKSPACE_GRID_CLASS}>
      <div className='order-2 xl:order-1'>
        <TrackerCalendar
          visibleMonth={visibleMonth}
          onVisibleMonthChange={setVisibleMonth}
          selectedDate={toDateKey(selectedDate)}
          onSelectDate={handleSelectDate}
          minutesByDate={minutesByDate}
          isLoading={isLoading}
        />
      </div>
      <div className='order-1 xl:order-2'>
        <DayEntries
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          trackers={trackers}
          minutesByDate={minutesByDate}
          now={now}
          isLoading={isLoading}
          error={error}
          onRetry={handleRetry}
        />
      </div>
    </div>
  );
}

function subscribeNoop(): () => void {
  return () => undefined;
}

function getClientSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

const WORKSPACE_GRID_CLASS = 'grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]';
