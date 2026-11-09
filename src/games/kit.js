// Mini oyunların ortak yardımcıları: tuval kurulumu (DPR), döngü (delta time), temizlik,
// puan/parıltı/konfeti efektleri ve "Durak açıldı!" / "Tekrar dene" ekranları.
// Tüm oyunlar efektleri buradan çizer ki hepsi aynı stilde görünsün.

export const COLORS = {
  pink: '#ff7b93', pinkSoft: '#ffc4d2', cream: '#fff6f0', mint: '#bdebd6', mintDark: '#7fcfae',
  lilac: '#d8c8f5', sun: '#ffd36e', ink: '#4a3341', muted: '#9a8290', white: '#ffffff',
};
const CONFETTI = ['#ff8fa8', '#ffd36e', '#8fd3ff', '#b8f0a8', '#c8a8ff'];

/** Temizlik torbası: dinleyici, zamanlayıcı ve kapanış fonksiyonlarını toplar; run() hepsini bir kez çalıştırır. */
export function bag() {
  const fns = [];
  let done = false;
  return {
    get done() { return done; },
    add(fn) { fns.push(fn); return fn; },
    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      fns.push(() => target.removeEventListener(type, fn, opts));
    },
    timeout(fn, ms) { const id = setTimeout(fn, ms); fns.push(() => clearTimeout(id)); return id; },
    run() { if (done) return; done = true; while (fns.length) { try { fns.pop()(); } catch (e) { console.warn(e); } } },
  };
}

/**
 * Oyun sahnesi: container içine kök öğe + DPR'a göre keskin tuval kurar, boyut değişince günceller.
 * pixel: true → piksel sanat (yumuşatma kapalı).
 */
export function createStage(container, b, { pixel = false, className = '' } = {}) {
  const root = document.createElement('div');
  root.className = `gk ${pixel ? 'gk-pixel' : ''} ${className}`;
  const canvas = document.createElement('canvas');
  canvas.className = 'gk-canvas';
  root.append(canvas);
  container.append(root);
  b.add(() => root.remove());
  const ctx = canvas.getContext('2d');
  const stage = { root, canvas, ctx, W: 0, H: 0, dpr: 1, pixel, onResize: null };
  const fit = () => {
    stage.W = root.clientWidth; stage.H = root.clientHeight;
    stage.dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.max(1, Math.round(stage.W * stage.dpr));
    canvas.height = Math.max(1, Math.round(stage.H * stage.dpr));
    canvas.style.width = `${stage.W}px`; canvas.style.height = `${stage.H}px`;
    stage.begin();
    stage.onResize?.();
  };
  /** Her karenin başında: CSS pikseli koordinatlarına dön */
  stage.begin = () => {
    ctx.setTransform(stage.dpr, 0, 0, stage.dpr, 0, 0);
    ctx.imageSmoothingEnabled = !pixel;
  };
  const ro = new ResizeObserver(fit);
  ro.observe(root);
  b.add(() => ro.disconnect());
  fit();
  return stage;
}

/** requestAnimationFrame döngüsü; dt saniye cinsinden ve en fazla 0.05 (sekme dönüşünde sıçrama olmasın). */
export function loop(b, frame) {
  let raf = 0, last = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    frame(dt);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  b.add(() => cancelAnimationFrame(raf));
}

/** Üst bilgi çubuğu (DOM). parts: { key: başlangıç metni } → { key: öğe } */
export function hud(root, parts) {
  const bar = document.createElement('div');
  bar.className = 'gk-hud';
  const els = {};
  for (const [k, v] of Object.entries(parts)) {
    const s = document.createElement('span');
    s.className = `gk-chip gk-${k}`;
    s.innerHTML = v;
    bar.append(s);
    els[k] = s;
  }
  root.append(bar);
  return els;
}

