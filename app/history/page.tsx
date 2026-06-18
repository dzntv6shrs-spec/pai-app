'use client';

import { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';
import { getWeekLogs, getWeeklyPAI, type ActivityLog } from '@/lib/storage';

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

function fmt(val: number | null | undefined): number {
  return Math.round(val ?? 0);
}

export default function History() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [weeklyPAI, setWeeklyPAI] = useState(0);

  useEffect(() => {
    setLogs([...getWeekLogs()].reverse());
    setWeeklyPAI(getWeeklyPAI());
  }, []);

  const pct = Math.min(Math.round((weeklyPAI / 100) * 100), 100);

  return (
    <main className="pb-28 min-h-screen px-5 pt-12" style={{ background: 'var(--bg)' }}>
      <h1 className="text-2xl font-bold">Verlauf</h1>
      <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Diese Woche (Mo–So)</p>

      <div className="mt-5 rounded-2xl p-5 flex justify-between items-center"
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Woche gesamt
          </p>
          <p className="text-4xl font-bold mt-1">
            {weeklyPAI}
            <span className="text-base font-normal ml-1" style={{ color: 'var(--muted)' }}>/ 100 PAI</span>
          </p>
        </div>
        <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm"
          style={{
            background: weeklyPAI >= 100
              ? 'linear-gradient(135deg, #ff6b8a, #ff8c69)'
              : 'rgba(255,107,138,0.15)',
            color: '#ff6b8a',
          }}>
          {weeklyPAI >= 100 ? '✓' : `${pct}%`}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {logs.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: 'var(--muted)' }}>
            Noch keine Daten vorhanden.
          </p>
        )}
        {logs.map((log) => (
          <div key={log.date} className="rounded-2xl p-4" style={{ background: 'var(--card)' }}>
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-3">
                <p className="font-medium text-sm">{formatDate(log.date)}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                  <span>👣 {fmt(log.steps).toLocaleString('de-DE')}</span>
                  <span>🔥 {fmt(log.active_calories)} kcal</span>
                  <span>💪 {fmt(log.exercise_minutes)} min</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold"
                  style={{ color: log.pai_points >= 10 ? '#ff6b8a' : '#f0f0f0' }}>
                  {log.pai_points}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>PAI</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
