// Oyunun ortak tipleri. İçerik (content/) ve tema (theme/) bu tiplere uyar.

export type NeedId = 'food' | 'energy' | 'joy';
export type Mood = 'happy' | 'idle' | 'hungry' | 'sleepy' | 'bored' | 'sleeping';
export type TabId = 'room' | 'campus' | 'together';

/** Bir şeyin nasıl açıldığı. Açılma DURUMU kayıtta tutulur, kural içerikte. */
export type UnlockRule =
  | { type: 'start' }
  | { type: 'stars'; cost: number }
  | { type: "event"; event: string; hint: string };

export interface Food {
  id: string;
  name: string;
  food: number;
  joy?: number;
  favorite?: boolean;
  line?: string; // yerken söylediği özel replik
}

/** Yolculuk haritasındaki bir durak (içerik: content/journey.ts). */
export interface Stop {
  id: string;
  title: string;
  date?: string;
  text: string;
  /** images/pelo içindeki durak klasörü numarası (fotoğraf, başlık, yapboz oradan) */
  folder?: number;
  /** images/pelo içindeki fotoğrafların adları (klasör yoksa) */
  photos: string[];
  /** null: görev yok; aksi halde src/games/index.ts içindeki oyunun adı */
  task: string | null;
  /** Oyunlarda (kazı kazan, yapboz) kullanılacak fotoğraf; yoksa photos'taki ilk fotoğraf */
  gamePhoto?: string;
  /** Yapbozda kullanılacak fotoğraf (yoksa gamePhoto, o da yoksa ilk fotoğraf) */
  puzzlePhoto?: string;
  /** Yapboz kare kırpmasının odak noktası: x, y 0–1 arası (0,0 sol üst; 0.5,0.5 orta) */
  puzzleCrop?: { x: number; y: number };
  /** Zıplama oyununun teması (ör. 'kampus', 'tatil'); src/games/runner.js → THEMES */
  runnerTheme?: string;
}

export type Who = 'pelin' | 'partner';

export type PieceSlot = 'top' | 'bottom' | 'dress' | 'shoes';

/** Bir kombin: parça id'leri (ör. top: '4c') + isteğe bağlı renkler + aksesuarlar. */
export interface Look {
  top?: string;
  bottom?: string;
  dress?: string;
  shoes?: string;
  acc?: string[];
  colors?: Partial<Record<PieceSlot, string>>;
}

/** Hazır kombin (gardıropta “Hazır” sekmesi). */
export interface Outfit {
  id: string;
  who: Who;
  name: string;
  look: Look;
  unlock: UnlockRule;
}

export type CollectionId = 'outfits';

export interface SaveState {
  version: number;
  createdAt: number;
  needs: Record<NeedId, number>;
  lastTick: number;
  sleepingSince: number | null;
  stars: number;
  /** Kalp sayacı: oyunlarda toplanan kalpler (ör. zıplama) */
  hearts: number;
  unlocked: Record<CollectionId, string[]>;
  /** Yolculuk: kaç durak tamamlandı (sıradaki durak = stops[done]) */
  journey: { done: number };
  /** Balık tutmada yakalananlar: balık id → adet (ileride akvaryum için) */
  fish: Record<string, number>;
  /** Odadaki vazoda duran buket (o gün verildiyse) */
  bouquet: { id: string; day: string } | null;
  /** Şişedeki mektuplardan sıradakinin numarası */
  bottleNote: number;
  /** kim → şu an giydiği kombin */
  look: Record<Who, Look>;
  /** olay adı → ilk gerçekleşme zamanı */
  events: Record<string, number>;
  /** eylem adı → son yapılma zamanı (bekleme süreleri için) */
  lastDone: Record<string, number>;
  /** günlük sayaçlar: "YYYY-MM-DD:anahtar" → adet */
  daily: Record<string, number>;
  notesSeen: string[];
  seenIntro: boolean;
  settings: { sound: boolean };
}
