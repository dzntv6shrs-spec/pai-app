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
const SESSION_KEY = 'pai_cloud_session';
const WEEKSTART_KEY = 'pai_week_start';

export type ProfileFull = Profile & { name: string };

// ── Cloud-Session (liegt nur lokal auf dem eigenen Geraet) ──
export type CloudSession = { user: string; pin: string };

export function getSession(): CloudSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(s: CloudSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ── Wochenstart (Tag, an dem der 7-Tage-Zähler neu beginnt) ──
// 0=Sonntag, 1=Montag, … 6=Samstag. Default Montag = bisheriges Verhalten.
export function getWeekStart(): number {
  if (typeof window === 'undefined') return 1;
  const raw = localStorage.getItem(WEEKSTART_KEY);
  if (raw === null) return 1;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= 6 ? n : 1;
}

export function hasWeekStart(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(WEEKSTART_KEY) !== null;
}

export function setWeekStart(day: number): void {
  localStorage.setItem(WEEKSTART_KEY, String(day));
}

// Ersetzt alle Logs (fuer den Cloud-Merge). Wie saveLog: sortiert + auf 90 Tage gekuerzt.
export function setLogs(logs: ActivityLog[]): void {
  const trimmed = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-90);
  localStorage.setItem(LOGS_KEY, JSON.stringify(trimmed));
}

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

// ── Wochen-Fenster (für aktuelle Woche und Vorwochen-Statistik) ──
function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date {
  return new Date(s + 'T12:00:00'); // Mittags = robust gegen Zeitzonen
}

function startOfWeek(ref: Date, weekStart: number): Date {
  const d = new Date(ref);
  d.setHours(12, 0, 0, 0);
  const diff = (d.getDay() - weekStart + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

// Datumsbereich einer Woche. offset 0 = aktuelle Woche, -1 = Vorwoche, …
export function getWeekRange(offset = 0): { start: string; end: string } {
  const start = startOfWeek(new Date(), getWeekStart());
  start.setDate(start.getDate() + offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: dateStr(start), end: dateStr(end) };
}

export function getWeekLogs(offset = 0): ActivityLog[] {
  const { start, end } = getWeekRange(offset);
  return getLogs()
    .filter((l) => l.date >= start && l.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getWeeklyPAI(offset = 0): number {
  return Math.round(getWeekLogs(offset).reduce((sum, l) => sum + l.pai_points, 0));
}

// Wie viele Wochen zurück Daten existieren (>=0). Steuert die Vorwochen-Navigation.
export function getWeeksBack(): number {
  const logs = getLogs();
  if (!logs.length) return 0;
  const ws = getWeekStart();
  const curStart = startOfWeek(new Date(), ws);
  const earlyStart = startOfWeek(parseDate(logs[0].date), ws);
  const diffDays = Math.round((curStart.getTime() - earlyStart.getTime()) / 86400000);
  return Math.max(0, Math.round(diffDays / 7));
}

// Punkte aller gespeicherten Tage mit aktueller Profil-/Punktelogik neu berechnen
// (z. B. nachdem sich die Punkteregel oder das Profil geändert hat).
export function recalcLogs(): void {
  const profile = getProfile();
  if (!profile) return;
  const logs = getLogs();
  let changed = false;
  for (const l of logs) {
    const dayData: DayData = {
      steps: l.steps,
      active_calories: l.active_calories,
      workouts: l.avg_workout_hr && l.exercise_minutes
        ? [{ duration_minutes: l.exercise_minutes, avg_hr: l.avg_workout_hr }]
        : [],
      sleep_hours: l.sleep_hours,
      stand_hours: l.stand_hours,
    };
    const p = calculateDayPAI(dayData, profile);
    if (p !== l.pai_points) { l.pai_points = p; changed = true; }
  }
  if (changed) localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}
