// Odada "Neşelendir → Çiçek ver" çiçekleri. Pelin'in söylediği cümleyi ve emojiyi değiştirebilirsin.
// Verilen çiçek o gün odada, Pelin'in yanında saksıda durur.
// pot: src/assets/flowers/ içindeki saksı görseli (scripts/flowerpots.mjs üretir)
export interface Bouquet {
  id: string;
  name: string;
  /** uçarken ve yaprak yağmurunda görünen emoji */
  emoji: string;
  /** Pelin'in çiçeği alınca söylediği */
  line: string;
  /** odada duran saksı görseli */
  pot: string;
}

export const bouquets: Bouquet[] = [
  { id: 'gul', name: 'Güller', emoji: '🌹', line: 'Gula çiya! Benim dağ güllerim 🌹', pot: 'gul' },
  { id: 'lale', name: 'Laleler', emoji: '🌷', line: 'Laleler mi? Ne kadar zarif, teşekkürler!', pot: 'lale' },
  { id: 'sakayik', name: 'Şakayıklar', emoji: '🌸', line: 'Şakayık! Pembe pembe, bayıldım 🌸', pot: 'sakayik' },
  { id: 'kasimpati', name: 'Kasımpatılar', emoji: '🌻', line: 'Kasımpatı! Güneş gibi sapsarı 🌻', pot: 'kasimpati' },
  { id: 'nergis', name: 'Nergisler', emoji: '🌼', line: 'Nergisler… mis gibi kokuyor!', pot: 'nergis' },
];

const pots = import.meta.glob('../assets/flowers/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** Çiçeğin saksı görseli (yoksa undefined) */
export const potUrl = (b: Bouquet): string | undefined => pots[`../assets/flowers/${b.pot}.webp`];
