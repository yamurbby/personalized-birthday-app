// Küçük ortak arayüz parçaları.
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { onToast, type ToastMsg } from '../../core/events';
import { theme } from '../../theme';
import { Art } from './Art';

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  return <Art art={theme.icons[name] ?? { kind: 'emoji', emoji: '•' }} size={size} />;
}

export function Sheet({ title, onClose, children, tall }: {
  title: string; onClose: () => void; children: ComponentChildren; tall?: boolean;
}) {
  return (
    <div class="sheet-backdrop" onClick={onClose}>
      <div class={`sheet ${tall ? 'tall' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div class="sheet-head">
          <h2>{title}</h2>
          <button class="icon-btn" onClick={onClose} aria-label="Kapat">✕</button>
        </div>
        <div class="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Overlay({ children, class: cls = '' }: { children: ComponentChildren; class?: string }) {
  return <div class={`overlay ${cls}`}>{children}</div>;
}

export function Bubble({ text }: { text: string | null }) {
  if (!text) return null;
  return <div class="bubble" key={text}>{text}</div>;
}

export function Toasts() {
  const [list, setList] = useState<ToastMsg[]>([]);
  useEffect(() => onToast((t) => {
    setList((l) => [...l.slice(-2), t]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 2400);
  }), []);
  return (
    <div class="toasts" aria-live="polite">
      {list.map((t) => <div key={t.id} class={`toast ${t.kind}`}>{t.text}{t.icon && <Icon name={t.icon} size={16} />}</div>)}
    </div>
  );
}

const COLORS = ['#ff8fa8', '#ffd36e', '#8fd3ff', '#b8f0a8', '#c8a8ff'];
export function Confetti({ count = 40 }: { count?: number }) {
  return (
    <div class="confetti" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${Math.random() * 100}%`,
            background: COLORS[i % COLORS.length],
            animationDelay: `${Math.random() * 0.8}s`,
            animationDuration: `${2 + Math.random() * 1.5}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/** Kilit kuralını okunur metne çevirir. */
export function CostTag({ cost }: { currency: 'stars'; cost: number }) {
  return <span class="cost"><Icon name="star" size={16} />{cost}</span>;
}
