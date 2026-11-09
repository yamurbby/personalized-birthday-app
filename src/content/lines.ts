import type { Mood } from '../core/types';

// Pelin'in odada ruh haline göre söylediği cümleler. İstediğin kadar ekle.
export const moodLines: Record<Mood, string[]> = {
  happy: ['Bugün kendimi çok iyi hissediyorum!', 'Şu an hiçbir vaka beni yıldıramaz.', 'Mola iyi geldi.'],
  idle: ['Biraz mola mı versek?', 'Ders kitabı bekleyebilir, değil mi?', 'Hmm, ne yapsak?'],
  hungry: ['Karnım guruldadı…', 'Kantinden bir şey alsak?', 'Yemeksiz anatomi çalışılmaz.'],
  sleepy: ['Gözlerim kapanıyor…', 'Nöbet sonrası şekerleme lazım.', 'Beş dakika uzansam?'],
  bored: ['Biraz eğlence lazım!', 'Bir oyun oynayalım mı?', 'Hiç neşem yok gibi…'],
  sleeping: ['Zzz…', 'Zzz… stetoskop… zzz', '…'],
};

export const petLines = ['Hihi, gıdıklanıyorum!', 'Bunu çok seviyorum!', 'Biraz daha!'];
export const musicLines = ['Bu şarkıyı çok seviyorum!', 'Dans molası!', 'Ritim tutuyorum bak!'];
