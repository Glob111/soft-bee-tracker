import type { CreateTrackerInput, Tracker } from '@/lib/api/trackers/types';
import type { Database } from '@/types';

type TrackerRow = Database['public']['Tables']['trackers']['Row'];
type InputTrackerRow = Database['public']['Tables']['trackers']['Insert'];

export const TRACKER_COLUMNS =
  'id, created_at, updated_at, date, description, duration_minutes, is_live, live_duration_minutes, live_status, status, start_live_date, project_id, user_id, transaction_id';

export function mapTrackerRowToTracker(row: TrackerRow): Tracker {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    date: row.date,
    description: row.description,
    durationMinutes: row.duration_minutes,
    isLive: row.is_live,
    liveDurationMinutes: row.live_duration_minutes,
    liveStatus: row.live_status,
    status: row.status,
    startLiveDate: row.start_live_date,
    projectId: row.project_id,
    userId: row.user_id,
    transactionId: row.transaction_id
  };
}

export function mapTrackersRowsToTrackers(rows: TrackerRow[]): Tracker[] {
  return rows.map(mapTrackerRowToTracker);
}

export function mapCreateTrackerInputToRow(input: CreateTrackerInput): InputTrackerRow {
  return {
    date: input.date,
    description: input.description,
    duration_minutes: input.durationMinutes,
    project_id: input.projectId
  };
}
