// Kampüs: yolculuk haritası. Duraklar content/journey.ts'ten, görevler src/games/'ten gelir.
// İlk durak en altta; yol yukarı doğru kıvrılarak final (pasta) durağına çıkar.
import { createPortal } from 'preact/compat';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { toast } from '../../core/events';
import { isFinal, stopPhotos, stopStatus, type StopStatus } from '../../core/journey';
import { actions, useGame } from '../../core/store';
import { stops } from '../../content/journey';
import { paintings, paintingUrl } from '../../content/vangogh';
import { theme } from '../../theme';
import { Icon } from '../components/Bits';
import { Character } from '../components/Character';
import { GameHost } from './GameHost';
import { Letter } from './Letter';
import { StopMemory } from './StopMemory';

/** Harita ölçüleri (px). Duraklar arası dikey mesafe, üst/alt boşluk (üstte başlık şeridi kadar ek pay: final etiketi kesilmesin). */
const HEAD_H = 60;
const GAP = 170, PAD_TOP = 150 + HEAD_H, PAD_BOTTOM = 120;
/** Karakter genişliği: ikisi de aynı boyutta */
const CHAR_W = 50;
const CHAR_H = Math.round(CHAR_W * theme.characters.pelin.aspect);
/** Bir segmenti yürüme süresi (ms) */
const WALK_MS = 1100;

const N = stops.length;
const mapHeight = PAD_TOP + PAD_BOTTOM + N * GAP;

type Pt = { x: number; y: number };
/** i = -1 başlangıç noktası, 0..N-1 duraklar. Yol sağa sola kıvrılır. */
const point = (i: number, w: number): Pt => ({
  x: w * (0.5 + 0.24 * Math.sin(((i + 1) * Math.PI) / 2)),
  y: mapHeight - PAD_BOTTOM - (i + 1) * GAP,
});
/** (i-1) → i arasındaki kıvrım: kübik Bézier kontrol noktaları */
function segment(i: number, w: number): [Pt, Pt, Pt, Pt] {
  const a = point(i - 1, w), b = point(i, w);
  return [a, { x: a.x, y: a.y - GAP * 0.55 }, { x: b.x, y: b.y + GAP * 0.55 }, b];
}
function bezier([a, b, c, d]: [Pt, Pt, Pt, Pt], t: number): Pt {
  const u = 1 - t;
  const k = (p: keyof Pt) => u * u * u * a[p] + 3 * u * u * t * b[p] + 3 * u * t * t * c[p] + t * t * t * d[p];
  return { x: k('x'), y: k('y') };
}
const segPath = (i: number, w: number) => {
  const [a, b, c, d] = segment(i, w);
  return `M${a.x} ${a.y} C${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}`;
};
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

type Flow =
  | { kind: 'task'; index: number; task: string }
  | { kind: 'memory'; index: number; fresh: boolean }
  /** after: mektup kapanınca bu durağın anısı açılır (final: mumlar → mektup → anı) */
  | { kind: 'letter'; after?: number }
  | null;

