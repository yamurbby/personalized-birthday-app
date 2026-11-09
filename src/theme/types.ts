import type { Mood } from '../core/types';

/** Bir görselin nasıl çizileceği. */
export type Art =
  | { kind: 'img'; src: string; frames?: number; fps?: number } // frames: yatay sprite şeridi
  | { kind: 'svg'; svg: string; bg?: string } // tek renkli çizgi ikon (theme/icons.ts), renk: CSS --icon
  | { kind: 'emoji'; emoji: string }; // renkli emoji (sadece bilerek seçilen birkaç yerde)

/** Oda resminde dokunulabilir bir eşyanın alanı (oda kutusuna göre yüzde). */
export interface Hotspot { left: number; top: number; width: number; height: number; }

/**
 * Katmanlı karakter. Tüm katmanlar AYNI tuval boyutunda, şeffaf PNG/SVG; üst üste konur.
 * Çizim sırası: hairBack → base → ayakkabı → alt → üst | elbise → gövde aksesuarı → face → hair → baş aksesuarı
 * Kıyafet parçaları kişiye değil temaya aittir (theme.wardrobe), çünkü gövde kalıbı ortak.
 */
export interface CharacterSet {
  /** yükseklik / genişlik (ör. 512×640 → 1.25) */
  aspect: number;
  hairBack?: Art;
  base?: Art;
  /** Ruh hali yüzleri + sahnelere özel ekstra yüzler (ör. wish, blow) */
  faces: Record<Mood, Art> & Partial<Record<string, Art>>;
  hair?: Art;
}

export type Who = 'pelin' | 'partner';

export interface Theme {
  name: string;
  /** Piksel art ise görseller bulanıklaştırılmadan büyütülür. */
  pixelArt: boolean;
  characters: Record<Who, CharacterSet>;
  /** Gardırop parçaları: 'top-4c', 'bottom-7c', 'dress-6', 'shoes-3c', 'acc-partyhat' … */
  wardrobe: Record<string, Art>;
  /** Oda görseli (ör. 3B modelden render). Yoksa düz pastel zemin çizilir. */
  roomBackground?: Art;
  /** Oda görselindeki dokunulabilir eşyalar: yatak → Dinlen, koltuk → Neşelendir */
  roomHotspots?: { bed?: Hotspot; chair?: Hotspot };
  /** Anahtar → görsel. Anahtarlar content/ içindeki id'lerle aynıdır. */
  foods: Record<string, Art>;
  /** Arayüz ikonları: star, food, energy, joy, tab_room… */
  icons: Record<string, Art>;
}
