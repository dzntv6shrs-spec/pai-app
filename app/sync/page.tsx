'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { saveLog } from '@/lib/storage';
import { cloudAutoSave } from '@/lib/cloud';
import { Suspense } from 'react';

type ReceivedData = {
  date: string;
  steps: number;
  cal: number;
  ex_min: number;
  hr: number;
  sleep: number;
  stand: number;
  pai_points: number;
};

type RawDiag = { hr: string | null; all: [string, string][] };

function SyncInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [data, setData] = useState<ReceivedData | null>(null);
  const [raw, setRaw] = useState<RawDiag | null>(null);

  useEffect(() => {
    // Schlüssel-Prüfung vorübergehend deaktiviert (auf Wunsch), um Reibung beim
    // Einrichten zu vermeiden. SPÄTER wieder aktivieren, sobald jeder Nutzer einen
    // eigenen Speicher + Schlüssel hat (Mehrbenutzer):
    // const key = params.get('key');
    // const expectedKey = process.env.NEXT_PUBLIC_SYNC_KEY;
    // if (expectedKey && key !== expectedKey) { setStatus('error'); return; }

    // ── DIAGNOSE: rohe Werte erfassen, bevor irgendetwas begrenzt wird ──
    const rawHr = params.get('hr');
    const allRaw: [string, string][] = [];
    params.forEach((value, k) => { if (k !== 'key') allRaw.push([k, value]); });
    setRaw({ hr: rawHr, all: allRaw });

    const date = params.get('date') ?? new Date().toISOString().split('T')[0];

    // Werte einlesen und auf realistische Grenzen begrenzen
    const steps = Math.min(Math.round(Number(params.get('steps') ?? 0)), 60000);
    const cal   = Math.min(Math.round(Number(params.get('cal')   ?? 0)), 1000);
    const ex_min= Math.min(Math.round(Number(params.get('ex_min')  ?? 0)), 300);
    const hr    = Math.min(Math.round(Number(params.get('hr')    ?? 0)), 220);
    const sleep = Math.min(Math.round(Number(params.get('sleep') ?? 0) * 10) / 10, 14);
    const stand = Math.min(Math.round(Number(params.get('stand') ?? 0)), 16);

    const log = saveLog({ date, steps, active_calories: cal, exercise_minutes: ex_min, avg_workout_hr: hr, sleep_hours: sleep, stand_hours: stand });
    cloudAutoSave(); // falls angemeldet: neuen Tagesstand in die Cloud sichern

    setData({ date, steps, cal, ex_min, hr, sleep, stand, pai_points: log.pai_points });
    setStatus('success');
    // Hinweis: Auto-Weiterleitung ist während der Diagnose absichtlich deaktiviert.
  }, [params]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10" style={{ background: 'var(--bg)' }}>
      {status === 'loading' && <p style={{ color: 'var(--muted)' }}>Synchronisiere...</p>}
      {status === 'error' && <p className="text-xl">Ungültiger Schlüssel</p>}
      {status === 'success' && data && (
        <div className="w-full max-w-sm fade-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg, #ff6b8a, #ff8c69)' }}>✓</div>
            <h2 className="text-xl font-bold">Synchronisiert</h2>
            <p className="text-3xl font-bold mt-1" style={{ color: '#ff6b8a' }}>+{data.pai_points} Punkte</p>
          </div>

          {/* ── DIAGNOSE-BOX (vorübergehend) ── */}
          {raw && (
            <div className="rounded-2xl p-4 text-sm mb-4" style={{ background: 'var(--card)', border: '1px solid var(--accent)' }}>
              <p className="font-semibold mb-3" style={{ color: 'var(--accent)' }}>🔎 Diagnose (roh empfangen)</p>
              <div className="flex justify-between mb-2">
                <span style={{ color: 'var(--muted)' }}>hr (roh, ungekürzt)</span>
                <span className="font-bold" style={{ color: '#fff' }}>{raw.hr ?? '— (fehlt)'}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span style={{ color: 'var(--muted)' }}>hr (von App verwendet)</span>
                <span className="font-medium">{data.hr} bpm</span>
              </div>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Alle empfangenen Parameter:</p>
              <div className="flex flex-col gap-1" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                {raw.all.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span style={{ color: 'var(--muted)' }}>{k}</span>
                    <span className="text-right break-all">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl p-4 text-sm" style={{ background: 'var(--card)' }}>
            <p className="font-semibold mb-3" style={{ color: 'var(--muted)' }}>Übernommene Werte</p>
            <div className="flex flex-col gap-2">
              {([
                ['Datum', data.date],
                ['Schritte', data.steps.toLocaleString('de-DE')],
                ['Kalorien', `${data.cal} kcal`],
                ['Training', `${data.ex_min} min`],
                ['Herzfrequenz', `${data.hr} bpm`],
                ['Schlaf', `${data.sleep} h`],
                ['Stehstunden', data.stand],
              ] as [string, string | number][]).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => router.push('/')}
            className="mt-5 w-full py-3 rounded-2xl font-semibold text-white grad"
          >
            Weiter zur App
          </button>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--muted)' }}>
            Auto-Weiterleitung ist für die Diagnose pausiert.
          </p>
        </div>
      )}
    </main>
  );
}

export default function SyncPage() {
  return <Suspense><SyncInner /></Suspense>;
}