export function Campus() {
  const s = useGame();
  const done = s.journey.done;
  const mapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(360);
  const [flow, setFlow] = useState<Flow>(null);
  /** karakterlerin durduğu durak (-1 = başlangıç) ve yürürken anlık konum */
  const [at, setAt] = useState(done - 1);
  const [walkPos, setWalkPos] = useState<Pt | null>(null);

  // Genişliği ölç (yol ekran genişliğine göre çizilir)
  useLayoutEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  /** Haritayı bir durağa kaydır (ekranın ortasına) */
  const scrollTo = (i: number, smooth: boolean) => {
    const map = mapRef.current;
    const scroller = map?.closest('.content') as HTMLElement | null;
    if (!map || !scroller) return;
    const top = map.offsetTop + point(i, w).y - scroller.clientHeight * 0.55;
    scroller.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
  };

  // Açılınca sıradaki durağa kaydır
  useLayoutEffect(() => { scrollTo(Math.min(done, N - 1), false); }, [w > 0]);

  // Yeni durak açılınca (ekranlar kapanınca) karakterler yol boyunca yürür
  useEffect(() => {
    const target = done - 1;
    if (flow || target === at) return;
    if (target < at) { setAt(target); return; } // geliştirici sıfırlaması: yürümeden geç
    let raf = 0;
    const from = at, start = performance.now();
    const total = (target - from) * WALK_MS;
    scrollTo(target, true);
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / total);
      const along = ease(p) * (target - from); // kaç segment yüründü (ondalıklı)
      const seg = Math.min(target, from + 1 + Math.floor(along));
      setWalkPos(bezier(segment(seg, w), along - (seg - from - 1)));
      if (p < 1) raf = requestAnimationFrame(step);
      else { setWalkPos(null); setAt(target); }
    };
    raf = requestAnimationFrame(step);
    // Yürüyüş yarıda kesilirse (ör. bu arada bir durağa dokunuldu) hedefe ışınla, yolda donmasın
    return () => { cancelAnimationFrame(raf); setWalkPos(null); setAt(target); };
  }, [done, flow, w]);

  const tap = (i: number) => {
    const st = stopStatus(s, i);
    if (st === 'open') return setFlow({ kind: 'memory', index: i, fresh: false });
    if (st === 'locked') return toast('Önce sıradaki durağı aç', 'info', 'lock');
    const task = stops[i].task;
    if (task) return setFlow({ kind: 'task', index: i, task });
    actions.completeStop(i);
    setFlow({ kind: 'memory', index: i, fresh: true });
  };

  const charPos = walkPos ?? point(at, w);
  const finished = done >= N;

  return (
    <section class="screen journey-screen">
      <header class="journey-head">
        <h1>Yolculuğumuz</h1>
        <span class="journey-count">{finished ? 'Tamamlandı!' : `${done}/${N} durak`}</span>
      </header>

      <div class="journey-map" ref={mapRef} style={{ height: `${mapHeight}px` }}>
        <Backdrop />
        <Twinkles w={w} />
        {/* Yolun sonunda not olduğunu baştan söyle (yolculuk bitince kalkar; not Birlikte'de durur) */}
        {!finished && (
          <div class="final-hint" style={pos({ x: point(N - 1, w).x, y: point(N - 1, w).y - 58 })}>
            💌 Yolun sonunda sana bir notum var
          </div>
        )}
        <svg class="journey-svg" width={w} height={mapHeight} aria-hidden="true">
          {stops.map((_, i) => <path key={`s${i}`} class="road-shadow" d={segPath(i, w)} />)}
          {stops.map((_, i) => <path key={`b${i}`} class="road-edge" d={segPath(i, w)} />)}
          {stops.map((_, i) => <path key={`r${i}`} class="road" d={segPath(i, w)} />)}
          {stops.map((_, i) => <path key={`d${i}`} class={`road-dash ${i < done ? 'walked' : ''}`} d={segPath(i, w)} />)}
        </svg>

        <div class="journey-start" style={pos(point(-1, w))}>Başlangıç</div>
        <p class="vg-credit">Arka plan: Vincent van Gogh</p>

        {stops.map((stop, i) => (
          <StopBadge
            key={stop.id}
            index={i}
            status={stopStatus(s, i)}
            p={point(i, w)}
            thumb={stopPhotos(stop)[0]?.thumb}
            title={stop.title}
            onTap={() => tap(i)}
          />
        ))}

        <div
          class={`journey-duo ${walkPos ? 'walking' : ''}`}
          style={{ left: `${charPos.x - CHAR_W}px`, top: `${charPos.y - CHAR_H - (walkPos ? 8 : at < 0 ? 14 : 22)}px` }}
          aria-hidden="true"
        >
          <Character who="pelin" mood="happy" size={CHAR_W} />
          <Character who="partner" mood="happy" size={CHAR_W} />
        </div>
      </div>

      {/* Ekranlar kaydırılan haritanın değil uygulamanın üstünde açılır */}
      {flow && createPortal(<>
      {flow?.kind === 'task' && (
        <GameHost
          task={flow.task}
          index={flow.index}
          onExit={() => setFlow(null)}
          onComplete={() => {
            actions.completeStop(flow.index);
            // Final: mumlar söner söner mektup gelir; anı mektuptan sonra
            setFlow(isFinal(flow.index) ? { kind: 'letter', after: flow.index } : { kind: 'memory', index: flow.index, fresh: true });
          }}
        />
      )}
      {flow?.kind === 'memory' && (
        <StopMemory
          index={flow.index}
          fresh={flow.fresh}
          onClose={() => setFlow(null)}
          onContinue={() => setFlow(isFinal(flow.index) ? { kind: 'letter' } : null)}
        />
      )}
      {flow?.kind === 'letter' && (
        <Letter onClose={() => setFlow(flow.after != null ? { kind: 'memory', index: flow.after, fresh: false } : null)} />
      )}
      </>, document.querySelector('.app') ?? document.body)}
    </section>
  );
}

