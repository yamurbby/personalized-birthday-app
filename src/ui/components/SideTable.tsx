// Odada Pelin'in yanındaki küçük sehpa: odadaki beyaz-pembe mobilyalar gibi (gölgeli, kabartmalı), üstünde dergiler.
// Verilen çiçek saksısı (Neşelendir → Çiçek ver) sehpanın üstünde durur.
// Ayakta duran derginin kapağında albümden bir fotoğraf var: aşağıdaki COVER_PHOTO ile değiştirebilirsin.
import { findPhoto, photos } from '../../content/photos';

/** Dergi kapağındaki fotoğraf (images/pelo içindeki ad; bulunamazsa ilk fotoğraf) */
const COVER_PHOTO = 'd4-yapboz';
/** Kapakta fotoğrafın hangi kısmı görünsün: 'xMidYMin' üst kısım (yüz), 'xMidYMid' orta */
const COVER_ALIGN = 'xMidYMin';
const cover = findPhoto(COVER_PHOTO) ?? photos[0];

export function SideTable({ pot, potName }: { pot?: string; potName?: string }) {
  return (
    <span class="side-table" aria-hidden={!pot}>
      <svg viewBox="0 0 140 160" class="side-table-svg" aria-hidden="true">
        <defs>
          {/* Boyalı ahşap: ortası aydınlık, kenarları gölgeli (oda render'ı gibi yumuşak ışık) */}
          <linearGradient id="st-front" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#e9d9d6" />
            <stop offset=".35" stop-color="#fffaf7" />
            <stop offset=".65" stop-color="#fbf3f0" />
            <stop offset="1" stop-color="#e2cfcc" />
          </linearGradient>
          <linearGradient id="st-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fbe7ec" />
            <stop offset="1" stop-color="#f3d2db" />
          </linearGradient>
          <linearGradient id="st-edge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fdf1f3" />
            <stop offset="1" stop-color="#e8c3cd" />
          </linearGradient>
          <linearGradient id="st-leg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#ddcac7" />
            <stop offset=".45" stop-color="#fffaf7" />
            <stop offset="1" stop-color="#d9c5c2" />
          </linearGradient>
          <radialGradient id="st-gold" cx=".35" cy=".35" r=".7">
            <stop offset="0" stop-color="#fff2c2" />
            <stop offset=".5" stop-color="#e9c46a" />
            <stop offset="1" stop-color="#b8892f" />
          </radialGradient>
          <linearGradient id="st-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#ff7b93" />
            <stop offset="1" stop-color="#f49ab0" />
          </linearGradient>
          <linearGradient id="st-gloss" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="rgba(255,255,255,.45)" />
            <stop offset=".4" stop-color="rgba(255,255,255,0)" />
          </linearGradient>
          <clipPath id="st-cover"><rect x="0" y="0" width="30" height="40" rx="1" /></clipPath>
        </defs>

        {/* Zemin gölgeleri */}
        <ellipse cx="70" cy="153" rx="56" ry="5" fill="rgba(150,80,100,.22)" />
        {[24, 116, 50, 90].map((x) => <ellipse key={x} cx={x} cy={x === 50 || x === 90 ? 146 : 152} rx="5" ry="1.8" fill="rgba(120,60,80,.3)" />)}

        {/* Arka bacaklar (daha koyu, geride) */}
        <path d="M50 102 C48 118 52 130 48 146 L53 146 C56 130 53 118 55 102 Z" fill="#e6d6d3" />
        <path d="M90 102 C92 118 88 130 92 146 L87 146 C84 130 87 118 85 102 Z" fill="#e6d6d3" />

        {/* Gövde (önden) */}
        <path d="M16 80 H124 V103 Q70 112 16 103 Z" fill="url(#st-front)" stroke="#dcc2c8" stroke-width=".8" />
        {/* tabla altındaki gölge şeridi */}
        <rect x="16" y="80" width="108" height="3.5" fill="rgba(160,110,120,.22)" />
        {/* oymalı çekmece paneli */}
        <rect x="30" y="86" width="80" height="14" rx="3.5" fill="none" stroke="rgba(170,130,140,.45)" stroke-width="1.1" />
        <rect x="31.2" y="87.2" width="77.6" height="11.6" rx="2.8" fill="none" stroke="rgba(255,255,255,.9)" stroke-width=".7" />
        <path d="M20 104 Q30 100 40 105 Q55 110 70 107 Q85 110 100 105 Q110 100 120 104" fill="none" stroke="rgba(170,130,140,.4)" stroke-width="1" />
        {/* altın düğme */}
        <circle cx="70" cy="93" r="3.2" fill="url(#st-gold)" />
        <circle cx="69" cy="92" r=".9" fill="rgba(255,255,255,.9)" />

        {/* Ön bacaklar (kıvrık, silindir gölgeli, altın uçlu) */}
        <path d="M22 100 C17 118 27 130 18 146 L25 147 C35 130 28 118 30 100 Z" fill="url(#st-leg)" stroke="#d8c0c5" stroke-width=".7" />
        <path d="M118 100 C123 118 113 130 122 146 L115 147 C105 130 112 118 110 100 Z" fill="url(#st-leg)" stroke="#d8c0c5" stroke-width=".7" />
        <ellipse cx="21.5" cy="147" rx="3.6" ry="1.6" fill="url(#st-gold)" />
        <ellipse cx="118.5" cy="147" rx="3.6" ry="1.6" fill="url(#st-gold)" />

        {/* Tabla: üst yüzey (hafif yukarıdan) + kalın kenar */}
        <path d="M8 74 L132 74 L122 58 L18 58 Z" fill="url(#st-top)" />
        <path d="M8 74 L132 74 L122 58 L18 58 Z" fill="url(#st-gloss)" />
        <path d="M8 74 H132 Q133 80 128 81 H12 Q7 80 8 74 Z" fill="url(#st-edge)" stroke="#e1b8c3" stroke-width=".7" />
        <path d="M10 74.6 H130" stroke="rgba(255,255,255,.95)" stroke-width="1" />

        {/* Yatan dergi (altta, pembe): tamamen tablanın üst yüzeyinde (y 58–74) */}
        <ellipse cx="38" cy="69.5" rx="19" ry="2.4" fill="rgba(170,110,125,.25)" />
        <path d="M20 63.5 L49 60 L56 66.5 L27 70.5 Z" fill="#f7b6c8" />
        <path d="M20 63.5 L27 70.5 L27 71.6 L20 64.6 Z" fill="#fff" />
        <path d="M27 70.5 L56 66.5 L56 67.6 L27 71.6 Z" fill="#f1e4e6" />
        <path d="M23 63.2 L45 60.5" stroke="rgba(255,255,255,.7)" stroke-width="1.1" />

        {/* Ayakta duran dergi: kapakta Pelin; tabanı yatan derginin üstüne oturur, arkasında destek ayağı */}
        <path d="M44 64.5 L52 66" stroke="#dcc6cb" stroke-width="1.6" stroke-linecap="round" />
        <ellipse cx="40" cy="65.6" rx="14" ry="1.6" fill="rgba(150,90,105,.3)" />
        <g transform="translate(25 25.5) rotate(-6 15 40)">
          <rect x="1.6" y="1.4" width="30" height="40" rx="1" fill="#e9dcdf" />
          <rect x="0" y="0" width="30" height="40" rx="1" fill="#fff" />
          {cover && (
            <image href={cover.thumb} x="0" y="0" width="30" height="40" preserveAspectRatio={`${COVER_ALIGN} slice`} clip-path="url(#st-cover)" />
          )}
          <rect x="0" y="0" width="30" height="7.5" rx="1" fill="url(#st-band)" opacity=".92" />
          <text x="15" y="5.7" font-size="5.4" font-weight="900" fill="#fff" text-anchor="middle" font-family="sans-serif" letter-spacing=".4">PELİN</text>
          <rect x="2" y="34" width="14" height="3.4" rx="1" fill="rgba(255,255,255,.85)" />
          <text x="9" y="36.6" font-size="2.4" font-weight="800" fill="#ff7b93" text-anchor="middle" font-family="sans-serif">DOĞUM GÜNÜ</text>
          <rect x="0" y="0" width="30" height="40" rx="1" fill="url(#st-gloss)" />
        </g>
      </svg>
      {pot && <img class="side-table-pot" src={pot} alt={potName ?? ''} draggable={false} />}
    </span>
  );
}
