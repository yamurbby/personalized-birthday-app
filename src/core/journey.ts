// Yolculuk haritasının yardımcıları: durak durumu ve oyunlara verilen durak verisi.
import { stops } from '../content/journey';
import { findPhoto, type Photo } from '../content/photos';
import type { SaveState, Stop } from './types';

export type StopStatus = 'open' | 'next' | 'locked';

export function stopStatus(s: SaveState, index: number): StopStatus {
  if (index < s.journey.done) return 'open';
  return index === s.journey.done ? 'next' : 'locked';
}

export const isFinal = (index: number) => index === stops.length - 1;

/** Harita bitti mi (final durağı dahil hepsi tamamlandı mı)? */
export const journeyDone = (s: SaveState) => s.journey.done >= stops.length;

/** Durağın fotoğrafları; adı bulunamayan fotoğraf atlanır (geliştirmede konsola uyarı düşer). */
export function stopPhotos(stop: Stop): Photo[] {
  return stop.photos.flatMap((name) => {
    const p = findPhoto(name);
    if (!p && import.meta.env.DEV) console.warn(`[journey] "${stop.id}" durağında fotoğraf bulunamadı: ${name}`);
    return p ? [p] : [];
  });
}

/** Mini oyunlara verilen durak verisi */
export interface StopData {
  id: string;
  /** haritadaki sıra (0'dan başlar) */
  index: number;
  title: string;
  date?: string;
  text: string;
  /** fotoğraflar: thumb (küçük, ~480px) ve full (büyük, ~1600px) adresleri */
  photos: Photo[];
  /** zıplama oyununun teması (journey.ts → runnerTheme) */
  runnerTheme?: string;
  /** yapboz fotoğrafı ve kırpma odağı (journey.ts → puzzlePhoto, puzzleCrop) */
  puzzlePhoto?: Photo;
  puzzleCrop?: { x: number; y: number };
}

export function stopData(index: number): StopData {
  const stop = stops[index];
  let photos = stopPhotos(stop);
  // gamePhoto verildiyse oyunlar (photos[0] kullananlar) onu görsün
  const game = findPhoto(stop.gamePhoto);
  if (game) photos = [game, ...photos.filter((p) => p.name !== game.name)];
  return {
    id: stop.id, index, title: stop.title, date: stop.date, text: stop.text, photos, runnerTheme: stop.runnerTheme,
    puzzlePhoto: findPhoto(stop.puzzlePhoto) ?? photos[0], puzzleCrop: stop.puzzleCrop,
  };
}
