// Bir durağın anısı: tarih, başlık, yazı ve fotoğraf galerisi (dokununca tam ekran).
import { useState } from 'preact/hooks';
import { stops } from '../../content/journey';
import { isFinal, stopPhotos } from '../../core/journey';
import { Confetti, Icon, Overlay } from '../components/Bits';
import { PhotoViewer } from '../components/PhotoViewer';
import { games } from '../../games';
import { GameHost } from './GameHost';

export function StopMemory({ index, fresh, onContinue, onClose }: {
  index: number;
  /** yeni açıldıysa: konfeti ve "Devam et" (yoksa sadece "Kapat") */
  fresh?: boolean;
  onContinue?: () => void;
  onClose: () => void;
}) {
  const stop = stops[index];
  const photos = stopPhotos(stop);
  const [viewing, setViewing] = useState<number | null>(null);
  const final = isFinal(index);
  // Açılmış duraklarda oyun tekrar oynanabilir (ilerlemeyi değiştirmez; bitince anıya dönülür)
  const game = !fresh && stop.task ? games[stop.task] : undefined;
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <Overlay class={`memory-page ${final ? 'final' : ''}`}>
        {fresh && <Confetti count={final ? 70 : 30} />}
        <header class="album-head">
          <button class="icon-btn" onClick={onClose} aria-label="Kapat">✕</button>
          <span class="memory-step">{final ? 'Son durak' : `${index + 1}. durak`}</span>
        </header>

        <div class="memory-body">
          {stop.date && <p class="memory-date">{stop.date}</p>}
          {stop.title && <h1 class="memory-title">{stop.title}</h1>}
          {stop.text && <p class="memory-note">{stop.text}</p>}
        </div>

        {photos.length > 0 && (
          <div class="memory-gallery" aria-label="Fotoğraflar">
            {photos.map((p, i) => (
              <button key={p.name} class="memory-shot" onClick={() => setViewing(i)} aria-label={`Fotoğraf ${i + 1}, büyüt`}>
                {/* 900 px önizleme telefonda net; çerçeve fotoğrafın kendi oranını alır (dikey/yatay kırpılmaz) */}
                <img src={p.thumb} alt="" loading="lazy" decoding="async" draggable={false} />
              </button>
            ))}
          </div>
        )}
        {photos.length > 1 && <p class="memory-hint muted">Kaydır, büyütmek için dokun</p>}

        {game && (
          <div class="memory-replay">
            <button class="btn" onClick={() => setPlaying(true)}>🎮 Tekrar oyna: {game.name}</button>
          </div>
        )}

        <div class="memory-actions">
          {fresh && onContinue ? (
            <button class="btn primary big" onClick={onContinue}>
              {final ? <>Notunu aç <Icon name="duo_heart" size={20} /></> : 'Devam et'}
            </button>
          ) : (
            <button class="btn big" onClick={onClose}>Kapat</button>
          )}
        </div>
      </Overlay>
      {playing && stop.task && (
        <GameHost replay task={stop.task} index={index} onExit={() => setPlaying(false)} onComplete={() => setPlaying(false)} />
      )}
      {viewing !== null && <PhotoViewer list={photos} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />}
    </>
  );
}
