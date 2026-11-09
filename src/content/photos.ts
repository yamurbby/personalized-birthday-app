// Albüm fotoğrafları: scripts/photos.mjs'in images/pelo/ klasöründen ürettiği dosyaları otomatik listeler.
// Dosya adı yazmaya gerek yok; klasöre ekle, npm run dev / build bunları kendisi hazırlar.
const thumbs = import.meta.glob('../assets/pelo/t_*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const fulls = import.meta.glob('../assets/pelo/f_*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export interface Photo {
  /** dosya adı (uzantısız, küçük harf): ör. "img-1234" */
  name: string;
  thumb: string;
  full: string;
}

const nameOf = (path: string, prefix: string) => path.split('/').pop()!.slice(prefix.length).replace(/\.webp$/, '');
const fullByName = Object.fromEntries(Object.entries(fulls).map(([p, url]) => [nameOf(p, 'f_'), url]));

/** Tüm fotoğraflar, dosya adına göre doğal sırada (IMG_2 < IMG_10) */
export const photos: Photo[] = Object.entries(thumbs)
  .map(([p, thumb]) => {
    const name = nameOf(p, 't_');
    return { name, thumb, full: fullByName[name] ?? thumb };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true }));

/** journey.ts'teki `photos` adlarını fotoğrafa çevirir. "IMG_1234.jpg", "IMG_1234" ya da "img-1234" olabilir. */
export function findPhoto(name?: string): Photo | null {
  if (!name) return null;
  const key = name.toLowerCase().replace(/\.[a-z0-9]+$/, '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return photos.find((p) => p.name === key) ?? null;
}

// ---------------------------------------------------------------------------
// Durak klasörleri (images/pelo/1, 2, … "6-makarayız"): scripts/photos.mjs → assets/pelo/folders.json
// ---------------------------------------------------------------------------
interface FolderInfo {
  stop: number;
  /** klasör adında sayıdan sonraki kısım (ör. "makarayız") */
  label: string;
  title: string;
  date: string;
  text: string;
  photos: string[];
  puzzle: string | null;
  cover: string | null;
  crop: { x: number; y: number } | null;
}
const manifests = import.meta.glob('../assets/pelo/folders.json', { eager: true, import: 'default' }) as Record<string, FolderInfo[]>;
const folders: FolderInfo[] = Object.values(manifests)[0] ?? [];

/** Türkçe büyük harfle başlat: "makarayız" → "Makarayız" */
const capital = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);

/**
 * Durağı klasörüyle birleştirir. Klasör varsa: fotoğraflar klasörden (kapak başa), başlık bilgi.txt → klasör adı →
 * journey.ts sırasıyla; tarih/yazı bilgi.txt'te varsa onlar; yapboz fotoğrafı ve kırpma klasörden.
 */
export function withFolder<T extends {
  folder?: number; title: string; date?: string; text: string; photos: string[];
  puzzlePhoto?: string; gamePhoto?: string; puzzleCrop?: { x: number; y: number };
}>(stop: T): T {
  const f = stop.folder != null ? folders.find((x) => x.stop === stop.folder) : undefined;
  if (!f) return stop;
  const photos = f.cover ? [f.cover, ...f.photos.filter((p) => p !== f.cover)] : f.photos;
  return {
    ...stop,
    title: f.title || (f.label ? capital(f.label) : stop.title),
    date: f.date || stop.date,
    text: f.text || stop.text,
    photos: photos.length ? photos : stop.photos,
    puzzlePhoto: f.puzzle ?? stop.puzzlePhoto,
    gamePhoto: f.puzzle ?? stop.gamePhoto, // yapboz.jpg kazı kazanda da kullanılır
    puzzleCrop: f.crop ?? stop.puzzleCrop,
  };
}
