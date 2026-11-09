// Geçici katmanlı chibi avatarlar (kodla çizilmiş SVG; kıyafetsiz, sadece avatar dosyaları yoksa kullanılır). Gerçek asset'ler aynı yapıya oturur:
// tüm katmanlar 400×500 tuval (4:5), ayaklar altta ortada (y≈480). Bkz. docs/AVATAR.md
import type { Mood } from '../core/types';
import type { Art, CharacterSet } from './types';

const svg = (inner: string): Art => ({
  kind: 'img',
  src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">${inner}</svg>`)}`,
});

const INK = '#5a3d4a';
const SKIN = '#ffe1d2';
const moods: Mood[] = ['happy', 'idle', 'hungry', 'sleepy', 'bored', 'sleeping'];

// ---------- gövde ----------
const arm = (x1: number, x2: number, color: string, w: number, toY = 372) =>
  `<path d="M${x1} 296 Q${(x1 + x2) / 2 + (x2 < x1 ? -4 : 4)} 330 ${x2} ${toY}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;

const base = svg(`
  <ellipse cx="200" cy="486" rx="92" ry="10" fill="#000" opacity=".08"/>
  <rect x="170" y="380" width="24" height="92" rx="12" fill="${SKIN}"/>
  <rect x="206" y="380" width="24" height="92" rx="12" fill="${SKIN}"/>
  <ellipse cx="180" cy="476" rx="22" ry="11" fill="#c9a0b4"/>
  <ellipse cx="220" cy="476" rx="22" ry="11" fill="#c9a0b4"/>
  ${arm(154, 130, SKIN, 24)}${arm(246, 270, SKIN, 24)}
  <circle cx="129" cy="376" r="14" fill="${SKIN}"/><circle cx="271" cy="376" r="14" fill="${SKIN}"/>
  <path d="M148 284 Q200 274 252 284 L262 396 Q200 406 138 396 Z" fill="#f4eef2"/>
  <rect x="186" y="258" width="28" height="34" rx="10" fill="${SKIN}"/>
  <circle cx="84" cy="184" r="18" fill="${SKIN}"/><circle cx="316" cy="184" r="18" fill="${SKIN}"/>
  <ellipse cx="200" cy="170" rx="118" ry="108" fill="${SKIN}"/>
`);

// ---------- yüz ----------
function face(m: Mood) {
  const eye = (x: number) => {
    switch (m) {
      case 'happy': return `<path d="M${x - 13} 192 q13 -16 26 0" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      case 'sleepy': return `<path d="M${x - 13} 188 h26" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M${x - 11} 194 q11 7 22 0" stroke="${INK}" stroke-width="4" fill="none"/>`;
      case 'sleeping': return `<path d="M${x - 13} 186 q13 13 26 0" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      case 'bored': return `<circle cx="${x}" cy="192" r="9" fill="${INK}"/><path d="M${x - 15} 176 h30" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
      default: return `<ellipse cx="${x}" cy="188" rx="11" ry="13" fill="${INK}"/><circle cx="${x + 4}" cy="183" r="4" fill="#fff"/>`;
    }
  };
  const mouth = {
    happy: `<path d="M182 220 q18 22 36 0 z" fill="#ff7b93" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,
    idle: `<path d="M188 222 q12 10 24 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    hungry: `<ellipse cx="200" cy="226" rx="10" ry="13" fill="#ff7b93" stroke="${INK}" stroke-width="5"/>`,
    sleepy: `<ellipse cx="200" cy="226" rx="7" ry="6" fill="${INK}"/>`,
    bored: `<path d="M186 226 h28" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
    sleeping: `<path d="M192 224 q8 6 16 0" stroke="${INK}" stroke-width="4" fill="none"/>`,
  }[m];
  const zz = m === 'sleeping'
    ? `<text x="300" y="80" font-size="40" font-family="sans-serif" font-weight="700" fill="${INK}" opacity=".7">z</text><text x="330" y="44" font-size="28" font-family="sans-serif" font-weight="700" fill="${INK}" opacity=".5">z</text>`
    : '';
  return svg(`${eye(158)}${eye(242)}${mouth}
    <ellipse cx="128" cy="216" rx="17" ry="12" fill="#ff9fb4" opacity=".5"/>
    <ellipse cx="272" cy="216" rx="17" ry="12" fill="#ff9fb4" opacity=".5"/>${zz}`);
}
const faces = Object.fromEntries(moods.map((m) => [m, face(m)])) as Record<Mood, Art>;

// ---------- Pelin ----------
const pelinHairBack = svg(`<path d="M80 172 Q78 58 200 50 Q322 58 320 172 L330 326 Q302 350 272 322 L128 322 Q98 350 70 326 Z" fill="#57362a"/>`);
const pelinHair = svg(`
  <path d="M82 178 Q84 62 200 56 Q316 62 318 178 Q304 118 252 104 Q232 138 170 130 Q132 128 118 126 Q94 140 82 178 Z" fill="#6b4434"/>
  <path d="M252 104 Q262 92 280 96" stroke="#8a5a45" stroke-width="5" fill="none" stroke-linecap="round"/>
  <polygon points="282,92 288,104 301,105 291,113 294,126 282,119 270,126 273,113 263,105 276,104" fill="#ff8fa8"/>`);

export const pelinPlaceholder: CharacterSet = {
  aspect: 1.25,
  hairBack: pelinHairBack,
  base,
  faces,
  hair: pelinHair,
};

// ---------- Ben (kız; omuz hizası koyu saç, at kuyruğu, kurdele) ----------
const partnerHairBack = svg(`
  <path d="M82 170 Q80 60 200 52 Q320 60 318 170 L322 262 Q296 282 272 262 L128 262 Q104 282 78 262 Z" fill="#2a2326"/>
  <path d="M300 120 Q366 150 350 250 Q342 290 318 300 Q336 240 300 170 Z" fill="#2a2326"/>`);
const partnerHair = svg(`
  <path d="M82 176 Q84 62 200 56 Q316 62 318 176 Q300 114 236 100 Q200 128 150 124 Q112 124 100 132 Q88 148 82 176 Z" fill="#3a3034"/>
  <path d="M236 100 Q258 90 286 104" stroke="#55474c" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M300 112 l26 -20 4 30 z M300 112 l-6 -30 26 14 z" fill="#9fc4e8"/>
  <circle cx="302" cy="110" r="7" fill="#7fa9d4"/>`);
export const partnerPlaceholder: CharacterSet = {
  aspect: 1.25,
  hairBack: partnerHairBack,
  base,
  faces,
  hair: partnerHair,
};
