-- In Supabase SQL Editor ausführen

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  age INTEGER NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  resting_hr INTEGER NOT NULL,
  max_hr INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  steps INTEGER DEFAULT 0,
  active_calories INTEGER DEFAULT 0,
  exercise_minutes INTEGER DEFAULT 0,
  avg_workout_hr INTEGER,
  sleep_hours DECIMAL(4,1) DEFAULT 0,
  stand_hours INTEGER DEFAULT 0,
  pai_points DECIMAL(5,1) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security deaktivieren (da kein Login)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
