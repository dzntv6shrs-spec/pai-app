export interface Profile {
  age: number;
  sex: 'male' | 'female';
  resting_hr: number;
}

export interface WorkoutEntry {
  duration_minutes: number;
  avg_hr: number;
}

export interface DayData {
  steps: number;
  active_calories: number;
  workouts: WorkoutEntry[];
  sleep_hours: number;
  stand_hours: number;
}

function getMaxHR(age: number, sex: 'male' | 'female'): number {
  if (sex === 'female') return 206 - 0.88 * age;
  return 208 - 0.7 * age;
}

function getHRReserve(profile: Profile): number {
  const maxHR = getMaxHR(profile.age, profile.sex);
  return Math.max(maxHR - profile.resting_hr, 1);
}

// Tages-Maximum, damit ein einzelner Tag nicht das ganze Wochenziel füllt
const DAILY_CAP = 30;

function paiPerMinute(avgHR: number, profile: Profile): number {
  const hrReserve = getHRReserve(profile);
  const hrPercent = (avgHR - profile.resting_hr) / hrReserve;

  // An WHO-Empfehlung kalibriert: ~150 Min moderat oder ~75 Min intensiv ≈ 100 PAI/Woche
  // Nur Herzfrequenz über 50% der Herzfrequenzreserve zählt
  if (hrPercent >= 0.9) return 1.5;
  if (hrPercent >= 0.8) return 1.3;
  if (hrPercent >= 0.7) return 0.8;
  if (hrPercent >= 0.6) return 0.5;
  if (hrPercent >= 0.5) return 0.25;
  return 0;
}

export interface PAIBreakdown {
  workout: number;
  steps: number;
  sleep: number;
  total: number;
}

// Liefert die Punkte für einen Tag.
// WICHTIG: Punkte gibt es ausschließlich fürs Training – basierend auf der
// Herzfrequenz-Intensität. Schritte, Kalorien, Schlaf usw. geben KEINE Punkte
// (sie dienen nur der Übersicht).
export function calculatePAIBreakdown(data: DayData, profile: Profile): PAIBreakdown {
  let workout = 0;
  for (const w of data.workouts) {
    const minutes = Math.min(w.duration_minutes, 180); // max 3h pro Einheit
    if (w.avg_hr > profile.resting_hr && minutes > 0) {
      workout += paiPerMinute(w.avg_hr, profile) * minutes;
    }
  }

  const total = Math.min(workout, DAILY_CAP);

  return {
    workout: Math.round(total),
    steps: 0, // keine Punkte mehr
    sleep: 0, // keine Punkte mehr
    total: Math.round(total),
  };
}

export function calculateDayPAI(data: DayData, profile: Profile): number {
  return calculatePAIBreakdown(data, profile).total;
}

export function getHRZone(avgHR: number, profile: Profile): string {
  const hrReserve = getHRReserve(profile);
  const hrPercent = (avgHR - profile.resting_hr) / hrReserve;

  if (hrPercent >= 0.9) return 'Maximal';
  if (hrPercent >= 0.8) return 'Hart';
  if (hrPercent >= 0.7) return 'Moderat-Hart';
  if (hrPercent >= 0.6) return 'Moderat';
  if (hrPercent >= 0.5) return 'Leicht';
  return 'Sehr leicht';
}

export function getMaxHRForProfile(profile: Profile): number {
  return Math.round(getMaxHR(profile.age, profile.sex));
}
