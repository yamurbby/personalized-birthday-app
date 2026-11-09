// Anı albümü: haritada açılan duraklar burada toplanır. Açılmamışlar kilitli kart olarak durur.
// "Tüm fotoğraflarımız" bölümü sadece harita tamamen bitince görünür.
import { useState } from 'preact/hooks';
import { isFinal, journeyDone, stopPhotos, stopStatus } from '../../core/journey';
import { useGame } from '../../core/store';
import { stops } from '../../content/journey';
import { photos } from '../../content/photos';
import { Icon, Overlay } from '../components/Bits';
import { PhotoViewer } from '../components/PhotoViewer';
import { StopMemory } from './StopMemory';

export function Album({ onClose }: { onClose: () => void }) {
  const s = useGame();
  const [open, setOpen] = useState<number | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const finished = journeyDone(s);

  // Anı ve fotoğraf görüntüleyici kaydırılan albümün DIŞINDA çizilir (yoksa aşağı kaydırınca üstte kalırlar).
  return (
    <>
      <Overlay class="album">
        <header class="album-head">
          <button class="icon-btn" onClick={onClose} aria-label="Geri">←</button>
          <h1>Anı albümü</h1>
          <span class="muted">{Math.min(s.journey.done, stops.length)}/{stops.length}</span>
        </header>

        <div class="album-grid">
          {stops.map((stop, i) => {
            const unlocked = stopStatus(s, i) === 'open';
            const cover = unlocked ? stopPhotos(stop)[0] : undefined;
            return (
              <button
                key={stop.id}
                class={`polaroid ${unlocked ? '' : 'locked'} ${isFinal(i) ? 'final' : ''}`}
                style={{ '--tilt': `${((i % 3) - 1) * 1.5}deg` }}
                onClick={() => unlocked && setOpen(i)}
                aria-disabled={!unlocked}
              >
                {unlocked ? (
                  cover ? <img class="photo" src={cover.thumb} alt={stop.title} loading="lazy" decoding="async" draggable={false} />
                    : <div class="photo placeholder"><Icon name="photo" size={36} /></div>
                ) : (
                  <div class="photo locked-photo"><Icon name={isFinal(i) ? 'cake' : 'lock'} size={30} /></div>
                )}
                <span class="polaroid-title">{unlocked ? stop.title : '???'}</span>
                {!unlocked && <small>Haritada {i + 1}. durak</small>}
              </button>
            );
          })}
        </div>

        {finished && photos.length > 0 && (
          <>
            <h2 class="album-section">Tüm fotoğraflarımız <span class="muted">{photos.length}</span></h2>
            <div class="photo-grid">
              {photos.map((p, i) => (
                <button key={p.name} class="photo-cell" onClick={() => setViewing(i)} aria-label={`Fotoğraf ${i + 1}`}>
                  <img src={p.thumb} alt="" loading="lazy" decoding="async" draggable={false} />
                </button>
              ))}
            </div>
          </>
        )}
      </Overlay>

      {open !== null && <StopMemory index={open} onClose={() => setOpen(null)} />}
      {viewing !== null && <PhotoViewer list={photos} index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />}
    </>
  );
}
