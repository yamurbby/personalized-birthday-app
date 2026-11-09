// Dosyasız küçük ses efektleri (WebAudio). Çevrimdışı çalışır.
// Gerçek ses dosyaları istenirse bu modülün içi değişir, çağıranlar aynı kalır.
export type Sfx = 'pop' | 'coin' | 'success' | 'fail' | 'flip' | 'whoosh';

let ctx: AudioContext | null = null;
let enabled = true;
export function setSoundEnabled(v: boolean) { enabled = v; }

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export function sfx(name: Sfx) {
  if (!enabled) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    switch (name) {
      case 'pop': tone(660, 0, 0.12, 'triangle'); break;
      case 'flip': tone(440, 0, 0.06, 'square', 0.04); break;
      case 'whoosh': tone(300, 0, 0.15, 'sine', 0.06); tone(500, 0.05, 0.1, 'sine', 0.04); break;
      case 'coin': tone(988, 0, 0.08, 'square', 0.05); tone(1319, 0.08, 0.18, 'square', 0.05); break;
      case 'success': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.2, 'triangle')); break;
      case 'fail': tone(220, 0, 0.18, 'sawtooth', 0.04); break;
    }
  } catch { /* ses desteklenmiyor */ }
}
