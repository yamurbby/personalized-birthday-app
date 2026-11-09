// Odadaki müzik çalar: images/muzik'teki şarkı (src/content/music.ts) ya da yoksa küçük bir müzik kutusu melodisi.
// Sadece "Müzik aç" ile başlar, "Durdur" ile ya da odadan çıkınca durur. Ayarlar'da ses kapalıysa çalmaz.
import { song } from '../content/music';

const files = import.meta.glob('../assets/music/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const songUrl = files[`../assets/music/${song.file}.mp3`];

/** Ekranda gösterilecek ad */
export const nowPlayingTitle = songUrl ? song.title : 'Müzik kutusu';

let audio: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let timer = 0;
let playing = false;
const listeners = new Set<(p: boolean) => void>();
const emit = () => listeners.forEach((l) => l(playing));

export function onMusic(fn: (p: boolean) => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export const isMusicPlaying = () => playing;

export function playMusic() {
  if (playing) return;
  playing = true;
  if (songUrl) {
    audio ??= new Audio(songUrl);
    audio.loop = true;
    audio.currentTime = 0;
    audio.volume = 0.8;
    audio.play().catch(() => { playing = false; emit(); });
  } else {
    playMusicBox();
  }
  emit();
}

export function stopMusic() {
  if (!playing) return;
  playing = false;
  audio?.pause();
  clearInterval(timer);
  if (ctx && ctx.state !== 'closed') void ctx.suspend();
  emit();
}

/** Dosya yoksa: tekrarlayan neşeli bir müzik kutusu melodisi (WebAudio, telifsiz) */
function playMusicBox() {
  try {
    ctx ??= new AudioContext();
    void ctx.resume();
  } catch { playing = false; return; }
  // C majör, 3/4 ritimde küçük bir vals (her nota: [Hz, vuruş])
  const melody: [number, number][] = [
    [523, 1], [659, 1], [784, 1], [880, 2], [784, 1], [659, 1], [587, 1], [523, 1], [587, 2], [0, 1],
    [659, 1], [784, 1], [988, 1], [1047, 2], [988, 1], [880, 1], [784, 1], [659, 1], [523, 2], [0, 1],
  ];
  const beat = 0.28;
  const total = melody.reduce((s, [, b]) => s + b, 0) * beat;
  const once = () => {
    if (!ctx || !playing) return;
    let t = ctx.currentTime + 0.05;
    for (const [f, b] of melody) {
      if (f) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + b * beat * 1.6);
        o.connect(g).connect(ctx.destination);
        o.start(t); o.stop(t + b * beat * 1.7);
      }
      t += b * beat;
    }
  };
  once();
  timer = window.setInterval(once, total * 1000);
}
