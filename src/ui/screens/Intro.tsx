// Doğum günü girişi: ikiniz pastanın başında; Pelin dilek tutar, mumları üfler.
// (Kişisel not burada değil: Kampüs haritası bitince açılır → ui/screens/Letter.tsx)
import { useEffect, useState } from 'preact/hooks';
import { actions } from '../../core/store';
import { presetLook } from '../../core/save';
import { sfx } from '../../core/sfx';
import { config } from '../../content/config';
import { theme } from '../../theme';
import { Confetti, Icon, Overlay } from '../components/Bits';
import { Cake, CANDLES } from '../components/Cake';
import { Character } from '../components/Character';

/** Girişte ikiniz parti kombinlerinizle */
const partyLooks = { pelin: presetLook('p_party') ?? {}, partner: presetLook('b_party') ?? {} };

type Step = 'ready' | 'wish' | 'blow' | 'yay' | 'tips';

const tips = [
  { icon: 'feed', text: 'Odada Pelin’i besle, dinlendir ve neşelendir.' },
  { icon: 'tab_campus', text: 'Yolculuk’taki haritada durak durak ilerle, anılarımızı aç.' },
  { icon: 'album', text: 'Açtığın anılar Birlikte’de toplanır. Yolun sonunda sana bir notum var!' },
];

/**
 * Sahne yerleşimi. Her şey bu sabitlerden hesaplanır; sahne bütün olarak ekrana göre ölçeklenir,
 * böylece oranlar her ekranda aynı kalır. İki karakter de AYNI genişlikte (CHAR_W) ve aynı zeminde.
 */
const STAGE_W = 360, STAGE_H = 440;
const FLOOR = 30; // zemin çizgisi (alttan)
const CHAR_W = 136; // iki karakterin ortak genişliği
const CHAR_H = Math.round(CHAR_W * theme.characters.pelin.aspect);
const PARTNER_X = 2, PELIN_X = 104;
/** Pelin'in ağzının karakter kutusundaki yeri (avatar katmanlarına göre) */
const MOUTH = { x: PELIN_X + CHAR_W * 0.6715, y: STAGE_H - FLOOR - CHAR_H + CHAR_H * 0.4844 };
const CAKE = { w: 140, h: 105 };
/** Pasta Pelin'in önünü kapatmasın: gövdesinin sağ yanından başlar; mumlar ağız hizasında */
const cakeLeft = Math.min(STAGE_W - CAKE.w - 4, Math.round(PELIN_X + CHAR_W * 0.74));
const CANDLE_X = cakeLeft + (CANDLES[0].x / 100) * CAKE.w;
const cakeBottom = Math.round(STAGE_H - (MOUTH.y - 4 - (CANDLES[0].y / 100) * CAKE.h) - CAKE.h);
const layout = {
  partner: { left: PARTNER_X, bottom: FLOOR },
  pelin: { left: PELIN_X, bottom: FLOOR },
  table: { left: cakeLeft - 14, bottom: FLOOR, width: Math.min(CAKE.w + 28, STAGE_W - cakeLeft + 14), height: cakeBottom - FLOOR },
  cake: { left: cakeLeft, bottom: cakeBottom, width: CAKE.w, height: CAKE.h },
  tap: { left: cakeLeft + CAKE.w / 2 - 20, bottom: FLOOR - 6 },
  // Konuşma balonları başların hemen üstünde (saçın tepesi kutunun ~%10'u aşağıda)
  bubbleLeft: { left: 0, bottom: FLOOR + Math.round(CHAR_H * 0.9) },
  bubbleRight: { left: PELIN_X + 4, bottom: FLOOR + Math.round(CHAR_H * 0.9) },
};
const px = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, `${v}px`]));
/** Rüzgâr çizgileri: ağızdan ilk muma kadar (mesafeye göre uzar) */
const wind = [-6, 0, 6].map((dy, i) => {
  const x = MOUTH.x + 6, y = MOUTH.y + dy;
  const L = Math.max(30, CANDLE_X - x + 6 + i * 4);
  return `M${x} ${y} q${L * 0.28} ${-4 + i * 2} ${L * 0.55} ${-3 + i} q${L * 0.22} 1 ${L * 0.45} ${-4 - i * 2}`;
});


/** Geliştirme: ?introStep=blow gibi bir adımda sahneyi dondurur (görsel kontrol için). */
const frozen = import.meta.env.DEV ? (new URLSearchParams(location.search).get('introStep') as Step | null) : null;

