// Tek renkli ince çizgili ikon seti: Phosphor Icons, "light" ağırlık (MIT lisanslı).
// SVG'ler pakete gömülür (çevrimdışı çalışır). Renk CSS'teki --icon değişkeninden gelir (currentColor).
// Yeni ikon: https://phosphoricons.com → adı bul, aşağıya bir import + bir satır ekle.
import balloon from '@phosphor-icons/core/assets/light/balloon-light.svg?raw';
import bowlFood from '@phosphor-icons/core/assets/light/bowl-food-light.svg?raw';
import bread from '@phosphor-icons/core/assets/light/bread-light.svg?raw';
import cake from '@phosphor-icons/core/assets/light/cake-light.svg?raw';
import camera from '@phosphor-icons/core/assets/light/camera-light.svg?raw';
import cherries from '@phosphor-icons/core/assets/light/cherries-light.svg?raw';
import coatHanger from '@phosphor-icons/core/assets/light/coat-hanger-light.svg?raw';
import cookie from '@phosphor-icons/core/assets/light/cookie-light.svg?raw';
import crownSimple from '@phosphor-icons/core/assets/light/crown-simple-light.svg?raw';
import dress from '@phosphor-icons/core/assets/light/dress-light.svg?raw';
import envelopeSimple from '@phosphor-icons/core/assets/light/envelope-simple-light.svg?raw';
import flower from '@phosphor-icons/core/assets/light/flower-light.svg?raw';
import forkKnife from '@phosphor-icons/core/assets/light/fork-knife-light.svg?raw';
import gearSix from '@phosphor-icons/core/assets/light/gear-six-light.svg?raw';
import hamburger from '@phosphor-icons/core/assets/light/hamburger-light.svg?raw';
import handHeart from '@phosphor-icons/core/assets/light/hand-heart-light.svg?raw';
import handTap from '@phosphor-icons/core/assets/light/hand-tap-light.svg?raw';
import house from '@phosphor-icons/core/assets/light/house-light.svg?raw';
import images from '@phosphor-icons/core/assets/light/images-light.svg?raw';
import lockSimple from '@phosphor-icons/core/assets/light/lock-simple-light.svg?raw';
import moonStars from '@phosphor-icons/core/assets/light/moon-stars-light.svg?raw';
import musicNotes from '@phosphor-icons/core/assets/light/music-notes-light.svg?raw';
import pants from '@phosphor-icons/core/assets/light/pants-light.svg?raw';
import question from '@phosphor-icons/core/assets/light/question-light.svg?raw';
import sneaker from '@phosphor-icons/core/assets/light/sneaker-light.svg?raw';
import sparkle from '@phosphor-icons/core/assets/light/sparkle-light.svg?raw';
import mapTrifold from '@phosphor-icons/core/assets/light/map-trifold-light.svg?raw';
import tShirt from '@phosphor-icons/core/assets/light/t-shirt-light.svg?raw';
import users from '@phosphor-icons/core/assets/light/users-light.svg?raw';
import type { Art } from './types';

const svgs = {
  balloon, bowlFood, bread, cake, camera, cherries, coatHanger, cookie, crownSimple, dress, envelopeSimple,
  flower, forkKnife, gearSix, hamburger, handHeart, handTap, house, images, lockSimple, mapTrifold, moonStars, musicNotes,
  pants, question, sneaker, sparkle, tShirt, users,
};
export type IconName = keyof typeof svgs;

/** İkonu temada kullanılacak görsele çevirir; bg verilirse yuvarlak köşeli zemin üstünde çizilir. */
export const icon = (name: IconName, bg?: string): Art => ({ kind: 'svg', svg: svgs[name], bg });
