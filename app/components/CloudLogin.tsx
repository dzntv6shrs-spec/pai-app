'use client';

import { useEffect, useState } from 'react';
import { cloudLogin, cloudLogout, getSession } from '@/lib/cloud';

const REASON_TEXT: Record<string, string> = {
  pin: 'PIN stimmt nicht. Bei vorhandenem Namen muss die richtige PIN verwendet werden.',
  nouser: 'Bitte einen Namen eingeben.',
  nopin: 'Bitte eine PIN eingeben.',
  network: 'Keine Verbindung. Dein Stand bleibt lokal gespeichert.',
};

export default function CloudLogin() {
  const [user, setUser] = useState('');
  const [pin, setPin] = useState('');
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const s = getSession();
    if (s) setSessionUser(s.user);
  }, []);

  const inputStyle = {
    background: 'var(--card)', color: '#f0f0f0', border: '1px solid #2a2a3e',
    borderRadius: 12, padding: '14px 16px', width: '100%', fontSize: 16, outline: 'none',
  } as const;
  const labelStyle = {
    color: 'var(--muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const,
    letterSpacing: '0.05em', marginBottom: 8, display: 'block',
  } as const;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!user.trim()) { setMsg({ kind: 'err', text: REASON_TEXT.nouser }); return; }
    if (!pin.trim()) { setMsg({ kind: 'err', text: REASON_TEXT.nopin }); return; }
    setBusy(true);
    const r = await cloudLogin(user.trim(), pin.trim());
    setBusy(false);
    if (r.ok) {
      setSessionUser(user.trim());
      setPin('');
      setMsg({ kind: 'ok', text: r.created ? 'Profil angelegt – dein Stand ist jetzt gesichert.' : 'Angemeldet – Stand zusammengeführt und gesichert.' });
    } else {
      setMsg({ kind: 'err', text: REASON_TEXT[r.reason ?? ''] ?? 'Anmeldung fehlgeschlagen.' });
    }
  }

  function handleLogout() {
    cloudLogout();
    setSessionUser(null);
    setMsg({ kind: 'ok', text: 'Abgemeldet. Deine Daten bleiben lokal erhalten.' });
  }

  return (
    <div className="mt-10 pt-8" style={{ borderTop: '1px solid #2a2a3e' }}>
      <h2 className="text-lg font-bold">☁️ Cloud-Lernstand</h2>

      {sessionUser ? (
        <div className="mt-4">
          <div className="rounded-2xl p-4" style={{ background: 'var(--card)' }}>
            <p className="text-sm">Angemeldet als <span className="font-semibold">{sessionUser}</span></p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Dein Stand wird automatisch in der Cloud gesichert und ist geräteübergreifend verfügbar ☁️
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full py-3 rounded-2xl font-medium"
            style={{ background: 'var(--card)', color: 'var(--muted)', border: '1px solid #2a2a3e' }}
          >
            Abmelden
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-4">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Optional. Sichert deinen Stand in der Cloud und macht ihn geräteübergreifend verfügbar.
            Dein bisheriger lokaler Stand bleibt erhalten und wird beim ersten Login übernommen.
          </p>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={user} onChange={(e) => setUser(e.target.value)} placeholder="z.B. lena" autoCapitalize="none" />
          </div>
          <div>
            <label style={labelStyle}>PIN</label>
            <input style={inputStyle} type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="frei wählbar" />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="py-4 rounded-2xl font-semibold text-white"
            style={{ background: busy ? '#2a2a3e' : 'linear-gradient(135deg, #ff6b8a, #ff8c69)', border: 'none', fontSize: 16 }}
          >
            {busy ? 'Anmelden…' : 'Anmelden / Profil anlegen'}
          </button>
        </form>
      )}

      {msg && (
        <p className="text-xs mt-3" style={{ color: msg.kind === 'ok' ? '#7dd1a6' : '#ff8a8a' }}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
