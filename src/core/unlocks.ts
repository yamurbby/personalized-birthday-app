import { outfits } from '../content/outfits';
import type { CollectionId, SaveState, UnlockRule } from './types';

interface Unlockable { id: string; unlock: UnlockRule; }

export const collections: Record<CollectionId, Unlockable[]> = { outfits };

export function isUnlocked(s: SaveState, c: CollectionId, id: string) {
  return s.unlocked[c].includes(id);
}

export function findEntry(c: CollectionId, id: string) {
  return collections[c].find((e) => e.id === id);
}

/** Satın alınamayan kurallar (start/event) koşul sağlanınca kendiliğinden açılır.
 *  Yeni açılanları döndürür (bildirim göstermek için). */
export function syncUnlocks(s: SaveState): { c: CollectionId; id: string }[] {
  const opened: { c: CollectionId; id: string }[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of Object.keys(collections) as CollectionId[]) {
      for (const e of collections[c]) {
        if (isUnlocked(s, c, e.id)) continue;
        if (autoConditionMet(s, c, e)) {
          s.unlocked[c].push(e.id);
          opened.push({ c, id: e.id });
          changed = true;
        }
      }
    }
  }
  return opened;
}

function autoConditionMet(s: SaveState, _c: CollectionId, e: Unlockable): boolean {
  const r = e.unlock;
  switch (r.type) {
    case 'start': return true;
    case 'event': return r.event in s.events;
    default: return false;
  }
}

export function costOf(r: UnlockRule): { currency: 'stars'; cost: number } | null {
  if (r.type === 'stars') return { currency: 'stars', cost: r.cost };
  return null;
}
