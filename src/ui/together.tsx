// Birlikte sekmesindeki kartların TEK listesi (sırası ekrandaki sıradır).
//
// Yeni kart eklemek için:
//   1. src/ui/screens/ içine ekranını yaz: ({ onClose }) => JSX  (onClose: Birlikte'ye dön)
//   2. Gerekirse ikonunu theme/icons.ts + theme/placeholder.ts → icons içine ekle
//   3. Aşağıdaki `togetherCards` dizisine bir satır ekle.
import type { JSX } from 'preact';
import { journeyDone } from '../core/journey';
import type { SaveState } from '../core/types';
import { stops } from '../content/journey';
import { Album } from './screens/Album';
import { Aquarium } from './screens/Aquarium';
import { Wardrobe } from './screens/Wardrobe';
import { balance } from '../core/balance';
import { Letter } from './screens/Letter';

export interface TogetherCardProps {
  /** Ekranı kapat, Birlikte'ye dön */
  onClose: () => void;
}

export interface TogetherCard {
  id: string;
  name: string;
  /** Kartın alt yazısı; kayda göre değişebilir */
  desc: (s: SaveState) => string;
  /** theme.icons içindeki ikon adı */
  icon: string;
  /** Kartın sağındaki düğme yazısı */
  action?: string;
  /** Kilitliyse kart soluk görünür ve açılmaz */
  locked?: (s: SaveState) => boolean;
  Screen: (p: TogetherCardProps) => JSX.Element;
}

export const togetherCards: TogetherCard[] = [
  {
    id: 'album',
    name: 'Anı albümü',
    desc: (s) => `${Math.min(s.journey.done, stops.length)}/${stops.length} anı açıldı`,
    icon: 'album',
    action: 'Aç',
    Screen: ({ onClose }) => <Album onClose={onClose} />,
  },
  {
    id: 'letter',
    name: 'Doğum günü notu',
    desc: (s) => (journeyDone(s) ? 'Sana yazdığım not 💌' : `💌 Yolculuk'taki son durağa ulaşınca açılır (${Math.min(s.journey.done, stops.length)}/${stops.length})`),
    icon: 'note',
    action: 'Oku',
    locked: (s) => !journeyDone(s),
    Screen: ({ onClose }) => <Letter onClose={onClose} />,
  },
  {
    id: 'dressup',
    name: 'Bizi Giydir',
    desc: () => `Dolabı aç, ikimize kombin yap · günün ilk kombini +${balance.dressup.dailyStars} ⭐`,
    icon: 'wardrobe',
    action: 'Oyna',
    Screen: ({ onClose }) => <Wardrobe onClose={onClose} />,
  },
  {
    id: 'aquarium',
    name: 'Akvaryum',
    desc: (s) => {
      const kinds = Object.values(s.fish ?? {}).filter((n) => n > 0).length;
      const total = Object.values(s.fish ?? {}).reduce((a, n) => a + n, 0);
      return total ? `${total} balık, ${kinds} tür · balık tutmada yakaladıkların` : 'Balık tutmada yakaladıkların burada yüzer';
    },
    icon: 'aquarium',
    action: 'Bak',
    Screen: ({ onClose }) => <Aquarium onClose={onClose} />,
  },
];

export const findTogetherCard = (id: string | null) => togetherCards.find((c) => c.id === id) ?? null;
