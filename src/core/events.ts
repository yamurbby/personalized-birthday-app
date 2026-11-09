// UI'a giden küçük bildirimler (ödül, yeni açılan şey).
export interface ToastMsg { id: number; text: string; kind?: 'reward' | 'unlock' | 'info'; icon?: string; }
type L = (t: ToastMsg) => void;
const listeners = new Set<L>();
let n = 0;

/** icon: theme.icons içindeki ad (ör. 'star', 'lock'); metnin yanında çizilir */
export function toast(text: string, kind: ToastMsg['kind'] = 'info', icon?: string) {
  const msg = { id: ++n, text, kind, icon };
  listeners.forEach((l) => l(msg));
}

export function onToast(l: L) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
