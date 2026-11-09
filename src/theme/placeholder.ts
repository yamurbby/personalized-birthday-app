// Temel tema: ikonlar, yemek görselleri ve (avatar dosyaları yoksa) kodla çizilmiş geçici avatarlar.
// Asıl tema (theme/pinkRoom.ts) bunu genişletir; görsel tarz değişince yeni bir tema dosyası yazılır.
import { icon } from './icons';
import { partnerPlaceholder, pelinPlaceholder } from './placeholderAvatars';
import type { Art, Theme } from './types';

/** Renkli emoji (çizgi ikon yerine bilerek seçilen birkaç yer) */
const emoji = (e: string): Art => ({ kind: 'emoji', emoji: e });

export const placeholderTheme: Theme = {
  name: 'Temel',
  pixelArt: false,
  characters: { pelin: pelinPlaceholder, partner: partnerPlaceholder },
  wardrobe: {},
  foods: {
    simit: icon('bread'), hamburger: icon('hamburger'), kiraz: icon('cherries'),
    makarna: icon('bowlFood'), kurabiye: icon('cookie'), favori: icon('cake'),
  },
  icons: {
    // para birimleri ve ihtiyaçlar
    star: emoji('⭐'), heart: emoji('💗'),
    // üst çubuk etiketleri: renkli emoji
    food: emoji('🍓'), energy: emoji('⚡'), joy: emoji('❤️'),
    // Birlikte: ikimizin arasındaki kalp
    duo_heart: emoji('💗'), aquarium: emoji('🐠'),
    // alt menü ve üst çubuk
    tab_room: icon('house'), tab_campus: icon('mapTrifold'), tab_together: icon('users'), settings: icon('gearSix'),
    // oda eylemleri
    feed: icon('forkKnife'), rest: icon('moonStars'), cheer: icon('balloon'), wardrobe: icon('coatHanger'),
    pet: icon('handHeart'), music: icon('musicNotes'), note: icon('envelopeSimple'), flowers: icon('flower'),
    // birlikte / albüm
    album: icon('images'), lock: icon('lockSimple'), photo: icon('camera'), tap: icon('handTap'),
    // gardırop çekmeceleri
    ready: icon('sparkle'), top: icon('tShirt'), bottom: icon('pants'), dress: icon('dress'),
    shoes: icon('sneaker'), acc: icon('crownSimple'),
    // oyun kartları
    // ayarlar
    cake: icon('cake'),
  },
};
