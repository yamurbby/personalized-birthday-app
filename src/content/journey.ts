import type { Stop } from '../core/types';
import { withFolder } from './photos';

// Yolculuk haritasının durakları. Sıra = haritadaki sıra (ilk durak en altta).
// Son durak her zaman pasta ikonlu final durağıdır; bitince Birlikte'de doğum günü notun açılır.
//
// Alanlar:
//   id      benzersiz kısa ad (kaydı tutar; değiştirirsen o durağın ilerlemesi sıfırlanır)
//   title   anı başlığı
//   date    anının tarihi (serbest metin)
//   text    kısa yazın (satır atlamak için \n)
//   folder  images/pelo içindeki durak klasörü (1, 2, … ; "6-makarayız" gibi adlar da olur). Klasör varsa
//           fotoğraflar oradan gelir; klasör adındaki yazı (ör. "makarayız") ve bilgi.txt başlık/tarih/yazıyı verir.
//           Klasörde "yapboz.jpg" varsa yapbozda o kullanılır; "kapak.jpg" haritadaki yuvarlakta görünür.
//   photos  klasör yoksa: images/pelo içindeki fotoğrafların dosya adı
//   task    null = görev yok, anı doğrudan açılır
//           oyun adı = önce o mini oyun oynanır (oyunlar: src/games/index.ts):
//           scratch, balloons, runner, puzzle, fishing, tower, bigfish, candles
//   runnerTheme  sadece runner için: 'kampus' | 'tatil'
//   gamePhoto    kazı kazanda (ve puzzlePhoto yoksa yapbozda) kullanılacak fotoğraf (yoksa ilk fotoğraf)
//   puzzlePhoto  yapbozda kullanılacak fotoğraf
//   puzzleCrop   yapbozun kare kırpma odağı { x, y } (0–1 arası; 0.5, 0.5 = tam orta, y: 0.2 = üste yakın)
//
// Boş bırakılan tarih ve yazı ekranda görünmez. İstediğin zaman doldurabilirsin.

const list: Stop[] = [
  {
    id: 'tanisma', title: 'Mazi', date: '',
    text: '',
    folder: 1, photos: [],
    task: 'scratch',
  },
  {
    id: 'kafe', title: '...', date: '',
    text: '',
    folder: 2, photos: [],
    task: 'balloons',
  },
  {
    id: 'gulus', title: 'Eskidendi eskiden', date: '',
    text: '',
    folder: 3, photos: [],
    task: 'runner', runnerTheme: 'kampus', // tema: 'kampus' | 'tatil' (src/games/runner.js → THEMES)
  },
  {
    id: 'film', title: 'Küçücüğüm – Yalın', date: '',
    text: '',
    folder: 4, photos: [],
    task: 'puzzle',
    // puzzleCrop: { x: 0.5, y: 0.3 }, // yapboz kırpma odağı (0–1); yazmazsan dikeyde üstten %15 aşağıdan
  },
  {
    id: 'onluk', title: 'Anılar', date: '',
    text: '',
    folder: 5, photos: [],
    task: 'fishing',
  },
  {
    id: 'yolculuk', title: 'Makarayız', date: '',
    text: '',
    folder: 6, photos: [],
    task: 'tower',
  },
  {
    id: 'favori', title: 'My favs <3', date: '',
    text: '',
    folder: 7, photos: [],
    task: 'bigfish',
  },
  {
    id: 'dogumgunu', title: 'Doğum günü', date: '',
    text: '',
    folder: 8, photos: [],
    task: 'candles',
  },
];

/** Klasör bilgileriyle birleşmiş duraklar (uygulama bunu kullanır) */
export const stops: Stop[] = list.map(withFolder);
