'use client';

import { useEffect, useState } from 'react';
import PAIRing from './components/PAIRing';
import BottomNav from './components/BottomNav';
import { getProfile, getWeekLogs, getWeeklyPAI, type ActivityLog } from '@/lib/storage';
import { calculatePAIBreakdown, type Profile } from '@/lib/pai';

function getDayName(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { weekday: 'short' });
}

function fmt(val: number | null | undefined): number {
  return Math.round(val ?? 0);
}

function fmtSleep(val: number | null | undefined): string {
  const h = Math.round((val ?? 0) * 10) / 10;
  if (!h) return '—';
  return `${h} h`;
}

function StatCard({ label, value, icon, pai }: { label: string; value: string; icon: string; pai?: number }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--card)' }}>
      <div className="flex justify-between items-start">
        <span className="text-xl">{icon}</span>
        {pai !== undefined && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,107,138,0.15)', color: 'var(--accent)' }}>
            +{pai} PAI
          </span>
        )}
      </div>
      <p className="text-lg font-semibold mt-2 leading-tight">{value}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [weeklyPAI, setWeeklyPAI] = useState(0);
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasProfile, setHasProfile] = useState(true);

  useEffect(() => {
    const p = getProfile();
    if (!p) { setHasProfile(false); return; }
    setName(p.name ?? '');
    setProfile(p);
    setLogs(getWeekLogs());
    setWeeklyPAI(getWeeklyPAI());
  }, []);

  const today = logs.at(-1);
  const breakdown = today && profile
    ? calculatePAIBreakdown({
        steps: today.steps,
        active_calories: today.active_calories,
        workouts: today.avg_workout_hr && today.exercise_minutes
          ? [{ duration_minutes: today.exercise_minutes, avg_hr: today.avg_workout_hr }]
          : [],
        sleep_hours: today.sleep_hours,
        stand_hours: today.stand_hours,
      }, profile)
    : null;
  const maxPAI = Math.max(...logs.map(l => l.pai_points), 1);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  if (!hasProfile) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-6"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #ff8c69)' }}>◎</div>
        <h1 className="text-2xl font-bold">Willkommen</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Richte zuerst dein Profil ein.</p>
        <a href="/setup" className="mt-8 px-8 py-4 rounded-2xl font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #ff6b8a, #ff8c69)' }}>
          Profil einrichten
        </a>
      </main>
    );
  }

  return (
    <main className="pb-28 min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="px-6 pt-12 pb-2">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{greeting()}</p>
        <h1 className="text-2xl font-bold mt-0.5">{name || 'Meine Aktivität'}</h1>
      </div>

      <div className="flex flex-col items-center py-4">
        <PAIRing current={weeklyPAI} goal={100} />
        <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>Diese Woche · Ziel: 100 PAI</p>
      </div>

      {today && (
        <div className="px-5 mt-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
            Heute
          </p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Schritte" value={fmt(today.steps).toLocaleString('de-DE')} icon="👣" pai={breakdown?.steps} />
            <StatCard label="Kalorien" value={`${fmt(today.active_calories)} kcal`} icon="🔥" />
            <StatCard label="Training" value={`${fmt(today.exercise_minutes)} min`} icon="💪" pai={breakdown?.workout} />
            <StatCard label="Schlaf" value={fmtSleep(today.sleep_hours)} icon="🌙" pai={breakdown?.sleep} />
          </div>
        </div>
      )}

      {/* 7-Tage Balken — overflow-hidden verhindert Überlauf */}
      {logs.length > 0 && (
        <div className="px-5 mt-6 overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
            Diese Woche (Mo–So)
          </p>
          <div className="flex items-end gap-2" style={{ height: 72 }}>
            {logs.map((log) => {
              const ratio = maxPAI > 0 ? log.pai_points / maxPAI : 0;
              const barH = Math.max(Math.round(ratio * 56), log.pai_points > 0 ? 6 : 3);
              return (
                <div key={log.date} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div
                    className="w-full rounded-t-lg"
                    style={{
                      height: barH,
                      background: log.pai_points > 0
                        ? 'linear-gradient(to top, #ff6b8a, #ff8c69)'
                        : '#1a1a2e',
                      flexShrink: 0,
                    }}
                  />
                  <span className="text-xs truncate w-full text-center" style={{ color: 'var(--muted)', fontSize: 10 }}>
                    {getDayName(log.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {logs.length === 0 && (
        <div className="px-5 mt-6 text-center">
          <p style={{ color: 'var(--muted)' }} className="text-sm">Noch keine Daten.</p>
          <p style={{ color: 'var(--muted)' }} className="text-xs mt-1">
            Der Kurzbefehl synchronisiert deine Daten automatisch.
          </p>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
