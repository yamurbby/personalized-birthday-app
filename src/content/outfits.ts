import type { Outfit } from '../core/types';
import { config } from './config';

// Hazır kombinler (Gardırop → Hazır). Her kişinin ilk 'start' kombini başlangıçta giyilir.
// Parça id'leri: 'top-4c' dosyası → top: '4c'. Katalog: docs/AVATAR.md
// colors: o parçayı boyar (beyaz parçalarda en iyi sonuç).
export const outfits: Outfit[] = [
  {
    id: 'p_casual', who: 'pelin', name: 'Günlük',
    look: { top: '1c', bottom: '1c', shoes: '2', colors: { top: '#ffc4d2' } }, // pembe tişört + kot
    unlock: { type: 'start' },
  },
  {
    id: 'p_coat', who: 'pelin', name: 'Nöbet forması',
    look: { top: '1', bottom: '1', shoes: '3', acc: ['stethoscope'], colors: { top: '#9fdcd0', bottom: '#9fdcd0' } },
    unlock: { type: 'stars', cost: 12 },
  },
  {
    id: 'p_pajama', who: 'pelin', name: 'Pijama',
    look: { top: '11', bottom: '1', colors: { top: '#d8c8f5', bottom: '#d8c8f5' } },
    unlock: { type: 'event', event: 'good_nap', hint: '20 dk’dan uzun uyuyunca açılır' },
  },
  {
    id: 'p_party', who: 'pelin', name: 'Doğum günü',
    look: { top: '4c', bottom: '7c', shoes: '3c', acc: ['partyhat'] }, // bordo kombin (girişteki pasta sahnesinde de bu)
    unlock: { type: 'event', event: 'intro_done', hint: 'Girişte açılır' },
  },

  {
    id: 'b_casual', who: 'partner', name: 'Günlük',
    look: { dress: '6c', shoes: '3' },
    unlock: { type: 'start' },
  },
  {
    id: 'b_party', who: 'partner', name: 'Parti elbisesi',
    look: { dress: '1c', shoes: '3', acc: ['partyhat'] },
    unlock: { type: 'event', event: 'intro_done', hint: 'Girişte açılır' },
  },
];

export const whoNames = { pelin: config.pelinName, partner: config.partnerName } as const;

/** Aksesuarlar: hangi hazır kombin açılınca kullanılabilir olduklarını belirtir. */
export const accessories = [
  { id: 'stethoscope', name: 'Steteskop', layer: 'body' as const, requires: ['p_coat'] },
  { id: 'partyhat', name: 'Parti şapkası', layer: 'head' as const, requires: ['p_party', 'b_party'] },
];

/** Gardıroptaki renk paleti (null = parçanın kendi rengi) */
export const palette: (string | null)[] = [
  null, '#ffc4d2', '#f49ab0', '#9c3a4f', '#ffcfa8', '#ffe08a', '#9fdcd0', '#a9d4ec',
  '#7f9fd0', '#d8c8f5', '#b9a6e8', '#f3e6d3', '#c9c9d1', '#4a4a55',
];
