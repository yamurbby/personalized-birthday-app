import { useEffect, useRef, useState } from 'preact/hooks';
import type { Photo } from '../../content/photos';

/** Tam ekran fotoğraf: sağa/sola kaydırma, oklar, klavye; komşu fotoğraflar önceden yüklenir. */
export function PhotoViewer({ list, index, onIndex, onClose }: {
  list: Photo[]; index: number; onIndex: (i: number) => void; onClose: () => void;
}) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const go = (d: number) => {
    const i = index + d;
    if (i >= 0 && i < list.length) onIndex(i);
  };

  useEffect(() => {
    // Komşuları önceden yükle → geçişte beklemesin
    [index - 1, index + 1].forEach((i) => { if (list[i]) new Image().src = list[i].full; });
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [index]);

  const onDown = (e: PointerEvent) => { start.current = e.clientX; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const onMove = (e: PointerEvent) => { if (start.current !== null) setDx(e.clientX - start.current); };
  const onUp = () => {
    if (start.current === null) return;
    start.current = null;
    if (dx < -50) go(1);
    else if (dx > 50) go(-1);
    setDx(0);
  };

  const p = list[index];
  return (
    <div class="viewer" role="dialog" aria-label="Fotoğraf">
      <header class="viewer-head">
        <span>{index + 1} / {list.length}</span>
        <button class="icon-btn" onClick={onClose} aria-label="Kapat">✕</button>
      </header>
      <div
        class="viewer-stage"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <img
          key={p.name}
          src={p.full}
          alt=""
          decoding="async"
          draggable={false}
          style={{ transform: `translateX(${dx}px)`, transition: start.current === null ? 'transform .2s' : 'none' }}
        />
      </div>
      <div class="viewer-nav">
        <button class="btn" onClick={() => go(-1)} disabled={index === 0} aria-label="Önceki">‹</button>
        <button class="btn" onClick={() => go(1)} disabled={index === list.length - 1} aria-label="Sonraki">›</button>
      </div>
    </div>
  );
}
