'use client';

import { useCallback, useEffect, useState } from 'react';
import PAIRing from './components/PAIRing';
import BottomNav from './components/BottomNav';
import {
  getProfile, getWeekLogs, getWeeklyPAI, getSession, recalcLogs,
  type ActivityLog,
} from '@/lib/storage';
import { cloudPull } from '@/lib/cloud';

const GOAL = 100;

function getDayName(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { weekday: 'short' });
}

function fmt(val: number | null | undefined): number {
  return Math.round(val ?? 0);
}

function StatCard({ label, value, icon, points }: { label: string; value: string; icon: string; points?: number }) {
  return (
    <div className="card p-4">
      <div className="flex justify-between items-start">
        <span className="chip text-lg w-9 h-9" style={{ background: 'var(--card-2)' }}>{icon}</span>
        {points !== undefined && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,107,138,0.15)', color: 'var(--accent)' }}>
            +{points} P
          </span>
        )}
      </div>
      <p className="text-lg font-semibold mt-3 leading-tight">{value}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [weeklyPAI, setWeeklyPAI] = useState(0);
  const [name, setName] = useState('');
  const [hasProfile, setHasProfile] = useState(true);

  const loadLocal = useCallback(() => {
    const p = getProfile();
    if (!p) { setHasProfile(false); return; }
    recalcLogs(); // Punkte ggf. mit aktueller Regel neu berechnen
    setHasProfile(true);
    setName(p.name ?? '');
    setLogs(getWeekLogs());
    setWeeklyPAI(getWeeklyPAI());
  }, []);

  useEffect(() => {
    loadLocal();
    if (getSession()) {
      cloudPull().then(() => loadLocal()).catch(() => {});
    }
  }, [loadLocal]);

  const today = logs.at(-1);
  const maxPAI = Math.max(...logs.map((l) => l.pai_points), 1);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  if (!hasProfile) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
        <div className="w-20 h-20 rounded-full grad flex items-center justify-center text-3xl mb-6">◎</div>
        <h1 className="text-2xl font-bold">Willkommen</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Richte zuerst dein Profil ein.</p>
        <a href="/setup" className="mt-8 px-8 py-4 rounded-2xl font-semibold text-white grad">
          Profil einrichten
        </a>
      </main>
    );
  }

  return (
    <main className="pb-28 min-h-screen">
      <div className="px-6 pt-12 pb-2 fade-in">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{greeting()}</p>
        <h1 className="text-2xl font-bold mt-0.5">{name || 'Meine Aktivität'}</h1>
      </div>

      <div className="flex flex-col items-center py-4 fade-in-1">
        <PAIRing current={weeklyPAI} goal={GOAL} />
        <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>Diese Woche · Ziel: {GOAL} Punkte</p>
      </div>

      {today && (
        <div className="px-5 mt-2 fade-in-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
            Heute
          </p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Training" value={`${fmt(today.exercise_minutes)} min`} icon="💪" points={today.pai_points} />
            <StatCard label="Ø-Herzfrequenz" value={today.avg_workout_hr ? `${fmt(today.avg_workout_hr)} bpm` : '—'} icon="❤️" />
            <StatCard label="Schritte" value={fmt(today.steps).toLocaleString('de-DE')} icon="👣" />
            <StatCard label="Kalorien" value={`${fmt(today.active_calories)} kcal`} icon="🔥" />
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
            Punkte gibt es ausschließlich fürs Training (Herzfrequenz × Dauer).
          </p>
        </div>
      )}

      {/* 7-Tage-Balken */}
      {logs.length > 0 && (
        <div className="px-5 mt-6 overflow-hidden fade-in-3">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
            Diese Woche
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
                      background: log.pai_points > 0 ? 'linear-gradient(to top, #ff6b8a, #ff8c69)' : 'var(--card-2)',
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
          <p style={{ color: 'var(--muted)' }} className="text-sm">Noch keine Daten diese Woche.</p>
          <p style={{ color: 'var(--muted)' }} className="text-xs mt-1">
            Der Kurzbefehl synchronisiert deine Daten automatisch.
          </p>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
