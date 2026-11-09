// 1. Kazı kazan: kartı kazı, altından durağın ilk fotoğrafı çıksın.
import { bag, createFx, createStage, coverRect, loadImage, loop, pointerPos, roundRect, showWin } from './kit.js';

export const SETTINGS = {
  revealAt: 0.6, // bu oranda kazınınca kart açılır
  brush: 0.075, // fırça yarıçapı (kart genişliğinin oranı)
  checkEvery: 300, // kazınan oran kaç ms'de bir hesaplansın
  sample: 48, // oran hesabı için düşük çözünürlük (48×48 örnek)
  cardWidth: 0.82, // kart genişliği (ekran genişliğinin oranı)
  fade: 0.8, // kalan katmanın kaybolma süresi (sn)
};

/** @type {import('./index').StartGame} */
export function startGame(container, stopData, onComplete) {
  const b = bag();
  const stage = createStage(container, b);
  const { ctx } = stage;
  const fx = createFx(stage);

  const photo = stopData.photos[0];
  let img = null;
  if (photo) loadImage(photo.full).catch(() => loadImage(photo.thumb)).then((i) => { img = i; }).catch(() => {});

  // Kazıma katmanı ayrı bir tuvalde (kart boyutunda, cihaz pikseliyle)
  const layer = document.createElement('canvas');
  const lctx = layer.getContext('2d');
  const sampler = document.createElement('canvas');
  sampler.width = sampler.height = SETTINGS.sample;
  const sctx = sampler.getContext('2d', { willReadFrequently: true });

  let card = { x: 0, y: 0, w: 0, h: 0 };
  let ratio = 0, revealed = false, fade = 1, last = null, lastCheck = 0, dirty = false;

  function layout() {
    const w = Math.min(stage.W * SETTINGS.cardWidth, (stage.H - 120) * 0.78);
    const h = w * 1.25;
    card = { x: (stage.W - w) / 2, y: Math.max(64, (stage.H - h) / 2), w, h };
    // Boyut değişirse kazınmış hali koru (eski katmanı yeni boyuta ölçekle)
    const old = layer.width > 1 ? Object.assign(document.createElement('canvas'), { width: layer.width, height: layer.height }) : null;
    old?.getContext('2d').drawImage(layer, 0, 0);
    layer.width = Math.max(1, Math.round(w * stage.dpr));
    layer.height = Math.max(1, Math.round(h * stage.dpr));
    if (old && started) { lctx.drawImage(old, 0, 0, layer.width, layer.height); } else paintLayer();
  }
  let started = false;

  /** Pembe-altın kazıma katmanı + yazı (yeniden boyutlanınca baştan çizilir) */
  function paintLayer() {
    const W = layer.width, H = layer.height;
    lctx.globalCompositeOperation = 'source-over';
    const g = lctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#ffc4d2'); g.addColorStop(0.5, '#ffe2a8'); g.addColorStop(1, '#f5b8cf');
    lctx.fillStyle = g;
    lctx.fillRect(0, 0, W, H);
    // parlak benekler
    for (let i = 0; i < 70; i++) {
      lctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.35})`;
      lctx.beginPath(); lctx.arc(Math.random() * W, Math.random() * H, (1 + Math.random() * 2.5) * stage.dpr, 0, Math.PI * 2); lctx.fill();
    }
    lctx.fillStyle = '#b0485f';
    lctx.textAlign = 'center'; lctx.textBaseline = 'middle';
    lctx.font = `800 ${Math.round(W * 0.085)}px ${getComputedStyle(stage.root).fontFamily}`;
    lctx.fillText('Kazı ve gör ✨', W / 2, H / 2);
    ratio = 0;
  }

  stage.onResize = layout;
  layout();

  function scratch(from, to) {
    const r = card.w * SETTINGS.brush * stage.dpr;
    const toL = (p) => ({ x: (p.x - card.x) * stage.dpr, y: (p.y - card.y) * stage.dpr });
    const a = toL(from), c = toL(to);
    const dist = Math.hypot(c.x - a.x, c.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / (r * 0.35)));
    lctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i <= steps; i++) {
      const x = a.x + ((c.x - a.x) * i) / steps, y = a.y + ((c.y - a.y) * i) / steps;
      const g = lctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.beginPath(); lctx.arc(x, y, r, 0, Math.PI * 2); lctx.fill();
    }
    dirty = true;
  }

  /** Düşük çözünürlüklü örnekle kazınan oranı ölç */
  function measure() {
    const n = SETTINGS.sample;
    sctx.clearRect(0, 0, n, n);
    sctx.drawImage(layer, 0, 0, n, n);
    const d = sctx.getImageData(0, 0, n, n).data;
    let clear = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 128) clear++;
    ratio = clear / (n * n);
    if (ratio >= SETTINGS.revealAt && !revealed) reveal();
  }

  function reveal() {
    revealed = true;
    fx.sparkle(card.x + card.w / 2, card.y + card.h / 2, 26);
    b.timeout(() => fx.sparkle(card.x + card.w * 0.25, card.y + card.h * 0.3, 14), 250);
    b.timeout(() => fx.sparkle(card.x + card.w * 0.75, card.y + card.h * 0.7, 14), 450);
    showWin(stage, fx, b, onComplete, 'Kartı kazıdın, anı açıldı!');
  }

  const inCard = (p) => p.x >= card.x && p.x <= card.x + card.w && p.y >= card.y && p.y <= card.y + card.h;
  b.on(stage.root, 'pointerdown', (e) => {
    if (revealed) return;
    e.preventDefault();
    stage.root.setPointerCapture?.(e.pointerId);
    const p = pointerPos(stage, e);
    last = p;
    if (inCard(p)) { started = true; scratch(p, p); }
  });
  b.on(stage.root, 'pointermove', (e) => {
    if (!last || revealed) return;
    const p = pointerPos(stage, e);
    scratch(last, p);
    last = p;
  });
  const up = () => { last = null; };
  b.on(stage.root, 'pointerup', up);
  b.on(stage.root, 'pointercancel', up);

  loop(b, (dt) => {
    const now = performance.now();
    if (dirty && now - lastCheck > SETTINGS.checkEvery) { lastCheck = now; dirty = false; measure(); }
    if (revealed) fade = Math.max(0, fade - dt / SETTINGS.fade);
    fx.update(dt);

    stage.begin();
    const { W, H } = stage;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffeef3'); g.addColorStop(1, '#fff6ee');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Kart: gölge + fotoğraf (cover) + kazıma katmanı
    ctx.save();
    ctx.shadowColor = 'rgba(120,60,80,.22)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#fff';
    roundRect(ctx, card.x - 8, card.y - 8, card.w + 16, card.h + 16, 18); ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, card.x, card.y, card.w, card.h, 12); ctx.clip();
    if (img) {
      const r = coverRect(img.naturalWidth, img.naturalHeight, card.w, card.h);
      ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, card.x, card.y, card.w, card.h);
    } else {
      ctx.fillStyle = '#f3e6ea'; ctx.fillRect(card.x, card.y, card.w, card.h);
    }
    if (fade > 0) { ctx.globalAlpha = fade; ctx.drawImage(layer, card.x, card.y, card.w, card.h); ctx.globalAlpha = 1; }
    ctx.restore();
    fx.draw(ctx);
  });

  return () => b.run();
}
