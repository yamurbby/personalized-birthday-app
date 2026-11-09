export const HOUR = 3600_000;
export const now = () => Date.now();
export function dayKey(t = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** "MM-DD" biçimli tarih bugün mü? */
export function isToday(mmdd: string, t = Date.now()) {
  return dayKey(t).slice(5) === mmdd;
}
export function formatWait(ms: number) {
  const m = Math.ceil(ms / 60000);
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} sa ${r} dk` : `${h} sa`;
}
