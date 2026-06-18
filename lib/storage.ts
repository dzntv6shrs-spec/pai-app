import { calculateDayPAI, type DayData, type Profile } from './pai';

export type ActivityLog = {
  date: string;
  steps: number;
  active_calories: number;
  exercise_minutes: number;
  avg_workout_hr: number;
  sleep_hours: number;
  stand_hours: number;
  pai_points: number;
};

const PROFILE_KEY = 'pai_profile';
const LOGS_KEY = 'pai_logs';

export function getProfile(): Profile & { name: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveProfile(profile: Profile & { name: string }): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getLogs(): ActivityLog[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOGS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveLog(entry: Omit<ActivityLog, 'pai_points'>): ActivityLog {
  const profile = getProfile();
  const logs = getLogs();

  const dayData: DayData = {
    steps: entry.steps,
    active_calories: entry.active_calories,
    workouts: entry.avg_workout_hr && entry.exercise_minutes
      ? [{ duration_minutes: entry.exercise_minutes, avg_hr: entry.avg_workout_hr }]
      : [],
    sleep_hours: entry.sleep_hours,
    stand_hours: entry.stand_hours,
  };

  const pai_points = profile
    ? calculateDayPAI(dayData, profile)
    : 0;

  const log: ActivityLog = { ...entry, pai_points };

  const existing = logs.findIndex((l) => l.date === entry.date);
  if (existing >= 0) {
    logs[existing] = log;
  } else {
    logs.push(log);
  }

  // Keep only last 90 days
  logs.sort((a, b) => a.date.localeCompare(b.date));
  const trimmed = logs.slice(-90);
  localStorage.setItem(LOGS_KEY, JSON.stringify(trimmed));

  return log;
}

export function getWeekLogs(): ActivityLog[] {
  const logs = getLogs();
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=So, 1=Mo, ..., 6=Sa
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  const mondayStr = monday.toISOString().split('T')[0];
  return logs.filter((l) => l.date >= mondayStr);
}

export function getWeeklyPAI(): number {
  const week = getWeekLogs();
  const total = week.reduce((sum, l) => sum + l.pai_points, 0);
  return Math.round(total);
}
