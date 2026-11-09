// Bir durağın görevini (mini oyununu) açar. Oyunlar src/games/ içinde, ortak arayüzle bağlanır.
import { useEffect, useRef } from 'preact/hooks';
import { stopData } from '../../core/journey';
import { games } from '../../games';
import { Overlay } from '../components/Bits';

export function GameHost({ task, index, onComplete, onExit, replay }: {
  task: string;
  index: number;
  /** açılmış durakta tekrar oynama: bitiş ekranı "Anıya dön" der */
  replay?: boolean;
  /** oyun kazanıldı → durak açılır */
  onComplete: () => void;
  /** geri: durak kilitli kalır */
  onExit: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const game = games[task];

  useEffect(() => {
    if (!game || !box.current) return;
    let done = false;
    const cleanup = game.startGame(box.current, stopData(index), () => {
      if (done) return; // birden fazla çağrılırsa yok say
      done = true;
      onComplete();
    });
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, [task, index]);

  return (
    <Overlay class="game-host">
      <header class="album-head">
        <button class="icon-btn" onClick={onExit} aria-label="Geri">←</button>
        <h1>{game?.name ?? 'Görev'}</h1>
      </header>
      {game ? (
        <div class="game-area" ref={box} data-replay={replay ? '' : undefined} />
      ) : (
        // Oyun listede yoksa takılıp kalmasın: anıya geçmeye izin ver
        <div class="game-area game-missing">
          <p>Bu durağın oyunu (“{task}”) henüz eklenmemiş.</p>
          <button class="btn primary" onClick={onComplete}>Anıya geç</button>
        </div>
      )}
    </Overlay>
  );
}