const pos = (p: Pt) => ({ left: `${p.x}px`, top: `${p.y}px` });

function StopBadge({ index, status, p, thumb, title, onTap }: {
  index: number; status: StopStatus; p: Pt; thumb?: string; title: string; onTap: () => void;
}) {
  const final = isFinal(index);
  const label = final ? 'Doğum günü!' : status === 'open' ? title : status === 'next' ? 'Sıradaki durak' : '';
  const aria = status === 'locked' ? `${index + 1}. durak, kilitli` : `${index + 1}. durak: ${status === 'open' ? title : 'sıradaki'}`;
  return (
    <div class={`stop ${status} ${final ? 'final' : ''}`} style={pos(p)}>
      <button class="stop-badge" onClick={onTap} aria-label={aria}>
        {final ? (
          <Icon name="cake" size={40} />
        ) : status === 'open' ? (
          thumb ? <img src={thumb} alt="" loading="lazy" decoding="async" draggable={false} /> : <Icon name="photo" size={26} />
        ) : status === 'next' ? (
          <span class="stop-num">{index + 1}</span>
        ) : (
          <Icon name="lock" size={24} />
        )}
        {status === 'open' && !final && <span class="stop-check" aria-hidden="true">✓</span>}
      </button>
      {label && <span class="stop-label">{label}</span>}
    </div>
  );
}

/** Tablolar arası yumuşak geçiş yüksekliği (px) */
const FADE = 180;

/**
 * Van Gogh arka planı (src/content/vangogh.ts): her tablo kendi dikey bölümünü "cover" ile kaplar,
 * komşularıyla mask-image geçişiyle üst üste biner. Görsel yüklenene kadar baskın renk görünür.
 * Üstte açık bir perde: pastel arayüzle uyum ve okunabilirlik (gece tablosunda daha hafif).
 */
function Backdrop() {
  const total = paintings.reduce((s, p) => s + p.share, 0) || 1;
  let fromBottom = 0;
  return (
    <div class="vg" aria-hidden="true">
      {paintings.map((p, i) => {
        const h = (p.share / total) * mapHeight;
        const top = mapHeight - fromBottom - h;
        fromBottom += h;
        const first = i === 0, last = i === paintings.length - 1;
        // Komşuya doğru uzayıp kenarı saydamlaşır (en alt ve en üst kenar sert kalır)
        const t0 = last ? 0 : FADE, b0 = first ? 0 : FADE;
        const mask = `linear-gradient(to bottom, transparent 0, #000 ${t0}px, #000 calc(100% - ${b0}px), transparent 100%)`;
        const url = paintingUrl(p.file);
        return (
          <div
            key={p.file}
            class="vg-part"
            style={{
              top: `${top - t0 / 2}px`, height: `${h + t0 / 2 + b0 / 2}px`, zIndex: i + 1,
              background: p.color, WebkitMaskImage: mask, maskImage: mask,
            }}
          >
            {url && <img src={url} alt="" loading="lazy" decoding="async" draggable={false} style={{ objectPosition: p.focus ?? '50% 50%' }} />}
            <span class="vg-veil" style={{ opacity: p.veil }} />
          </div>
        );
      })}
    </div>
  );
}

/** Doğum günü durağının çevresinde hafifçe parıldayan yıldızlar */
function Twinkles({ w }: { w: number }) {
  const c = point(N - 1, w);
  const spots = [[-0.32, -0.55], [0.3, -0.7], [-0.4, 0.1], [0.38, 0.05], [-0.15, -0.95], [0.18, 0.42], [-0.3, 0.5], [0.05, -1.2]];
  return (
    <>
      {spots.map(([dx, dy], i) => (
        <span key={i} class="vg-star" style={{ left: `${c.x + dx * w}px`, top: `${c.y + dy * 110}px`, animationDelay: `${(i * 0.37) % 2}s` }}>✦</span>
      ))}
    </>
  );
}
