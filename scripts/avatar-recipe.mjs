// ✏️ Avatar tarifi: paketten hangi parçaların seçileceği ve kıyafet renkleri.
// Değiştirince:  npm run avatars   (src/assets/avatars/ yeniden üretilir)
//
// Parça numaraları art-src/avatar-pack/ içindeki dosya adlarıdır.
// Saç rengi harfi: '' kahve, 'b' turuncu, 'c' kızıl, 'd' açık kahve, 'e' sarı,
//                  'f' siyah, 'g' beyaz, 'h' gri
// Göz rengi (PUPILS): 3 kahve, 7 siyah, 4 mavi, 5 yeşil, 1 gri, 2 bal …
// Tonlama (tint): kıyafetteki beyaz/gri alanlar bu renge boyanır, çizgiler korunur.
// Kıyafet numaraları: 9 = ana klasördeki, '9c' = renkli klasördeki (ikisi FARKLI kıyafet).
// Hepsini görmek için: docs/AVATAR.md → kıyafet kataloğu.

/** Ruh hali → kaş / kirpik / ağız. sleeping: gözler kapalı çizilir. */
export const faces = {
  idle: { brows: 1, mouth: 3 },
  happy: { brows: 4, mouth: 7 },
  hungry: { brows: 3, mouth: 8 },
  sleepy: { brows: 5, mouth: 2, lashes: 5 },
  bored: { brows: 5, mouth: 1 },
  sleeping: { brows: 1, mouth: 3, closedEyes: true, zzz: true },
  // Sahnelere özel ifadeler (ruh hali değil): doğum günü girişi
  // blow için ağız 8 (küçük "o")
  wish: { brows: 4, mouth: 3, closedEyes: true }, // dilek tutuyor
  blow: { brows: 1, mouth: 8, closedEyes: true }, // mum üflüyor
};

export const people = {
  pelin: {
    body: 17, // ten rengi
    eyes: 3, // kahve
    lashes: 1,
    hairColor: 'd', // açık kahve…
    hairModulate: { saturation: 0.6, brightness: 0.95 }, // …turuncusu alınmış
    hairBack: 10, // uzun düz
    hair: 10,
    bangs: 8,
    hairBonus: null,
    bonusBehind: false,
  },
  partner: {
    body: 16, // TODO: ten rengin (b1–b29)
    eyes: 3, // kahve
    lashes: 1,
    hairColor: '', // kahve
    hairBack: 1, // uzun kıvırcık (düz isterse: 10)
    hair: 1,
    bangs: 13, // kıvırcık kahkül (alternatif: 6)
    hairBonus: null,
    bonusBehind: false,
  },
};

// Kıyafetler artık oyun içinde birleştiriliyor: hazır kombinler src/content/outfits.ts içinde.
