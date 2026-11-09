import { balance } from './balance';
import { outfits } from '../content/outfits';
import type { Look, SaveState, Who } from './types';
import { dayKey } from './time';

const KEY = 'pelin-mola-save';
export const SAVE_VERSION = 2;

/** Hazır kombinin kopyası (kayıttaki kombin içerikten bağımsız değişebilsin diye) */
export function presetLook(id: string): Look | undefined {
  const o = outfits.find((x) => x.id === id);
  return o ? structuredClone(o.look) : undefined;
}

export function defaultLooks(): Record<Who, Look> {
  const pick = (who: Who) => structuredClone(outfits.find((o) => o.who === who && o.unlock.type === 'start')?.look ?? {});
  return { pelin: pick('pelin'), partner: pick('partner') };
}

export function freshState(t = Date.now()): SaveState {
  return {
    version: SAVE_VERSION,
    createdAt: t,
    needs: { ...balance.needs.start },
    lastTick: t,
    sleepingSince: null,
    stars: balance.startCurrency.stars,
    hearts: 0,
    unlocked: { outfits: [] },
    journey: { done: 0 },
    fish: {},
    bottleNote: 0,
    bouquet: null,
    look: defaultLooks(),
    events: {},
    lastDone: {},
    daily: {},
    notesSeen: [],
    seenIntro: false,
    settings: { sound: true },
  };
}

/** Eski kayıtları yeni sürüme taşır. Kayda alan eklerken buraya bir adım ekle. */
function migrate(raw: any): SaveState {
  const base = freshState(raw?.createdAt ?? Date.now());
  const s: SaveState = {
    ...base,
    ...raw,
    needs: { ...base.needs, ...raw?.needs },
    unlocked: { ...base.unlocked, ...raw?.unlocked },
    look: { ...base.look, ...raw?.look },
    journey: { ...base.journey, ...raw?.journey },
    fish: { ...raw?.fish },
    settings: { ...base.settings, ...raw?.settings },
  };
  // Eski kayıt: kıyafet id'si tutuyordu → o hazır kombinin parçalarına çevir
  if (raw?.outfit && !raw?.look) {
    for (const who of ['pelin', 'partner'] as Who[]) {
      const l = presetLook(raw.outfit[who]);
      if (l) s.look[who] = l;
    }
  }
  delete (s as any).outfit;
  // Kaldırılan özellikler: oda süsleri, Anatomi Eşleştirme ve Nöbet Çantası (skorlar ve olaylar)
  delete (s as any).room;
  delete (s as any).bestScores;
  delete (s.unlocked as any).items;
  // Kaldırılan: kahve molası ve film gecesi
  delete (s.unlocked as any).movies;
  delete s.lastDone.coffee;
  delete s.lastDone.movie;
  s.events = Object.fromEntries(Object.entries(s.events ?? {}).filter(([k]) => !/^(anatomy|bag|coffee|movie)_/.test(k)));
  // v2: anılar artık Kampüs haritasındaki duraklarla açılıyor; eski anı kilitleri gitti
  delete (s.unlocked as any).memories;
  // if (s.version < 3) { ... }
  s.version = SAVE_VERSION;
  // Sadece bugünün günlük sayaçlarını tut
  const today = dayKey();
  s.daily = Object.fromEntries(Object.entries(s.daily ?? {}).filter(([k]) => k.startsWith(today)));
  return s;
}

export function loadState(): SaveState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn('Kayıt okunamadı, yeni başlıyoruz', e);
  }
  return freshState();
}

export function saveState(s: SaveState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    console.warn('Kayıt yazılamadı', e);
  }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* yok say */ }
}

/** Tarayıcıdan kaydı silmemesini ister (destekleniyorsa). */
export function requestPersistence() {
  try { navigator.storage?.persist?.(); } catch { /* yok say */ }
}
