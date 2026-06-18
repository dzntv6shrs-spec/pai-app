import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  name: string;
  age: number;
  sex: 'male' | 'female';
  resting_hr: number;
  max_hr: number;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  date: string;
  steps: number;
  active_calories: number;
  exercise_minutes: number;
  avg_workout_hr: number | null;
  sleep_hours: number;
  stand_hours: number;
  pai_points: number;
  created_at: string;
};
