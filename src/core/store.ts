// Oyunun tek durum kaynağı + tüm eylemler. UI sadece buradaki fonksiyonları çağırır.
import { useEffect, useState } from 'preact/hooks';
import { balance } from './balance';
import { toast } from './events';
import { addNeed, applyTime } from './needs';
import { clearSave, freshState, loadState, requestPersistence, saveState } from './save';
import { setSoundEnabled, sfx } from './sfx';
import { dayKey } from './time';
import type { CollectionId, Look, SaveState, Who } from './types';
import { costOf, findEntry, isUnlocked, syncUnlocks } from './unlocks';
import { foods } from '../content/foods';
import { notes } from '../content/notes';
import { stops } from '../content/journey';
import { bottleNotes } from '../content/bottle-notes';
import { accessories, outfits } from '../content/outfits';

let state: SaveState = loadState();
const listeners = new Set<() => void>();

const names: Record<CollectionId, (id: string) => string> = {
  outfits: (id) => outfits.find((o) => o.id === id)?.name ?? id,
};
const collectionLabel: Record<CollectionId, string> = {
  outfits: 'Yeni kıyafet',
};

function update(fn: (s: SaveState) => void) {
  const next = structuredClone(state);
  applyTime(next, Date.now());
  fn(next);
  for (const o of syncUnlocks(next)) {
    // Baştan açık olanlar ve giriş sahnesi bitmeden açılanlar sessiz açılır
    if (findEntry(o.c, o.id)?.unlock.type === 'start' || !next.seenIntro) continue;
    toast(`${collectionLabel[o.c]} açıldı: ${names[o.c](o.id)}`, 'unlock');
  }
  state = next;
  saveState(state);
  listeners.forEach((l) => l());
}

export function getState() { return state; }

export function useGame(): SaveState {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return state;
}

// ---- yardımcılar ----
function bumpDaily(s: SaveState, key: string) {
  const k = `${dayKey()}:${key}`;
  s.daily[k] = (s.daily[k] ?? 0) + 1;
  return s.daily[k];
}
function dailyCount(s: SaveState, key: string) {
  return s.daily[`${dayKey()}:${key}`] ?? 0;
}
function careStar(s: SaveState) {
  if (dailyCount(s, 'careStars') < balance.care.dailyCareStarCap) {
    bumpDaily(s, 'careStars');
    s.stars += balance.care.starsPerCare;
    toast(`+${balance.care.starsPerCare}`, 'reward', 'star');
  }
}
function markEventIn(s: SaveState, event: string) {
  if (!(event in s.events)) s.events[event] = Date.now();
}

