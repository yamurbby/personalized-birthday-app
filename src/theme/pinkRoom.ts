// Pembe oda teması: oda, 3B "Pink bedroom" modelinden (dasy444, CC BY 4.0) sabit açıyla
// render edilmiş bir arka plan. Avatarlar ve gardırop npm run avatars ile üretilen katmanlardan gelir.
// Render aracı: tools/render-room.html (npm run dev → /tools/render-room.html)
import roomPink from '../assets/theme/room-pink.webp';
// Ameliyathane: “Charité University Hospital - Operating Room” (ChrisRE, CC BY-NC), pastelleştirilmiş render
import { partnerAvatar, pelinAvatar, wardrobeArt } from './avatars';
import { placeholderTheme } from './placeholder';
import type { Theme } from './types';

export const pinkRoomTheme: Theme = {
  ...placeholderTheme,
  name: 'Pembe oda',
  characters: { pelin: pelinAvatar, partner: partnerAvatar },
  wardrobe: wardrobeArt,
  roomBackground: { kind: 'img', src: roomPink },
  // Render'daki gerçek eşyaların yeri (oda kutusuna göre %): yatak → Dinlen, koltuk → Neşelendir
  roomHotspots: {
    bed: { left: 60, top: 38, width: 40, height: 31 },
    chair: { left: 0, top: 43, width: 27, height: 17 },
  },
};
