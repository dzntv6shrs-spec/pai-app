'use client';

import { useEffect, useState } from 'react';
import BottomNav from '../components/BottomNav';
import {
  getWeekLogs, getWeeklyPAI, getWeekRange, getWeeksBack, recalcLogs,
  type ActivityLog,
} from '@/lib/storage';

const GOAL = 100;

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

function rangeLabel(start: string, end: string) {
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  const sm = s.toLocaleDateString('de-DE', { month: 'short' });
  const em = e.toLocaleDateString('de-DE', { month: 'short' });
  return sm === em
    ? `${s.getDate()}.–${e.getDate()}. ${em}`
    : `${s.getDate()}. ${sm} – ${e.getDate()}. ${em}`;
}

function fmt(val: number | null | undefined): number {
  return Math.round(val ?? 0);
}

export default function Statistik() {
  const [offset, setOffset] = useState(0);
  const [minOffset, setMinOffset] = useState(0);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [weeklyPAI, setWeeklyPAI] = useState(0);
  const [range, setRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  useEffect(() => { recalcLogs(); setMinOffset(-getWeeksBack()); }, []);

  useEffect(() => {
    setLogs([...getWeekLogs(offset)].reverse());
    setWeeklyPAI(getWeeklyPAI(offset));
    setRange(getWeekRange(offset));
  }, [offset]);

  const pct = Math.min(Math.round((weeklyPAI / GOAL) * 100), 100);
  const title = offset === 0 ? 'Diese Woche' : offset === -1 ? 'Letzte Woche' : rangeLabel(range.start, range.end);

  return (
    <main className="pb-28 min-h-screen px-5 pt-12">
      <h1 className="text-2xl font-bold">Statistik</h1>

      {/* Wochen-Navigation */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setOffset((o) => Math.max(o - 1, minOffset))}
          disabled={offset <= minOffset}
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: offset <= minOffset ? '#3a3a4e' : '#f0f0f0' }}
          aria-label="Ältere Woche"
        >‹</button>
        <div className="text-center">
          <p className="font-semibold">{title}</p>
          {range.start && <p className="text-xs" style={{ color: 'var(--muted)' }}>{rangeLabel(range.start, range.end)}</p>}
        </div>
        <button
          onClick={() => setOffset((o) => Math.min(o + 1, 0))}
          disabled={offset >= 0}
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: offset >= 0 ? '#3a3a4e' : '#f0f0f0' }}
          aria-label="Neuere Woche"
        >›</button>
      </div>

      {/* Wochensumme */}
      <div className="mt-5 rounded-2xl p-5 flex justify-between items-center"
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid var(--border)' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Woche gesamt
          </p>
          <p className="text-4xl font-bold mt-1">
            {weeklyPAI}
            <span className="text-base font-normal ml-1" style={{ color: 'var(--muted)' }}>/ {GOAL} Punkte</span>
          </p>
        </div>
        <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm"
          style={{
            background: weeklyPAI >= GOAL ? 'linear-gradient(135deg, #ff6b8a, #ff8c69)' : 'rgba(255,107,138,0.15)',
            color: '#ff6b8a',
          }}>
          {weeklyPAI >= GOAL ? '✓' : `${pct}%`}
        </div>
      </div>

      {/* Tagesliste */}
      <div className="mt-5 flex flex-col gap-3">
        {logs.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: 'var(--muted)' }}>
            Keine Daten in dieser Woche.
          </p>
        )}
        {logs.map((log) => (
          <div key={log.date} className="card p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-3">
                <p className="font-medium text-sm">{formatDate(log.date)}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                  <span>💪 {fmt(log.exercise_minutes)} min</span>
                  <span>❤️ {log.avg_workout_hr ? `${fmt(log.avg_workout_hr)} bpm` : '—'}</span>
                  <span>👣 {fmt(log.steps).toLocaleString('de-DE')}</span>
                  <span>🔥 {fmt(log.active_calories)} kcal</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold" style={{ color: log.pai_points > 0 ? '#ff6b8a' : '#f0f0f0' }}>
                  {log.pai_points}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Punkte</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
