import type { CSSProperties } from 'preact';
import type { Art as ArtT } from '../../theme/types';

interface Props {
  art: ArtT;
  size?: number | string;
  class?: string;
  style?: CSSProperties;
  alt?: string;
}

/** Temadaki her tür görseli (resim, sprite şeridi, çizgi ikon) aynı arayüzle çizer. */
export function Art({ art, size = 48, class: cls = '', style, alt = '' }: Props) {
  const dim = typeof size === 'number' ? `${size}px` : size;
  if (art.kind === 'img') {
    if (art.frames && art.frames > 1) {
      // Yatay sprite şeridi: CSS steps() animasyonuyla oynatılır
      return (
        <div
          class={`art art-sprite ${cls}`}
          role="img"
          aria-label={alt}
          style={{
            width: dim, height: dim,
            backgroundImage: `url("${art.src}")`,
            backgroundSize: `${art.frames * 100}% 100%`,
            animation: `sprite ${art.frames / (art.fps ?? 8)}s steps(${art.frames}) infinite`,
            ...style,
          }}
        />
      );
    }
    return <img class={`art ${cls}`} src={art.src} alt={alt} draggable={false} style={{ width: dim, height: dim, ...style }} />;
  }
  if (art.kind === 'emoji') {
    return (
      <span
        class={`art art-emoji ${cls}`}
        role="img"
        aria-label={alt}
        aria-hidden={alt ? undefined : true}
        style={{ width: dim, height: dim, fontSize: `calc(${dim} * 0.85)`, ...style }}
      >
        {art.emoji}
      </span>
    );
  }
  // Çizgi ikon: SVG paket içinden gelir (güvenilir içerik), rengi currentColor → CSS --icon
  return (
    <span
      class={`art art-svg ${art.bg ? 'has-bg' : ''} ${cls}`}
      role="img"
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
      style={{ width: dim, height: dim, background: art.bg, ...style }}
      dangerouslySetInnerHTML={{ __html: art.svg }}
    />
  );
}
