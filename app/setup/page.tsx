'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import CloudLogin from '../components/CloudLogin';
import { getProfile, saveProfile } from '@/lib/storage';
import { cloudAutoSave } from '@/lib/cloud';

export default function Setup() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', sex: 'female', resting_hr: '' });

  useEffect(() => {
    const p = getProfile();
    if (p) setForm({ name: p.name ?? '', age: String(p.age), sex: p.sex, resting_hr: String(p.resting_hr) });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile({
      name: form.name,
      age: Number(form.age),
      sex: form.sex as 'male' | 'female',
      resting_hr: Number(form.resting_hr),
    });
    cloudAutoSave(); // falls angemeldet: Profil-Aenderung in die Cloud sichern
    setSaved(true);
    setTimeout(() => { setSaved(false); router.push('/'); }, 1500);
  };

  const inputStyle = {
    background: 'var(--card)',
    color: '#f0f0f0',
    border: '1px solid #2a2a3e',
    borderRadius: 12,
    padding: '14px 16px',
    width: '100%',
    fontSize: 16,
    outline: 'none',
  };

  const labelStyle = {
    color: 'var(--muted)',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: 8,
    display: 'block',
  };

  return (
    <main className="pb-24 min-h-screen px-5 pt-14" style={{ background: 'var(--bg)' }}>
      <div className="fade-in">
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Deine Daten für die PAI-Berechnung
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5 fade-in-1">
        <div>
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="z.B. Lena" />
        </div>

        <div>
          <label style={labelStyle}>Alter</label>
          <input style={inputStyle} type="number" inputMode="numeric" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="z.B. 28" required />
        </div>

        <div>
          <label style={labelStyle}>Geschlecht</label>
          <div className="flex gap-3">
            {[{ v: 'female', l: 'Weiblich' }, { v: 'male', l: 'Männlich' }].map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm({ ...form, sex: v })}
                className="flex-1 py-3 rounded-xl font-medium transition-all"
                style={{
                  background: form.sex === v ? 'linear-gradient(135deg, #ff6b8a, #ff8c69)' : 'var(--card)',
                  color: form.sex === v ? '#fff' : 'var(--muted)',
                  border: 'none',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Ruhepuls (bpm)</label>
          <input style={inputStyle} type="number" inputMode="numeric" value={form.resting_hr} onChange={(e) => setForm({ ...form, resting_hr: e.target.value })} placeholder="z.B. 62" required />
          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
            Morgens messen bevor du aufstehst — oder aus Apple Health ablesen.
          </p>
        </div>

        <button
          type="submit"
          className="mt-2 py-4 rounded-2xl font-semibold text-white transition-all"
          style={{
            background: saved ? '#2a2a3e' : 'linear-gradient(135deg, #ff6b8a, #ff8c69)',
            border: 'none',
            fontSize: 16,
          }}
        >
          {saved ? '✓ Gespeichert' : 'Speichern'}
        </button>
      </form>

      <CloudLogin />

      <BottomNav />
    </main>
  );
}
