// Doğum günü mektubu: mumlar sönünce (ve Birlikte → Doğum günü notu) açılır.
// Zarf ışıltılar içinde süzülerek gelir → dokununca mühür patlar, kapak açılır, mektup yükselir,
// simli bir patlama olur → not açılır.
// Notun metni: src/content/dogum-gunu-notu.txt   Başlık ve imza: src/content/config.ts → intro
import { useEffect, useMemo, useState } from 'preact/hooks';
import { sfx } from '../../core/sfx';
import { config } from '../../content/config';
import noteText from '../../content/dogum-gunu-notu.txt?raw';
import { Overlay } from '../components/Bits';

/** Boş satırla ayrılan bloklar paragraf olur */
const paragraphs = noteText.trim().split(/\r?\n\s*\r?\n/);
const GLITTER = ['#ffd36e', '#ffe9a8', '#ff9ec0', '#ffffff', '#f7b6c8', '#ffcf7a'];

type Step = 'arrive' | 'ready' | 'opening' | 'note';

export function Letter({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('arrive');

  useEffect(() => {
    const t = setTimeout(() => setStep((s) => (s === 'arrive' ? 'ready' : s)), 950);
    return () => clearTimeout(t);
  }, []);

  const open = () => {
    if (step === 'opening' || step === 'note') return;
    setStep('opening');
    sfx('whoosh');
    setTimeout(() => { setStep('note'); sfx('success'); }, 1500);
  };

  // Çevrede parıldayan yıldızcıklar ve açılınca patlayan sim (rastgele ama render başına sabit)
  const twinkles = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    left: `${8 + Math.random() * 84}%`, top: `${12 + Math.random() * 70}%`,
    delay: `${(i * 0.23) % 2.4}s`, size: `${10 + Math.random() * 12}px`,
  })), []);
  const glitter = useMemo(() => Array.from({ length: 70 }, (_, i) => {
    const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 190;
    return {
      dx: `${Math.cos(a) * d}px`, dy: `${Math.sin(a) * d - 60}px`, r: `${Math.random() * 540 - 270}deg`,
      delay: `${Math.random() * 0.25}s`, color: GLITTER[i % GLITTER.length], w: `${3 + Math.random() * 5}px`,
      star: i % 4 === 0,
    };
  }), []);

  return (
    <Overlay class={`lt lt-${step}`}>
      <div class="lt-glow" aria-hidden="true" />
      {twinkles.map((t, i) => (
        <span key={i} class="lt-twinkle" aria-hidden="true" style={{ left: t.left, top: t.top, animationDelay: t.delay, fontSize: t.size }}>✦</span>
      ))}

      {step !== 'note' ? (
        <>
          <button class="icon-btn lt-close" onClick={onClose} aria-label="Kapat">✕</button>
          <p class="lt-line">{config.intro.envelopeLine}</p>
          <button class="lt-env" onClick={open} aria-label="Mektubu aç">
            <span class="lt-back" />
            <span class="lt-paper"><span /><span /><span /></span>
            <span class="lt-front" />
            <span class="lt-flap" />
            <span class="lt-seal">♥</span>
            <span class="lt-shine" />
            {step === 'opening' && (
              <span class="lt-burst" aria-hidden="true">
                {glitter.map((g, i) => (
                  <i
                    key={i}
                    class={g.star ? 'star' : ''}
                    style={{ '--dx': g.dx, '--dy': g.dy, '--r': g.r, animationDelay: g.delay, background: g.star ? 'none' : g.color, color: g.color, width: g.w, height: g.w }}
                  >{g.star ? '✦' : ''}</i>
                ))}
              </span>
            )}
          </button>
          <p class="lt-hint">{step === 'opening' ? '✨' : 'Dokun, aç ✨'}</p>
        </>
      ) : (
        <div class="note-paper lt-note" role="dialog" aria-label="Doğum günü notu">
          <div class="note-scroll">
            <h1>{config.intro.title}</h1>
            {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            <p class="note-sign">{config.intro.signature}</p>
          </div>
          <button class="btn primary" onClick={onClose}>Kapat</button>
        </div>
      )}
    </Overlay>
  );
}
