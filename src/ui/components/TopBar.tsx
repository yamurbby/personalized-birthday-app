import { useEffect, useRef, useState } from 'preact/hooks';
import { useGame } from '../../core/store';
import type { NeedId } from '../../core/types';
import { Icon } from './Bits';

const needs: { id: NeedId; icon: string; label: string }[] = [
  { id: 'food', icon: 'food', label: 'Tokluk' },
  { id: 'energy', icon: 'energy', label: 'Enerji' },
  { id: 'joy', icon: 'joy', label: 'Mutluluk' },
];

/** Sayaç artınca küçük zıplama (key değişince animasyon yeniden başlar) */
function useBump(value: number) {
  const prev = useRef(value);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (value > prev.current) setN((x) => x + 1);
    prev.current = value;
  }, [value]);
  return n;
}

export function TopBar({ onSettings }: { onSettings: () => void }) {
  const s = useGame();
  const starBump = useBump(s.stars);
  const heartBump = useBump(s.hearts);
  return (
    <header class="topbar">
      <div class="needs">
        {needs.map((n) => {
          const v = Math.round(s.needs[n.id]);
          return (
            <div class="need" key={n.id} role="meter" aria-label={n.label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
              <span class="need-label"><Icon name={n.icon} size={14} />{n.label}</span>
              <div class="need-bar"><div class={`need-fill ${v < 35 ? 'low' : ''}`} style={{ width: `${v}%` }} /></div>
            </div>
          );
        })}
      </div>
      <div class="wallet">
        <span key={`s${starBump}`} class={`coin ${starBump ? 'bump' : ''}`} aria-label={`${s.stars} yıldız`}><Icon name="star" size={18} />{s.stars}</span>
        <span key={`h${heartBump}`} class={`coin ${heartBump ? 'bump' : ''}`} aria-label={`${s.hearts} kalp`}><Icon name="heart" size={18} />{s.hearts}</span>
        <button class="icon-btn" onClick={onSettings} aria-label="Ayarlar"><Icon name="settings" size={22} /></button>
      </div>
    </header>
  );
}
