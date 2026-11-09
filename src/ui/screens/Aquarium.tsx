// Akvaryum: balık tutmada yakaladığın balıklar burada yüzer. Altta koleksiyon (ad + adet).
// Balık listesi ve görseller: src/games/fish-config.js   Kayıt: SaveState.fish (balık id → adet)
import { useEffect, useRef, useState } from 'preact/hooks';
import { useGame } from '../../core/store';
import { drawFish, FISH, loadSheets, SPRITE } from '../../games/fish-config.js';
import { Overlay } from '../components/Bits';

/** Akvaryuma girenler: çöp ve mektuplu şişe hariç */
const collectible = FISH.filter((f: any) => f.type !== 'trash' && f.type !== 'special');
/** Tankta en fazla kaç balık yüzsün (çok yakalanınca kalabalık olmasın) */
const MAX_SWIMMERS = 18;

interface Swimmer { f: any; x: number; y: number; dir: number; v: number; t: number; s: number }

export function Aquarium({ onClose }: { onClose: () => void }) {
  const s = useGame();
  const caught = s.fish ?? {};
  const owned = collectible.filter((f: any) => (caught[f.id] ?? 0) > 0);
  const total = owned.reduce((n: number, f: any) => n + caught[f.id], 0);
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [sheets, setSheets] = useState<Record<string, HTMLImageElement>>({});

  useEffect(() => { loadSheets().then(setSheets); }, []);

  // Tank: yakalanan her türden (adediyle orantılı, en fazla MAX_SWIMMERS) balık yüzer
  useEffect(() => {
    const c = canvas.current, el = box.current;
    if (!c || !el || !Object.keys(sheets).length) return;
    const ctx = c.getContext('2d')!;
    let W = 0, H = 0, dpr = 1, raf = 0, last = performance.now();
    const fit = () => {
      W = el.clientWidth; H = el.clientHeight; dpr = Math.min(window.devicePixelRatio || 1, 3);
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      c.style.width = `${W}px`; c.style.height = `${H}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    // Yakalanan adet kadar balık; sınır aşılırsa her türden en az bir tane kalır, gerisi rastgele
    const extra: any[] = [];
    for (const f of owned) for (let i = 1; i < caught[f.id]; i++) extra.push(f);
    const chosen = [...owned, ...extra.sort(() => Math.random() - 0.5)].slice(0, MAX_SWIMMERS);
    const size = () => Math.min(W * 0.13, 56);
    const fish: Swimmer[] = chosen.map((f) => {
      const shell = f.type === 'shell';
      return {
        f, dir: Math.random() < 0.5 ? 1 : -1, t: Math.random() * 6,
        s: size() * (f.rarity === 'legendary' ? 1.3 : 1),
        x: Math.random() * W, y: shell ? H - size() * 0.55 : H * (0.15 + Math.random() * 0.62),
        v: W * (shell ? 0.02 : 0.05 + Math.random() * 0.07) * (f.speed ?? 1),
      };
    });
    const bubbles = Array.from({ length: 12 }, () => ({ x: Math.random(), y: Math.random(), r: 1.5 + Math.random() * 3, v: 0.04 + Math.random() * 0.06 }));
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce) {
        for (const p of fish) {
          p.t += dt;
          p.x += p.dir * p.v * dt;
          if (p.x < p.s / 2) { p.x = p.s / 2; p.dir = 1; }
          if (p.x > W - p.s / 2) { p.x = W - p.s / 2; p.dir = -1; }
        }
        for (const b of bubbles) { b.y -= b.v * dt; if (b.y < 0) { b.y = 1; b.x = Math.random(); } }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#d6f0fb'); g.addColorStop(1, '#7db7dc');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // Işık, yosun, kum
      ctx.fillStyle = 'rgba(255,255,255,.14)';
      for (let i = 0; i < 3; i++) { const x = (i + 0.3) * (W / 3); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + W * 0.08, 0); ctx.lineTo(x - W * 0.08, H); ctx.lineTo(x - W * 0.18, H); ctx.fill(); }
      ctx.fillStyle = '#f3e1bf'; ctx.beginPath(); ctx.ellipse(W / 2, H + 10, W * 0.75, 30, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#9fdcc0';
      for (let i = 0; i < 6; i++) {
        const x = (i + 0.5) * (W / 6), h = H * (0.12 + (i % 3) * 0.05);
        ctx.beginPath(); ctx.ellipse(x + Math.sin(now / 700 + i) * 3, H - h / 2, 5, h / 2, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 1.2;
      for (const b of bubbles) { ctx.beginPath(); ctx.arc(b.x * W, b.y * H, b.r, 0, Math.PI * 2); ctx.stroke(); }
      for (const p of fish) drawFish(ctx, sheets, p.f, p.x, p.y + Math.sin(p.t * 2) * 3, p.s, dpr, p.dir > 0);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [sheets, total]);

  /** Koleksiyon kartındaki küçük sprite (CSS ile sheet'ten kesilir) */
  const icon = (f: any) => {
    const img = sheets[f.sheet];
    if (!img?.naturalWidth) return null;
    const k = 3; // 16px → 48px
    return (
      <span
        class={`aq-sprite ${f.rotate ? 'rot' : ''}`}
        style={{
          backgroundImage: `url("${img.src}")`,
          backgroundSize: `${img.naturalWidth * k}px ${img.naturalHeight * k}px`,
          backgroundPosition: `-${f.col * SPRITE * k}px -${f.row * SPRITE * k}px`,
        }}
      />
    );
  };

  return (
    <Overlay class="aquarium">
      <header class="album-head">
        <button class="icon-btn" onClick={onClose} aria-label="Geri">←</button>
        <h1>Akvaryum</h1>
        <span class="muted">{owned.length}/{collectible.length}</span>
      </header>

      <div class="aq-tank" ref={box}>
        <canvas ref={canvas} aria-label={`Akvaryumda ${total} balık`} />
        {total === 0 && <p class="aq-empty">Henüz balık yok. 5. duraktaki balık tutmada yakaladıkların burada yüzecek 🎣</p>}
      </div>

      <h2 class="album-section">Koleksiyon <span class="muted">{total} balık</span></h2>
      <div class="aq-grid">
        {collectible.map((f: any) => {
          const n = caught[f.id] ?? 0;
          return (
            <div key={f.id} class={`aq-card ${n ? '' : 'unknown'} ${f.rarity}`}>
              <span class="aq-pic">{icon(f)}</span>
              <span class="aq-name">{n ? f.name : '???'}</span>
              {n > 0 && <span class="aq-count">×{n}</span>}
            </div>
          );
        })}
      </div>
    </Overlay>
  );
}
