// Aktif tema. Görsel tarzı değiştirmek için sadece bu satırı değiştir.
import { icon } from './icons';
import { pinkRoomTheme } from './pinkRoom';
import type { Art, Theme } from './types';

export const theme: Theme = pinkRoomTheme;

const missing: Art = icon('question');
export function artOf(group: Record<string, Art>, key: string): Art {
  return group[key] ?? missing;
}