/** İlerleme çubuğu (0..1) içeren çip içeriği */
export const progressHtml = (label, p) =>
  `${label}<i class="gk-bar"><em style="width:${Math.round(Math.max(0, Math.min(1, p)) * 100)}%"></em></i>`;

/** Kalan canlar */
export const livesText = (n, max) => '❤️'.repeat(Math.max(0, n)) + '🤍'.repeat(Math.max(0, max - n));

/**
 * Talimat yazısı. autoHide (ms): bu kadar süre sonra ya da ilk dokunuşta yavaşça söner
 * (balıkların, engellerin üstünde kalmasın). autoHide: 0 → sadece hide() ile söner (başlık gibi).
 */
export function hint(root, text, { autoHide = 3000 } = {}) {
  const p = document.createElement('p');
  p.className = 'gk-hint';
  p.textContent = text;
  root.append(p);
  let timer = 0;
  const hide = () => { clearTimeout(timer); p.classList.add('gone'); };
  const arm = () => { clearTimeout(timer); if (autoHide) timer = setTimeout(hide, autoHide); };
  if (autoHide) root.addEventListener('pointerdown', hide, { once: true });
  arm();
  return { el: p, set(t) { p.textContent = t; p.classList.remove('gone'); arm(); }, hide };
}

// ---------------------------------------------------------------------------
// Efektler: yukarı süzülen yazı, parıltı, konfeti (tuvale çizilir)
// ---------------------------------------------------------------------------
export function createFx(stage) {
  let texts = [], sparks = [], confetti = [];
  const font = getComputedStyle(stage.root).fontFamily || 'sans-serif';
  return {
    /** Puan yazısı: kind 'good' | 'bad' | 'big' */
    text(x, y, text, kind = 'good') {
      texts.push({ x, y, text, kind, t: 0 });
    },
    /** Küçük parıltı (yıldız noktaları) */
    sparkle(x, y, n = 14, colors = ['#ffd36e', '#ff8fa8', '#ffffff', '#9fdcd0']) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
        const v = (0.25 + Math.random() * 0.35) * Math.min(stage.W, 500);
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.6, c: colors[i % colors.length], r: 2 + Math.random() * 2.5 });
      }
    },
    /** Bir noktadan konfeti patlaması */
    burst(x, y, n = 16) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = (0.15 + Math.random() * 0.35) * Math.min(stage.W, 500);
        confetti.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, r: Math.random() * 6, vr: (Math.random() - 0.5) * 10,
          c: CONFETTI[i % CONFETTI.length], t: 0, life: 1.2, g: 500 });
      }
    },
    /** Ekranın üstünden yağan konfeti (kazanınca) */
    rain(n = 90) {
      for (let i = 0; i < n; i++) {
        confetti.push({ x: Math.random() * stage.W, y: -20 - Math.random() * stage.H * 0.6, vx: (Math.random() - 0.5) * 40,
          vy: 90 + Math.random() * 120, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, c: CONFETTI[i % CONFETTI.length], t: 0, life: 6, g: 0 });
      }
    },
    update(dt) {
      for (const t of texts) { t.t += dt; t.y -= dt * 46; }
      texts = texts.filter((t) => t.t < 1.1);
      for (const s of sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.92; s.vy *= 0.92; }
      sparks = sparks.filter((s) => s.t < s.life);
      for (const c of confetti) { c.t += dt; c.vy += c.g * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt; }
      confetti = confetti.filter((c) => c.t < c.life && c.y < stage.H + 40);
    },
    draw(ctx) {
      for (const s of sparks) {
        ctx.globalAlpha = 1 - s.t / s.life;
        ctx.fillStyle = s.c;
        star(ctx, s.x, s.y, s.r);
      }
      ctx.globalAlpha = 1;
      for (const c of confetti) {
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.r);
        ctx.fillStyle = c.c; ctx.fillRect(-3.5, -6, 7, 12);
        ctx.restore();
      }
      const size = Math.max(16, Math.min(26, stage.W * 0.055));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      for (const t of texts) {
        ctx.globalAlpha = Math.min(1, 2.2 - t.t * 2);
        const big = t.kind === 'big';
        ctx.font = `800 ${big ? size * 1.25 : size}px ${font}`;
        const half = ctx.measureText(t.text).width / 2 + 8;
        const x = Math.max(half, Math.min(stage.W - half, t.x)); // kenardan taşmasın
        ctx.lineWidth = 5; ctx.strokeStyle = '#fff';
        ctx.strokeText(t.text, x, t.y);
        ctx.fillStyle = t.kind === 'bad' ? '#8a8fa3' : big ? COLORS.pink : COLORS.ink;
        ctx.fillText(t.text, x, t.y);
      }
      ctx.globalAlpha = 1;
    },
  };
}

