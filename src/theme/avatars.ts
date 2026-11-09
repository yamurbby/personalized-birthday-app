// npm run avatars ile üretilen katmanları (src/assets/avatars/<kim>/*.webp) CharacterSet'e çevirir.
// Bir kişinin dosyaları yoksa geçici (kodla çizilmiş) avatar kullanılır.
import type { Mood, Who } from '../core/types';
import { partnerPlaceholder, pelinPlaceholder } from './placeholderAvatars';
import type { Art, CharacterSet } from './types';

const files = import.meta.glob('../assets/avatars/*/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** scripts/avatars.mjs'in yazdığı kırpma ölçüsü */
const metaFiles = import.meta.glob('../assets/avatars/meta.json', { eager: true, import: 'default' }) as Record<string, { width: number; height: number }>;
const meta = Object.values(metaFiles)[0];
const ASPECT = meta ? meta.height / meta.width : 2;
const moods: Mood[] = ['happy', 'idle', 'hungry', 'sleepy', 'bored', 'sleeping'];

function build(who: Who, fallback: CharacterSet): CharacterSet {
  const mine: Record<string, Art> = {};
  for (const [path, url] of Object.entries(files)) {
    const [, dir, name] = path.match(/avatars\/([^/]+)\/(.+)\.webp$/) ?? [];
    if (dir === who) mine[name] = { kind: 'img', src: url };
  }
  if (!mine.base) return fallback;
  const pick = (prefix: string) => Object.fromEntries(
    Object.entries(mine).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]),
  );
  return {
    aspect: ASPECT,
    hairBack: mine['hair-back'],
    base: mine.base,
    faces: {
      ...pick('face-'), // sahne yüzleri dahil hepsi
      ...Object.fromEntries(moods.map((m) => [m, mine[`face-${m}`] ?? mine['face-idle']])),
    } as Record<Mood, Art>,
    hair: mine.hair,
  };
}

export const pelinAvatar = build('pelin', pelinPlaceholder);
export const partnerAvatar = build('partner', partnerPlaceholder);

/** Gardırop parçaları: dosya adı (uzantısız) → görsel, ör. 'top-4c' */
export const wardrobeArt: Record<string, Art> = Object.fromEntries(
  Object.entries(files)
    .map(([path, url]) => [path.match(/avatars\/wardrobe\/(.+)\.webp$/)?.[1], url] as const)
    .filter(([k]) => !!k)
    .map(([k, url]) => [k!, { kind: 'img', src: url } as Art]),
);
