// ─────────────────────────────────────────────────────────────
//  Client-Anbindung an den Cloud-Speicher (/.netlify/functions/sync)
//  Login ist rein additiv: ohne Login laeuft die App wie bisher rein
//  lokal. Beim ersten Login wird der lokale Stand uebernommen, bei
//  bestehendem Profil ohne Datenverlust zusammengefuehrt (Merge).
// ─────────────────────────────────────────────────────────────
import {
  getProfile, saveProfile, getLogs, setLogs,
  getSession, setSession, clearSession,
  type ActivityLog, type ProfileFull,
} from './storage';

const ENDPOINT = '/.netlify/functions/sync';

export type CloudData = { profile?: ProfileFull | null; logs?: ActivityLog[] };
type Action = 'login' | 'save';
type CloudResponse = { ok: boolean; reason?: string; created?: boolean; data?: CloudData };

function gatherLocal(): CloudData {
  return { profile: getProfile(), logs: getLogs() };
}

async function call(action: Action, user: string, pin: string, data?: CloudData): Promise<CloudResponse> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, user, pin, data }),
    });
    return (await res.json()) as CloudResponse;
  } catch {
    return { ok: false, reason: 'network' };
  }
}

// Logs nach Datum vereinigen. Bei gleichem Datum gewinnt die Cloud (geraeteuebergreifende
// Quelle der Wahrheit); lokale-only Tage bleiben erhalten -> kein Datenverlust.
function mergeLogs(local: ActivityLog[], cloud: ActivityLog[]): ActivityLog[] {
  const byDate = new Map<string, ActivityLog>();
  for (const l of local) byDate.set(l.date, l);
  for (const c of cloud) byDate.set(c.date, c);
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// Anmelden / Profil anlegen. Fuehrt lokalen und Cloud-Stand zusammen.
export async function cloudLogin(user: string, pin: string): Promise<CloudResponse> {
  const local = gatherLocal();
  const r = await call('login', user, pin, local);
  if (!r.ok) return r;

  setSession({ user, pin });

  if (r.created) {
    // Neu angelegt: unser lokaler Stand wurde bereits hochgeladen -> nichts weiter noetig.
    return r;
  }

  // Bestehendes Profil: zusammenfuehren, dann gemergten Stand zurueck in die Cloud,
  // damit lokale-only Tage dort gesichert sind.
  const cloud = r.data || {};
  const mergedLogs = mergeLogs(local.logs || [], cloud.logs || []);
  const mergedProfile = cloud.profile || local.profile || null;
  if (mergedProfile) saveProfile(mergedProfile);
  setLogs(mergedLogs);
  await call('save', user, pin, { profile: mergedProfile, logs: mergedLogs });
  return r;
}

// Beim App-Start: mit gespeicherten Zugangsdaten neu laden + zusammenfuehren.
export async function cloudPull(): Promise<CloudResponse> {
  const s = getSession();
  if (!s) return { ok: false, reason: 'nosession' };
  return cloudLogin(s.user, s.pin);
}

// Entprelltes Auto-Save nach lokalen Aenderungen (z.B. nach dem Kurzbefehl-Sync).
let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function cloudAutoSave(): void {
  const s = getSession();
  if (!s) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    call('save', s.user, s.pin, gatherLocal());
  }, 1500);
}

export function cloudLogout(): void {
  clearSession();
}

export { getSession };