/** onDone verilirse (Ayarlar → tekrar izle) ilerlemeye dokunmadan kapanır. */
export function Intro({ onDone }: { onDone?: () => void }) {
  const [step, setStep] = useState<Step>(frozen ?? 'ready');
  // Donmuş test adımında mumlar o adıma uygun görünsün (üflemeden sonrası: hepsi sönük)
  const afterBlow = frozen !== null && ['yay', 'tips'].includes(frozen);
  const [out, setOut] = useState(afterBlow ? [true, true, true] : frozen === 'blow' ? [true, false, false] : [false, false, false]);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(1.15, (window.innerWidth - 8) / STAGE_W, (window.innerHeight * 0.62) / STAGE_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Dilek → üfleme → mumlar teker teker söner → kutlama → nasıl oynanır
  useEffect(() => {
    if (frozen) return;
    const t: number[] = [];
    const at = (ms: number, fn: () => void) => t.push(window.setTimeout(fn, ms));
    if (step === 'wish') at(1600, () => setStep('blow'));
    if (step === 'blow') {
      sfx('whoosh');
      [350, 600, 850].forEach((ms, i) => at(ms, () => setOut((o) => o.map((v, j) => v || j === i))));
      at(1300, () => setStep('yay'));
    }
    if (step === 'yay') {
      sfx('success');
      at(2400, () => setStep('tips'));
    }
    return () => t.forEach(clearTimeout);
  }, [step]);

  const pelinFace = step === 'wish' ? 'wish' : step === 'blow' ? 'blow' : undefined;
  const happy = !['ready', 'wish', 'blow'].includes(step);
  const bg = theme.roomBackground?.kind === 'img' ? theme.roomBackground.src : undefined;

  return (
    <Overlay class="intro2">
      {bg && <img class="intro-bg" src={bg} alt="" draggable={false} />}
      {(step === 'yay' || step === 'tips') && <Confetti count={70} />}

      <div class="stage-wrap" style={{ height: `${STAGE_H * scale}px` }}>
        <div
          role="button"
          tabIndex={0}
          class={`stage step-${step}`}
          style={{ width: `${STAGE_W}px`, height: `${STAGE_H}px`, transform: `scale(${scale})` }}
          onClick={() => step === 'ready' && setStep('wish')}
          aria-label="Pastaya dokun, Pelin mumları üflesin"
        >
          <div class="st" style={px(layout.partner)}>
            <Character who="partner" mood={happy ? 'happy' : 'idle'} size={CHAR_W} look={partyLooks.partner} />
          </div>
          <div class="st" style={px(layout.pelin)}>
            <Character who="pelin" mood={happy ? 'happy' : 'idle'} face={pelinFace} size={CHAR_W} look={partyLooks.pelin} />
          </div>
          <div class="st st-table" style={px(layout.table)} />
          <div class={`st st-cake ${step === 'ready' ? 'glow' : ''}`} style={px(layout.cake)}>
            <Cake out={out} />
          </div>

          {step === 'blow' && (
            <svg class="st wind" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} aria-hidden="true">
              {wind.map((d) => <path key={d} d={d} />)}
            </svg>
          )}

          {step === 'ready' && (
            <>
              <div class="st st-bubble left" style={px(layout.bubbleLeft)}>İyi ki doğdun {config.pelinName}! Bir dilek tut, sonra mumları üfle!</div>
              <span class="st tap-hand" style={px(layout.tap)} aria-hidden="true"><Icon name="tap" size={40} /></span>
            </>
          )}
          {step === 'wish' && <div class="st st-bubble right" style={px(layout.bubbleRight)}>Dilek tutuyorum…</div>}
          {step === 'yay' && <div class="st st-bubble right" style={px(layout.bubbleRight)}>Yaşasııın!</div>}
        </div>
      </div>

      {step === 'tips' && (
        <div class="letter-card">
          <h2>Nasıl oynanır?</h2>
          <ul class="tips">
            {tips.map((t) => <li key={t.icon}><Icon name={t.icon} size={32} /><span>{t.text}</span></li>)}
          </ul>
          <p class="intro-hint">İpucu: Tarayıcı menüsünden “Ana ekrana ekle” dersen uygulama gibi açılır ve ilerlemen daha güvende olur.</p>
          <button class="btn primary" onClick={() => (onDone ? onDone() : actions.finishIntro())}>Odaya git</button>
        </div>
      )}
    </Overlay>
  );
}