function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Bitiş ekranları
// ---------------------------------------------------------------------------
function panel(root, { title, text, button, onClick, extra }) {
  root.querySelector('.gk-panel')?.remove();
  const box = document.createElement('div');
  box.className = 'gk-panel';
  const h = document.createElement('h2'); h.textContent = title;
  box.append(h);
  if (text) { const p = document.createElement('p'); p.textContent = text; box.append(p); }
  if (extra) box.append(extra);
  const btn = document.createElement('button');
  btn.className = 'btn primary';
  btn.textContent = button;
  btn.addEventListener('click', (e) => { e.stopPropagation(); box.remove(); onClick(); }, { once: true });
  // Panel üstündeki dokunuşlar oyuna gitmesin
  box.addEventListener('pointerdown', (e) => e.stopPropagation());
  box.append(btn);
  root.append(box);
  setTimeout(() => btn.focus({ preventScroll: true }), 50);
  return box;
}

/** Kazanınca: konfeti + "Durak açıldı!" → düğmeyle onComplete() */
export function showWin(stage, fx, b, onComplete, text = '') {
  fx?.rain();
  // Açılmış bir durakta tekrar oynanıyorsa (GameHost replay) farklı başlık
  const replay = !!stage.root.closest('[data-replay]');
  b.timeout(() => panel(stage.root, { title: replay ? 'Tebrikler!' : 'Durak açıldı!', text, button: replay ? 'Anıya dön' : 'Anıyı aç', onClick: onComplete }), 700);
}

/** Kaybedince: "Tekrar dene" */
export function showLose(stage, b, retry, title = 'Olmadı!', text = '') {
  b.timeout(() => panel(stage.root, { title, text, button: 'Tekrar dene', onClick: retry }), 500);
}

/** Bilgi kutusu (ör. şişedeki not); kapatılınca onClose */
export function showNote(stage, title, text, onClose, button = 'Devam') {
  const extra = document.createElement('p');
  extra.className = 'gk-note';
  extra.textContent = text;
  return panel(stage.root, { title, button, onClick: onClose, extra });
}

// ---------------------------------------------------------------------------
// Küçük yardımcılar
// ---------------------------------------------------------------------------
export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Ağırlıklı rastgele seçim: items[i][key] ağırlık */
export function weighted(items, key = 'weight') {
  const total = items.reduce((s, x) => s + x[key], 0);
  let r = Math.random() * total;
  for (const x of items) { r -= x[key]; if (r <= 0) return x; }
  return items[items.length - 1];
}

export function loadImage(src) {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = fail;
    img.src = src;
  });
}

/** Görseli (sw, sh) bir kutuya "cover" mantığıyla sığdırmak için kaynak dikdörtgeni */
export function coverRect(iw, ih, w, h) {
  const s = Math.max(w / iw, h / ih);
  const cw = w / s, ch = h / s;
  return { sx: (iw - cw) / 2, sy: (ih - ch) / 2, sw: cw, sh: ch };
}

/** Yuvarlatılmış dikdörtgen yolu */
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

/** Pointer olayının tuval (CSS px) koordinatı */
export function pointerPos(stage, e) {
  const r = stage.canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
