// Yolculuk haritasının arka planı: Vincent van Gogh tabloları, AŞAĞIDAN YUKARIYA sırayla.
// Görselleri images/vangogh/ klasörüne koy (jpg/png/webp); npm run dev / build onları hazırlar.
//
//   file   images/vangogh içindeki dosyanın adı (uzantısız)
//   share  haritanın ne kadarını kaplasın (oranlar toplamı 1 olmalı; değilse kendiliğinden ölçeklenir)
//   color  tablo yüklenene kadar görünen baskın renk
//   veil   üstteki açık katmanın opaklığı (0–1): yol ve yazılar okunsun diye; gece tablosunda daha hafif
//   focus  tablonun hangi kısmı görünsün (CSS object-position, ör. '70% 50%' → sağa yakın)
//
// Tablo eklemek/çıkarmak için bu listeye satır ekle/sil.
export interface Painting {
  file: string;
  name: string;
  share: number;
  color: string;
  veil: number;
  focus?: string;
}

export const paintings: Painting[] = [
  // En alt: Başlangıç
  { file: 'almond-blossom', name: 'Badem Çiçekleri', share: 0.27, color: '#7fb3b5', veil: 0.38, focus: '50% 50%' },
  { file: 'wheatfield-cypresses', name: 'Selviler ve Buğday Tarlası', share: 0.25, color: '#c9b860', veil: 0.38, focus: '72% 50%' },
  { file: 'wheatfield-crows', name: 'Kargalı Buğday Tarlası', share: 0.22, color: '#c9a43c', veil: 0.34, focus: '50% 50%' },
  // En üst: Doğum günü durağı
  { file: 'starry-night', name: 'Yıldızlı Gece', share: 0.26, color: '#2b4a7d', veil: 0.12, focus: '45% 40%' },
];

/** Tablo görselleri: src/assets/vangogh/<file>.webp (yoksa sadece renk görünür) */
const urls = import.meta.glob('../assets/vangogh/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const paintingUrl = (file: string): string | undefined => urls[`../assets/vangogh/${file}.webp`];