// ---- eylemler ----
export const actions = {
  init() {
    setSoundEnabled(state.settings.sound);
    requestPersistence();
    update(() => {});
  },

  tick() { update(() => {}); },

  finishIntro() {
    update((s) => { s.seenIntro = true; markEventIn(s, 'intro_done'); });
  },

  feed(foodId: string): string | null {
    const f = foods.find((x) => x.id === foodId);
    if (!f) return null;
    update((s) => {
      if (s.sleepingSince) return;
      addNeed(s, 'food', f.food);
      if (f.joy) addNeed(s, 'joy', f.joy);
      bumpDaily(s, 'feed');
      if (f.favorite) markEventIn(s, 'fed_favorite');
      careStar(s);
    });
    sfx('pop');
    return f.line ?? null;
  },

  pet() {
    update((s) => {
      if (s.sleepingSince) return;
      addNeed(s, 'joy', balance.care.petJoy);
      if (bumpDaily(s, 'pet') <= 3) careStar(s);
    });
    sfx('pop');
  },

  /** Neşelendir → Çiçek ver: mutluluk, (günlük sınırlı) yıldız; buket o gün vazoda durur */
  giveFlowers(id: string) {
    update((s) => {
      addNeed(s, 'joy', balance.care.flowerJoy);
      if (bumpDaily(s, 'flowers') <= 2) careStar(s);
      s.bouquet = { id, day: dayKey() };
    });
    sfx('success');
  },

  music() {
    update((s) => {
      addNeed(s, 'joy', balance.care.musicJoy);
      if (bumpDaily(s, 'music') <= 2) careStar(s);
    });
  },

  /** Günlük sınırlı sürpriz not. Bittiyse null. */
  drawNote(): string | null {
    if (dailyCount(state, 'note') >= balance.care.notesPerDay) return null;
    const unseen = notes.filter((n) => !state.notesSeen.includes(n));
    const pool = unseen.length ? unseen : notes;
    const note = pool[Math.floor(Math.random() * pool.length)];
    update((s) => {
      bumpDaily(s, 'note');
      s.notesSeen = unseen.length ? [...s.notesSeen, note] : [note];
      addNeed(s, 'joy', balance.care.noteJoy);
      careStar(s);
    });
    sfx('coin');
    return note;
  },
  notesLeftToday() {
    return Math.max(0, balance.care.notesPerDay - dailyCount(state, 'note'));
  },

  sleep() {
    update((s) => { s.sleepingSince = Date.now(); });
    sfx('whoosh');
  },
  wake() {
    update((s) => {
      if (s.sleepingSince && Date.now() - s.sleepingSince > 20 * 60_000) markEventIn(s, 'good_nap');
      s.sleepingSince = null;
    });
    sfx('pop');
  },

  /** Gardıroptan kaydedilen kombin. Günün ilk kaydı küçük bir ödül verir. */
  saveLook(who: Who, look: Look) {
    let rewarded = false;
    update((s) => {
      s.look[who] = structuredClone(look);
      markEventIn(s, 'dressup_done');
      if (bumpDaily(s, 'dressup') === 1) {
        s.stars += balance.dressup.dailyStars;
        addNeed(s, 'joy', balance.dressup.joy);
        rewarded = true;
      }
    });
    sfx('success');
    if (rewarded) {
      toast(`Çok yakıştı! +${balance.dressup.dailyStars}`, 'reward', 'star');
    }
  },

  /** Bir aksesuar kullanılabilir mi (bağlı hazır kombin açılmış mı)? */
  accessoryOpen(accId: string, s = state) {
    const a = accessories.find((x) => x.id === accId);
    return !!a && a.requires.some((id) => isUnlocked(s, 'outfits', id));
  },

  /** Yıldızla açılan şeyleri satın al. */
  buy(c: CollectionId, id: string): boolean {
    const e = findEntry(c, id);
    const cost = e && costOf(e.unlock);
    if (!e || !cost || isUnlocked(state, c, id)) return false;
    if (state[cost.currency] < cost.cost) {
      sfx('fail');
      toast('Biraz daha yıldız lazım', 'info', 'star');
      return false;
    }
    update((s) => {
      s[cost.currency] -= cost.cost;
      s.unlocked[c].push(id);
    });
    sfx('success');
    toast(`${collectionLabel[c]} açıldı: ${names[c](id)}`, 'unlock');
    return true;
  },

  /** Haritada sıradaki durağı tamamla (görev bitti / anı açıldı). Sadece sıradaki durak tamamlanabilir. */
  completeStop(index: number) {
    if (index !== state.journey.done || index >= stops.length) return;
    update((s) => { s.journey.done = index + 1; });
    sfx(index === stops.length - 1 ? 'success' : 'coin');
  },

  markEvent(event: string) {
    if (event in state.events) return;
    update((s) => markEventIn(s, event));
  },

  toggleSound() {
    update((s) => { s.settings.sound = !s.settings.sound; });
    setSoundEnabled(state.settings.sound);
  },

  resetAll() {
    clearSave();
    state = freshState();
    update(() => {});
  },

  /** Sadece geliştirme: hızlı test için para ekle. */
  devGrant() {
    update((s) => { s.stars += 50; });
  },

  /** Mini oyun ödülü: yıldız ekler (ör. zıplamada toplanan kalpler) */
  grantStars(n: number, silent = false) {
    if (n <= 0) return;
    update((s) => { s.stars += n; });
    if (!silent) toast(`+${n}`, 'reward', 'star');
  },

  /** Oyunlarda toplanan kalpler üst bardaki kalp sayacına eklenir */
  grantHearts(n: number) {
    if (n <= 0) return;
    update((s) => { s.hearts += n; });
  },

  /** Balık tutma: yakalananı koleksiyona ekle */
  addFish(id: string) {
    update((s) => { s.fish[id] = (s.fish[id] ?? 0) + 1; });
  },

  /** Şişedeki mektuplardan sıradakini verir (liste bitince baştan) */
  nextBottleNote(): string {
    const i = state.bottleNote % Math.max(1, bottleNotes.length);
    update((s) => { s.bottleNote = i + 1; });
    return bottleNotes[i] ?? '';
  },

  /** Sadece geliştirme: haritada bir durak ilerle / başa dön. */
  devJourney(done: number) {
    update((s) => { s.journey.done = Math.max(0, Math.min(stops.length, done)); });
  },
};
