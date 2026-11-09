import { useGame } from '../../core/store';
import { config } from '../../content/config';
import { Icon } from '../components/Bits';
import { Character } from '../components/Character';
import { togetherCards } from '../together';

/** Birlikte: ikimiz + kartlar (liste src/ui/together.tsx içinde) */
export function Together({ onOpen }: { onOpen: (id: string) => void }) {
  const s = useGame();
  return (
    <section class="screen together-screen">
      <div class="duo-stage">
        <Character who="pelin" mood="happy" size={130} />
        <span class="duo-heart"><Icon name="duo_heart" size={34} /></span>
        <Character who="partner" mood="happy" size={130} />
      </div>
      <p class="duo-names">{config.pelinName} & {config.partnerName}</p>

      <div class="card-list">
        {togetherCards.map((c) => {
          const locked = c.locked?.(s) ?? false;
          return (
            <button key={c.id} class={`game-card ${locked ? 'locked' : ''}`} onClick={() => !locked && onOpen(c.id)} aria-disabled={locked}>
              <Icon name={c.icon} size={44} />
              <div class="game-card-text">
                <h3>{c.name}</h3>
                <p>{c.desc(s)}</p>
              </div>
              {locked ? <span class="play locked-tag"><Icon name="lock" size={18} /></span> : <span class="play">{c.action ?? 'Aç'}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
