'use client';

import { useQuery } from '@tanstack/react-query';

import { mapTrackerRowToTracker, mapTrackersRowsToTrackers, TRACKER_COLUMNS } from '@/lib/api/trackers/mappers';
import type { Tracker } from '@/lib/api/trackers/types';
import { createBrowserClient } from '@/lib/supabase/client';
import type { ApiError } from '@/types/api-error';

export const trackerKeys = {
  all: ['trackers'] as const,
  lists: () => [...trackerKeys.all, 'list'] as const,
  list: () => [...trackerKeys.lists()] as const,
  activeLive: () => [...trackerKeys.all, 'active-live'] as const
};

export async function getTrackers(): Promise<Tracker[]> {
  const supabase = createBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw {
      message: userError.message,
      statusCode: userError.status ?? 401
    } satisfies ApiError;
  }

  if (!userData.user) {
    return [];
  }

  const { data, error, status } = await supabase
    .from('trackers')
    .select(TRACKER_COLUMNS)
    .eq('user_id', userData.user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    throw {
      message: error.message,
      statusCode: status
    } satisfies ApiError;
  }

  return mapTrackersRowsToTrackers(data);
}

export function useTrackers() {
  return useQuery({
    queryKey: trackerKeys.list(),
    queryFn: getTrackers
  });
}

export async function getActiveLiveTracker(): Promise<Tracker | null> {
  const supabase = createBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw {
      message: userError.message,
      statusCode: userError.status ?? 401
    } satisfies ApiError;
  }

  if (!userData.user) {
    return null;
  }

  const { data, error, status } = await supabase
    .from('trackers')
    .select(TRACKER_COLUMNS)
    .eq('user_id', userData.user.id)
    .eq('is_live', true)
    .in('live_status', ['start', 'pause'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw {
      message: error.message,
      statusCode: status
    } satisfies ApiError;
  }

  return data ? mapTrackerRowToTracker(data) : null;
}

export function useActiveLiveTracker() {
  return useQuery({
    queryKey: trackerKeys.activeLive(),
    queryFn: getActiveLiveTracker
  });
}
