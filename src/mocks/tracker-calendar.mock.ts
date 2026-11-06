export const DAILY_NORM_MINUTES = 5 * 60;

export const MOCK_TRACKER_SUMMARY: TrackerSummary = {
  todayMinutes: 3 * 60 + 20,
  weekMinutes: 21 * 60 + 45,
  weekNormMinutes: 25 * 60,
  monthMinutes: 74 * 60 + 30,
  monthNormMinutes: 110 * 60
};

export interface TrackerSummary {
  todayMinutes: number;
  weekMinutes: number;
  weekNormMinutes: number;
  monthMinutes: number;
  monthNormMinutes: number;
}
