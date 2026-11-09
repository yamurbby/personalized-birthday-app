// 8. Mumları üfle (final): mikrofona üfle ya da (mikrofon yoksa) mumlara dokun.
// Sadece ses SEVİYESİ ölçülür; ses kaydedilmez, hiçbir yere gönderilmez. Bitince mikrofon ve AudioContext kapatılır.
import { config } from '../content/config';
import { bag, createFx, createStage, hint, loop, pointerPos, rand, roundRect, showWin } from './kit.js';

export const SETTINGS = {
  candles: 5,
  threshold: 0.12, // üfleme sayılacak ses seviyesi (0–1, RMS). Hassas değilse düşür.
  blowTime: 0.35, // eşiğin üstünde bu kadar kalınca bir mum söner (sn)
  tapFallbackAfter: 15, // mikrofon açıkken bu kadar saniyede ilerleme olmazsa dokunma da açılır
  cakeWidth: 0.7, // pasta genişliği (ekran genişliğinin oranı)
};

/** @type {import('./index').StartGame} */
export function startGame(container, _stopData, onComplete) {
  const b = bag();
  const stage = createStage(container, b);
  const { ctx } = stage;
  const fx = createFx(stage);
  const title = hint(stage.root, 'Dilek tut ve üfle 🎂', { autoHide: 0 });
  title.el.style.bottom = 'auto';

  // Mikrofon düğmesi + seviye göstergesi
  const controls = document.createElement('div');
  controls.className = 'gk-btn';
  controls.style.cssText = 'left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:8px';
  const micBtn = document.createElement('button');
  micBtn.className = 'btn primary';
  micBtn.textContent = '🎤 Mikrofonu aç';
  const info = document.createElement('p');
  info.style.cssText = 'font-weight:700;font-size:14px;text-align:center;margin:0 16px;text-shadow:0 0 4px #fff';
  const meter = document.createElement('i');
  meter.className = 'gk-bar';
  meter.style.cssText = 'width:min(60vw,220px);height:10px;display:none';
  meter.innerHTML = '<em style="width:0%"></em>';
  controls.append(micBtn, meter, info);
  stage.root.append(controls);
  controls.addEventListener('pointerdown', (e) => e.stopPropagation());

  let out = Array(SETTINGS.candles).fill(false);
  let smoke = [];
  let level = 0, above = 0, micOn = false, tapAllowed = false, micSince = 0, t = 0, finished = false, dim = 0, cheer = 0;
  let stream = null, audio = null, analyser = null, buf = null;

  function stopMic() {
    stream?.getTracks().forEach((tr) => tr.stop());
    stream = null;
    if (audio && audio.state !== 'closed') audio.close().catch(() => {});
    audio = null; analyser = null; micOn = false;
  }
  b.add(stopMic);

  function allowTap(msg) {
    tapAllowed = true;
    info.textContent = msg;
  }

  const hideBtn = () => { micBtn.style.display = 'none'; };
  // Mikrofon: güvenli bağlam (https ya da localhost) + getUserMedia + Web Audio gerekir. Yoksa dokunarak söndürme.
  const why = !window.isSecureContext ? 'sayfa güvenli bağlamda değil (https ya da localhost gerekir)'
    : !navigator.mediaDevices?.getUserMedia ? 'tarayıcı navigator.mediaDevices.getUserMedia desteklemiyor'
    : !(window.AudioContext || window.webkitAudioContext) ? 'tarayıcı Web Audio (AudioContext) desteklemiyor'
    : '';
  if (why) {
    console.info('[candles] Mikrofon kullanılamıyor:', why, '→ dokunarak söndürme açıldı');
    hideBtn();
    allowTap('Mumlara dokunarak söndür');
  }

  b.on(micBtn, 'click', async () => {
    micBtn.disabled = true;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      if (b.done) { stopMic(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      audio = new AC();
      const src = audio.createMediaStreamSource(stream);
      analyser = audio.createAnalyser();
      analyser.fftSize = 1024;
      buf = new Float32Array(analyser.fftSize);
      src.connect(analyser); // hoparlöre bağlanmaz, kayıt yok: sadece seviye okunur
      micOn = true; micSince = t;
      hideBtn();
      meter.style.display = 'inline-block';
      info.textContent = 'Şimdi mumlara doğru üfle!';
    } catch (err) {
      console.info('[candles] Mikrofon izni alınamadı:', err?.name ?? err);
      hideBtn();
      allowTap('Mikrofon açılamadı. Mumlara dokunarak söndür');
    }
  });

  // ---- Yerleşim ----
  let L = {};
  function layout() {
    const W = stage.W, H = stage.H;
    const cw = Math.min(W * SETTINGS.cakeWidth, H * 0.45);
    // Başlık + pasta + düğme grubu dikeyde ortalı; düğme ve yazı pastanın hemen altında
    const cakeH = cw * 0.96; // mum alevlerinden tabağa
    const group = 46 + cakeH + 24 + 96;
    const groupTop = Math.max(56, (H - group) / 2);
    const base = groupTop + 46 + cakeH;
    title.el.style.top = `${groupTop}px`;
    controls.style.top = `${base + 24}px`;
    L = {
      cw, base,
      tiers: [
        { w: cw, h: cw * 0.26, y: base - cw * 0.26, c: '#ffc4d2', d: '#f49ab0' },
        { w: cw * 0.76, h: cw * 0.22, y: base - cw * 0.48, c: '#fff1dc', d: '#f3d9b5' },
        { w: cw * 0.52, h: cw * 0.18, y: base - cw * 0.66, c: '#d8f3e6', d: '#a8dcc4' },
      ],
    };
    const top = L.tiers[2];
    const n = SETTINGS.candles;
    L.candles = Array.from({ length: n }, (_, i) => {
      const x = W / 2 - top.w * 0.38 + (top.w * 0.76 * i) / (n - 1 || 1);
      return { x, y: top.y, w: cw * 0.045, h: cw * 0.16 };
    });
  }
  stage.onResize = layout;
  layout();

  function extinguish(i) {
    if (out[i] || finished) return;
    out[i] = true;
    const c = L.candles[i];
    for (let k = 0; k < 6; k++) smoke.push({ x: c.x + rand(-2, 2), y: c.y - c.h - 6, r: rand(3, 6), t: -k * 0.08, vx: rand(-8, 8) });
    if (out.every(Boolean)) done();
  }

  function done() {
    finished = true;
    stopMic();
    controls.remove();
    title.hide();
    b.timeout(() => {
      cheer = 1;
      fx.rain(120);
      fx.sparkle(stage.W / 2, L.base - L.cw * 0.5, 30);
    }, 500);
    // Haritadaki ilk oynayışta "Durak açıldı" paneli yok: kutlamadan sonra mektup kendiliğinden gelir.
    // Açılmış durakta tekrar oynanıyorsa (data-replay) normal bitiş paneli çıkar.
    if (stage.root.closest('[data-replay]')) b.timeout(() => showWin(stage, null, b, onComplete, `İyi ki doğdun ${config.pelinName}! Dileğin gerçek olsun 💗`), 2200);
    else b.timeout(() => onComplete(), 2800);
  }

  b.on(stage.root, 'pointerdown', (e) => {
    if (!tapAllowed || finished) return;
    e.preventDefault();
    const p = pointerPos(stage, e);
    L.candles.forEach((c, i) => {
      if (Math.abs(p.x - c.x) < Math.max(c.w * 2.2, 22) && p.y > c.y - c.h - c.w * 5 && p.y < c.y + 10) extinguish(i);
    });
  });
  // Klavye: boşluk/enter sıradaki mumu söndürür (dokunma açıkken)
  b.on(window, 'keydown', (e) => {
    if (!tapAllowed || finished || (e.code !== 'Space' && e.code !== 'Enter')) return;
    e.preventDefault();
    const i = out.indexOf(false);
    if (i >= 0) extinguish(i);
  });

  loop(b, (dt) => {
    t += dt;
    if (micOn && analyser) {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      level += (Math.min(1, rms * 4) - level) * Math.min(1, dt * 12);
      meter.firstChild.style.width = `${Math.min(100, (level / (SETTINGS.threshold * 2)) * 100)}%`;
      if (level > SETTINGS.threshold) {
        above += dt;
        if (above >= SETTINGS.blowTime) { above = 0; extinguish(out.indexOf(false)); }
      } else above = Math.max(0, above - dt * 0.5);
      if (!tapAllowed && out.every((o) => !o) && t - micSince > SETTINGS.tapFallbackAfter) {
        allowTap('Olmuyor mu? Mumlara dokunarak da söndürebilirsin');
      }
    }
    for (const s of smoke) { s.t += dt; if (s.t > 0) { s.y -= dt * 40; s.x += s.vx * dt; s.r += dt * 10; } }
    smoke = smoke.filter((s) => s.t < 1.6);
    if (finished) dim = Math.min(1, dim + dt * 1.5);
    fx.update(dt);
    draw();
  });

  function draw() {
    stage.begin();
    const { W, H } = stage;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffe9ef'); g.addColorStop(1, '#fff6ee');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // Masa
    ctx.fillStyle = '#f6dbe2';
    roundRect(ctx, W / 2 - L.cw * 0.75, L.base - 4, L.cw * 1.5, 14, 7); ctx.fill();
    // Katlar (alttan üste)
    for (const tr of L.tiers) {
      const x = W / 2 - tr.w / 2;
      ctx.fillStyle = tr.d;
      roundRect(ctx, x, tr.y + tr.h * 0.12, tr.w, tr.h * 0.88, 10); ctx.fill();
      ctx.fillStyle = tr.c;
      roundRect(ctx, x, tr.y, tr.w, tr.h * 0.8, 10); ctx.fill();
      // Krema damlaları
      ctx.fillStyle = '#fff';
      const n = Math.max(4, Math.round(tr.w / 22));
      for (let i = 0; i < n; i++) {
        const dx = x + 6 + ((tr.w - 12) * (i + 0.5)) / n;
        ctx.beginPath(); ctx.ellipse(dx, tr.y + 4, tr.w / n / 2.1, tr.h * (i % 2 ? 0.14 : 0.22), 0, 0, Math.PI); ctx.fill();
      }
      ctx.fillRect(x + 4, tr.y, tr.w - 8, 5);
      // Benekler
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(x + ((i + 0.3) * tr.w) / n, tr.y + tr.h * 0.55, 2, 0, Math.PI * 2); ctx.fill(); }
    }
    // Mumlar
    L.candles.forEach((c, i) => {
      const colors = ['#ffb7c5', '#a9d4ec', '#ffe08a', '#bdebd6', '#d8c8f5'];
      ctx.fillStyle = colors[i % colors.length];
      roundRect(ctx, c.x - c.w / 2, c.y - c.h, c.w, c.h, c.w / 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      for (let k = 1; k < 4; k++) ctx.fillRect(c.x - c.w / 2, c.y - c.h + (c.h * k) / 4, c.w, 2);
      ctx.strokeStyle = '#6b5560'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(c.x, c.y - c.h); ctx.lineTo(c.x, c.y - c.h - c.w * 0.6); ctx.stroke();
      if (!out[i]) flame(c.x, c.y - c.h - c.w * 0.5, c.w, i);
    });
    // Duman
    for (const s of smoke) {
      if (s.t <= 0) continue;
      ctx.fillStyle = `rgba(170,160,170,${0.45 * (1 - s.t / 1.6)})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    // Final: hafif kararma + yazı
    if (dim > 0) {
      ctx.fillStyle = `rgba(60,30,50,${0.28 * dim})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (cheer > 0) {
      const size = Math.min(W * 0.09, 40);
      ctx.font = `800 ${size}px ${getComputedStyle(stage.root).fontFamily}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 6; ctx.strokeStyle = '#fff';
      const y = H * 0.2 + Math.sin(t * 3) * 4;
      ctx.strokeText(`İyi ki doğdun ${config.pelinName}!`, W / 2, y);
      ctx.fillStyle = '#ff7b93';
      ctx.fillText(`İyi ki doğdun ${config.pelinName}!`, W / 2, y);
    }
    fx.draw(ctx);
  }

  /** Titreşen alev: üfleme seviyesi arttıkça daha çok titrer ve eğilir */
  function flame(x, y, w, i) {
    const wob = 0.08 + level * 2.2;
    const n = Math.sin(t * 14 + i * 1.7) * 0.5 + Math.sin(t * 23 + i) * 0.5;
    const lean = n * wob * w * 1.2;
    const fh = w * (1.9 + Math.sin(t * 9 + i) * 0.15) * (1 - Math.min(0.4, level));
    const glow = ctx.createRadialGradient(x, y - fh * 0.4, 0, x, y - fh * 0.4, w * 3.2);
    glow.addColorStop(0, 'rgba(255,214,120,.45)'); glow.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y - fh * 0.4, w * 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.55, y);
    ctx.quadraticCurveTo(x - w * 0.7, y - fh * 0.5, x + lean, y - fh);
    ctx.quadraticCurveTo(x + w * 0.7, y - fh * 0.5, x + w * 0.55, y);
    ctx.quadraticCurveTo(x, y + w * 0.35, x - w * 0.55, y);
    ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath(); ctx.ellipse(x + lean * 0.3, y - fh * 0.3, w * 0.25, fh * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  }

  return () => b.run();
}
