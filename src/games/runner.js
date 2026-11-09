// 3. Zıplama: Pelin sağa doğru koşar, engellerin üstünden zıpla, kalpleri topla, 500 m'ye ulaş.
// Dokun / boşluk / yukarı ok: zıpla. Basılı tutarsan biraz daha yükseğe zıplar.
import { actions } from '../core/store';
import { characterSprite } from './character.js';
import { bag, createFx, createStage, hint, hud, loadImage, loop, pick, progressHtml, rand, roundRect, showLose, showWin } from './kit.js';

export const SETTINGS = {
  goal: 500, // hedef (m)
  startSpeed: 10, // m/sn
  accel: 0.18, // hız artışı (m/sn²)
  maxSpeed: 20,
  pxPerMeter: 0.06, // 1 m kaç ekran genişliği (ör. 0.06 → 375 px ekranda 22 px)
  charWidth: 0.2, // Pelin'in genişliği (ekran genişliğinin oranı)
  gravity: 3.2, // (ekran yüksekliği / sn²)
  jump: 1.2, // zıplama hızı (ekran yüksekliği / sn)
  holdGravity: 0.45, // basılı tutarken yerçekimi çarpanı (daha yüksek zıplar)
  holdMax: 0.22, // en fazla bu kadar sn basılı tutmak etkili
  gap: [1.0, 1.9], // engeller arası süre (sn) aralığı
  heartChance: 0.55, // iki engel arasında kalp çıkma olasılığı
  hitbox: 0.7, // çarpışma kutusu görselin bu oranı (affedici)
};

// ---------------------------------------------------------------------------
// Temalar (journey.ts'te durağa runnerTheme: 'kampus' | 'tatil' yaz).
// Kendi görsellerini eklemek için: obstacles listesine { img: '/yol/engel.png', w: 0.5, h: 0.5 } ekle
// (w, h: Pelin'in genişlik/yüksekliğine oran) ve/veya background: '/yol/arka.png' ver.
// Görselleri src/assets/runner/ içine koyup import ederek kullanabilirsin:
//   import kitap from '../assets/runner/kitap.png';  →  { img: kitap, w: 0.5, h: 0.45 }
// ---------------------------------------------------------------------------
export const THEMES = {
  kampus: {
    sky: ['#dff0ff', '#fff0f5'],
    ground: '#cdeedd', groundEdge: '#a8dcc4',
    scenery: 'buildings',
    background: null,
    obstacles: [{ draw: 'books' }, { draw: 'cone' }, { draw: 'coffee' }],
  },
  tatil: {
    sky: ['#cfeeff', '#fff4e6'],
    ground: '#ffe7bf', groundEdge: '#f3cf94',
    scenery: 'sea',
    background: null,
    obstacles: [{ draw: 'castle' }, { draw: 'ball' }, { draw: 'shell' }],
  },
};

/** @type {import('./index').StartGame} */
export function startGame(container, stopData, onComplete) {
  const b = bag();
  const stage = createStage(container, b);
  const { ctx } = stage;
  const fx = createFx(stage);
  const ui = hud(stage.root, { dist: '', hearts: '💗 <b>0</b>' });
  const tip = hint(stage.root, 'Dokun ve zıpla! Basılı tut, daha yükseğe');
  const theme = THEMES[stopData.runnerTheme] ?? THEMES.kampus;

  // Görseller: Pelin + temadaki varsa engel/arka plan resimleri
  let pelin = null, bgImg = null;
  const obstacleImgs = new Map();
  characterSprite('pelin', 360).then((c) => { pelin = c; });
  if (theme.background) loadImage(theme.background).then((i) => { bgImg = i; }).catch(() => {});
  for (const o of theme.obstacles) if (o.img) loadImage(o.img).then((i) => obstacleImgs.set(o, i)).catch(() => {});

  // Ölçüler (ekrana göre)
  let M = {};
  const measure = () => {
    const { W, H } = stage;
    const cw = Math.min(W * SETTINGS.charWidth, H * 0.14);
    const aspect = pelin ? pelin.height / pelin.width : 1.8;
    M = { cw, ch: cw * aspect, ground: H * 0.8, px: W * SETTINGS.pxPerMeter, x: W * 0.14 };
  };
  stage.onResize = measure;
  measure();

  let st;
  function reset() {
    st = {
      state: 'ready', dist: 0, speed: SETTINGS.startSpeed, y: 0, vy: 0, holding: false, hold: 0,
      obstacles: [], hearts: [], next: 1.2, collected: 0, t: 0, scroll: 0, shake: 0, squash: 0, dust: [], wasAir: false, lastStep: 0,
    };
    renderHud();
  }
  function renderHud() {
    ui.dist.innerHTML = progressHtml(`<b>${Math.floor(st.dist)}</b>/${SETTINGS.goal} m`, st.dist / SETTINGS.goal);
    ui.hearts.innerHTML = `💗 <b>${st.collected}</b>`;
  }
  reset();

  const onGround = () => st.y <= 0.0001;
  /** Ayak dibinde küçük toz bulutları */
  function puff(n) {
    for (let i = 0; i < n; i++) st.dust.push({ x: M.x + M.cw * rand(0.25, 0.5), y: M.ground - rand(0, 4), r: M.cw * rand(0.04, 0.08), vx: rand(10, 40), t: 0, life: rand(0.3, 0.5) });
  }
  function press() {
    if (st.state === 'ready') { st.state = 'run'; tip.hide(); }
    if (st.state !== 'run') return;
    st.holding = true;
    if (onGround()) { st.vy = SETTINGS.jump * stage.H; st.hold = 0; puff(4); }
  }
  const release = () => { st.holding = false; };

  b.on(stage.root, 'pointerdown', (e) => { if (e.target.closest?.('.gk-panel')) return; e.preventDefault(); press(); });
  b.on(stage.root, 'pointerup', release);
  b.on(stage.root, 'pointercancel', release);
  b.on(window, 'keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); if (!e.repeat) press(); }
  });
  b.on(window, 'keyup', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') release(); });

  function spawn() {
    const kind = pick(theme.obstacles);
    const s = rand(0.85, 1.15);
    const size = {
      books: [0.55, 0.42], cone: [0.42, 0.5], coffee: [0.4, 0.45],
      castle: [0.6, 0.5], ball: [0.45, 0.45], shell: [0.5, 0.36],
    }[kind.draw] ?? [kind.w ?? 0.5, kind.h ?? 0.5];
    const ob = { kind, x: stage.W + M.cw, w: M.cw * size[0] * s, h: M.ch * size[1] * s, x0seed: Math.floor(Math.random() * 4) };
    st.obstacles.push(ob);
    if (Math.random() < SETTINGS.heartChance) {
      // Kalp: bazen yerde, bazen zıplayınca alınacak yükseklikte
      const high = Math.random() < 0.6;
      st.hearts.push({ x: ob.x + st.speed * M.px * rand(0.45, 0.7), y: high ? M.ch * rand(0.9, 1.3) : M.ch * 0.3, r: M.cw * 0.16, t: rand(0, 6) });
    }
    st.next = rand(SETTINGS.gap[0], SETTINGS.gap[1]) * (SETTINGS.startSpeed / st.speed) ** 0.3;
  }

  function crash() {
    st.state = 'crash';
    st.shake = 0.4;
    fx.text(M.x + M.cw / 2, M.ground - M.ch - st.y - 10, 'Ah!', 'bad');
    if (st.collected) actions.grantHearts(st.collected);
    showLose(stage, b, reset, 'Takıldın!', `${Math.floor(st.dist)} m koştun${st.collected ? `, ${st.collected} kalp topladın (kalp sayacına eklendi)` : ''}.`);
  }

  function win() {
    st.state = 'won';
    if (st.collected) actions.grantHearts(st.collected);
    showWin(stage, fx, b, onComplete, `${SETTINGS.goal} m!${st.collected ? ` ${st.collected} kalp topladın, kalp sayacına eklendi.` : ''}`);
  }

  loop(b, (dt) => {
    if (pelin && !M.ready) { M.ready = true; measure(); }
    st.t += dt;
    if (st.state === 'run') {
      st.speed = Math.min(SETTINGS.maxSpeed, st.speed + SETTINGS.accel * dt);
      const v = st.speed * M.px;
      st.dist += st.speed * dt;
      st.scroll += v * dt;
      // Zıplama fiziği
      if (st.holding && st.vy > 0 && st.hold < SETTINGS.holdMax) st.hold += dt;
      const g = SETTINGS.gravity * stage.H * (st.holding && st.vy > 0 && st.hold < SETTINGS.holdMax ? SETTINGS.holdGravity : 1);
      st.vy -= g * dt;
      st.y = Math.max(0, st.y + st.vy * dt);
      if (st.y === 0 && st.vy < 0) st.vy = 0;
      // İniş: ezilme + toz; koşarken her adımda küçük toz
      if (st.wasAir && onGround()) { st.squash = 1; puff(6); }
      st.wasAir = !onGround();
      const stepN = Math.floor((st.t * 12) / Math.PI);
      if (onGround() && stepN !== st.lastStep) { st.lastStep = stepN; puff(1); }
      // Engeller ve kalpler
      st.next -= dt;
      if (st.next <= 0 && st.dist < SETTINGS.goal - 15) spawn();
      for (const o of st.obstacles) o.x -= v * dt;
      for (const h of st.hearts) { h.x -= v * dt; h.t += dt; }
      st.obstacles = st.obstacles.filter((o) => o.x + o.w > -20);
      // Çarpışma (affedici kutular)
      const pw = M.cw * SETTINGS.hitbox * 0.8, ph = M.ch * SETTINGS.hitbox;
      const px = M.x + (M.cw - pw) / 2, py = st.y; // py: ayakların yerden yüksekliği
      for (const o of st.obstacles) {
        const ow = o.w * SETTINGS.hitbox, oh = o.h * SETTINGS.hitbox;
        const ox = o.x + (o.w - ow) / 2;
        if (px < ox + ow && px + pw > ox && py < oh) { crash(); break; }
      }
      st.hearts = st.hearts.filter((h) => {
        if (h.x < -30) return false;
        const cx = M.x + M.cw / 2, cy = st.y + M.ch * 0.5;
        if (Math.abs(h.x - cx) < M.cw * 0.55 && Math.abs(h.y - cy) < M.ch * 0.55) {
          st.collected++;
          fx.sparkle(h.x, M.ground - h.y, 10, ['#ff8fab', '#ffd36e', '#fff']);
          fx.text(h.x, M.ground - h.y - 10, '+1 💗');
          return false;
        }
        return true;
      });
      if (Math.floor(st.dist) !== Math.floor(st.dist - st.speed * dt)) renderHud();
      if (st.dist >= SETTINGS.goal) { st.dist = SETTINGS.goal; renderHud(); win(); }
    }
    st.shake = Math.max(0, st.shake - dt);
    st.squash = Math.max(0, st.squash - dt * 6);
    for (const d of st.dust) { d.t += dt; d.x -= (st.state === 'run' ? st.speed * M.px : 0) * dt * 0.6 + d.vx * dt; d.y -= dt * 12; }
    st.dust = st.dust.filter((d) => d.t < d.life);
    fx.update(dt);
    draw();
  });

  // ---- Çizim ----
  const INK = 'rgba(91,68,82,.55)'; // karakterin çizgi tonuna yakın, yumuşak dış çizgi
  /** Sıra numarasına göre sabit "rastgele" sayı (sahne her karede aynı kalsın) */
  const seed = (i, k = 0) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };

  function draw() {
    stage.begin();
    const { W, H } = stage;
    if (st.shake > 0) ctx.translate(Math.sin(st.t * 80) * st.shake * 10, 0);
    // Gökyüzü
    const g = ctx.createLinearGradient(0, 0, 0, M.ground);
    g.addColorStop(0, theme.sky[0]); g.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
    // Güneş (yumuşak hale)
    const sx = W * 0.78, sy = M.ground * (theme.scenery === 'sea' ? 0.3 : 0.22), sr = W * 0.07;
    const halo = ctx.createRadialGradient(sx, sy, sr * 0.6, sx, sy, sr * 2.6);
    halo.addColorStop(0, 'rgba(255,230,160,.55)'); halo.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sx, sy, sr * 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe49a'; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    clouds();
    if (bgImg) {
      const bw = (bgImg.naturalWidth / bgImg.naturalHeight) * M.ground;
      const off = -((st.scroll * 0.3) % bw);
      for (let x = off; x < W; x += bw) ctx.drawImage(bgImg, x, 0, bw, M.ground);
    } else if (theme.scenery === 'sea') beach();
    else campus();
    ground();
    // Hız çizgileri
    if (st.state === 'run' && st.speed > 13) {
      ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.5, (st.speed - 13) / 10)})`; ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const y = M.ground * (0.35 + seed(i) * 0.55), x = W - ((st.scroll * 2.2 + seed(i, 1) * W * 3) % (W * 1.6));
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + W * 0.12, y); ctx.stroke();
      }
    }
    for (const h of st.hearts) heart(h.x, M.ground - h.y + Math.sin(h.t * 4) * 4, h.r, h.t);
    for (const o of st.obstacles) obstacle(o);
    dust();
    runnerSprite();
    fx.draw(ctx);
  }

  function clouds() {
    const { W } = stage;
    const span = W * 0.7;
    const base = Math.floor((st.scroll * 0.06) / span);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = base - 1; i < base + 3; i++) {
      const x = i * span - st.scroll * 0.06 + seed(i) * span * 0.5;
      const y = M.ground * (0.12 + seed(i, 2) * 0.22), s = W * (0.05 + seed(i, 3) * 0.03);
      ctx.beginPath();
      ctx.ellipse(x, y + s * 0.3, s * 2, s * 0.7, 0, 0, Math.PI * 2);
      ctx.arc(x - s * 0.8, y, s * 0.8, 0, Math.PI * 2);
      ctx.arc(x + s * 0.4, y - s * 0.3, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Arka plandaki tepe sırası: amplitude ve renk, paralaks katsayısı */
  function hills(par, top, amp, color, k) {
    const { W } = stage;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-10, M.ground);
    for (let x = -10; x <= W + 10; x += 8) {
      const u = (x + st.scroll * par) / W;
      ctx.lineTo(x, top - amp * (0.6 * Math.sin(u * 2.2 + k) + 0.4 * Math.sin(u * 5.1 + k * 2)));
    }
    ctx.lineTo(W + 10, M.ground); ctx.closePath(); ctx.fill();
  }

  function tree(x, base, s, leaf = '#a8dcc4', leaf2 = '#8fd0b2') {
    ctx.fillStyle = '#c9a487'; ctx.fillRect(x - s * 0.08, base - s * 0.55, s * 0.16, s * 0.55);
    ctx.fillStyle = leaf2;
    ctx.beginPath(); ctx.arc(x - s * 0.22, base - s * 0.65, s * 0.32, 0, Math.PI * 2); ctx.arc(x + s * 0.24, base - s * 0.7, s * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = leaf;
    ctx.beginPath(); ctx.arc(x, base - s * 0.92, s * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.arc(x - s * 0.12, base - s * 1.05, s * 0.12, 0, Math.PI * 2); ctx.fill();
  }

  function campus() {
    const { W } = stage;
    hills(0.08, M.ground * 0.62, M.ground * 0.06, '#e6dcf5', 1);
    hills(0.14, M.ground * 0.72, M.ground * 0.05, '#d8f0e6', 3);
    // Kampüs binaları (çatılı, pencereli) ve aralarında ağaçlar
    const par = 0.35, slot = W * 0.42;
    const first = Math.floor((st.scroll * par) / slot) - 1;
    const walls = ['#fbe3e8', '#fdf0e1', '#efe7fb', '#e3f4ec'];
    const roofs = ['#f49ab0', '#f3b18f', '#b9a6e8', '#8fd0b2'];
    for (let i = first; i < first + 5; i++) {
      const x0 = i * slot - st.scroll * par;
      const r = seed(i);
      if (r < 0.22) { tree(x0 + slot * 0.5, M.ground, M.ground * 0.22); continue; }
      const bw = slot * (0.62 + seed(i, 1) * 0.25), bh = M.ground * (0.2 + seed(i, 2) * 0.16);
      const x = x0 + (slot - bw) / 2, y = M.ground - bh;
      const c = Math.floor(seed(i, 3) * 4);
      ctx.fillStyle = walls[c];
      roundRect(ctx, x, y, bw, bh, 6); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
      // Çatı
      ctx.fillStyle = roofs[c];
      ctx.beginPath(); ctx.moveTo(x - 6, y + 2); ctx.lineTo(x + bw / 2, y - bh * 0.32); ctx.lineTo(x + bw + 6, y + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      // Saat kulesi süsü
      if (seed(i, 4) > 0.6) {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + bw / 2, y - bh * 0.1, bh * 0.08, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      // Pencereler (çerçeveli) + kapı
      const cols = Math.max(2, Math.round(bw / 26)), rows = Math.max(1, Math.round(bh / 34));
      const ww = bw / (cols * 1.9), wh = bh / (rows * 2.4);
      for (let cx = 0; cx < cols; cx++) for (let ry = 0; ry < rows; ry++) {
        const wx = x + (bw * (cx + 0.5)) / cols - ww / 2, wy = y + bh * 0.14 + ((bh * 0.62) * ry) / rows;
        ctx.fillStyle = '#cfe9ff'; roundRect(ctx, wx, wy, ww, wh, 3); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
      }
      ctx.fillStyle = roofs[c]; roundRect(ctx, x + bw / 2 - bw * 0.08, M.ground - bh * 0.22, bw * 0.16, bh * 0.22, 4); ctx.fill();
      if (seed(i, 5) > 0.5) tree(x + bw + slot * 0.06, M.ground, M.ground * 0.16);
    }
    // Çit / çalı sırası
    const hp = 0.6, hs = W * 0.09;
    ctx.fillStyle = '#b6e3cc';
    for (let x = -((st.scroll * hp) % hs) - hs; x < W + hs; x += hs) {
      ctx.beginPath(); ctx.arc(x, M.ground - 2, hs * 0.42, Math.PI, 0); ctx.fill();
    }
  }

  function beach() {
    const { W } = stage;
    // Deniz ve uzaktaki ada
    const seaTop = M.ground * 0.58;
    const sea = ctx.createLinearGradient(0, seaTop, 0, M.ground);
    sea.addColorStop(0, '#9fd3ef'); sea.addColorStop(1, '#c4e8f6');
    ctx.fillStyle = sea; ctx.fillRect(-20, seaTop, W + 40, M.ground - seaTop);
    const ix = W * 1.2 - ((st.scroll * 0.05) % (W * 1.6));
    ctx.fillStyle = '#b6e3cc'; ctx.beginPath(); ctx.ellipse(ix, seaTop + 2, W * 0.16, M.ground * 0.05, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
    for (let r = 0; r < 3; r++) {
      const y = seaTop + (M.ground - seaTop) * (0.25 + r * 0.25), wv = W * (0.14 + r * 0.03);
      for (let x = -((st.scroll * (0.1 + r * 0.08) + r * 40) % wv) - wv; x < W + wv; x += wv) {
        ctx.beginPath(); ctx.arc(x, y, wv * 0.18, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      }
    }
    // Palmiyeler ve şemsiyeler
    const par = 0.4, slot = W * 0.5;
    const first = Math.floor((st.scroll * par) / slot) - 1;
    for (let i = first; i < first + 4; i++) {
      const x = i * slot - st.scroll * par + seed(i) * slot * 0.4;
      if (seed(i, 1) < 0.55) palm(x, M.ground, M.ground * (0.3 + seed(i, 2) * 0.08), seed(i, 3) > 0.5 ? 1 : -1);
      else umbrella(x, M.ground, M.ground * 0.15, ['#ffb7c5', '#a9d4ec', '#ffe08a'][Math.floor(seed(i, 4) * 3)]);
    }
  }

  function palm(x, base, h, dir) {
    ctx.strokeStyle = '#c9a487'; ctx.lineWidth = h * 0.07; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + dir * h * 0.25, base - h * 0.5, x + dir * h * 0.12, base - h); ctx.stroke();
    ctx.lineCap = 'butt';
    const tx = x + dir * h * 0.12, ty = base - h;
    ctx.fillStyle = '#8fd0b2';
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k - 2) * 0.62;
      ctx.beginPath();
      ctx.ellipse(tx + Math.cos(a) * h * 0.2, ty + Math.sin(a) * h * 0.08 + h * 0.06, h * 0.24, h * 0.06, a * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function umbrella(x, base, h, color) {
    ctx.strokeStyle = '#d9c7a3'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - h); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, base - h, h * 0.55, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.moveTo(x, base - h); ctx.arc(x, base - h, h * 0.55, Math.PI * 1.33, Math.PI * 1.66); ctx.closePath(); ctx.fill();
  }

  function ground() {
    const { W, H } = stage;
    const sea = theme.scenery === 'sea';
    ctx.fillStyle = theme.ground; ctx.fillRect(-20, M.ground, W + 40, H - M.ground + 20);
    if (!sea) {
      // Çim kenarı + taş yol
      ctx.fillStyle = '#b6e3cc'; ctx.fillRect(-20, M.ground, W + 40, 8);
      ctx.fillStyle = '#9fd8bf';
      const bs = 9;
      for (let x = -((st.scroll) % bs); x < W; x += bs) { ctx.beginPath(); ctx.moveTo(x, M.ground + 1); ctx.lineTo(x + 3, M.ground - 5); ctx.lineTo(x + 6, M.ground + 1); ctx.fill(); }
      const py = M.ground + 16, ph = (H - py) * 0.5;
      ctx.fillStyle = '#fbefe6'; ctx.fillRect(-20, py, W + 40, ph);
      ctx.strokeStyle = '#efd9cf'; ctx.lineWidth = 2;
      const tw = W * 0.11;
      for (let x = -((st.scroll) % tw); x < W + tw; x += tw) {
        ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x, py + ph / 2); ctx.moveTo(x + tw / 2, py + ph / 2); ctx.lineTo(x + tw / 2, py + ph); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(-20, py + ph / 2); ctx.lineTo(W + 20, py + ph / 2); ctx.stroke();
      // Çiçekler
      const fs = W * 0.23;
      for (let x = -((st.scroll) % fs); x < W + fs; x += fs) {
        const i = Math.round((x + st.scroll) / fs);
        flower(x + seed(i) * fs * 0.6, M.ground + 4 + seed(i, 1) * 6, ['#ffb7c5', '#ffe08a', '#d8c8f5'][Math.floor(seed(i, 2) * 3)]);
      }
    } else {
      // Kum: ıslak kenar + benekler + deniz kabuğu
      ctx.fillStyle = theme.groundEdge; ctx.fillRect(-20, M.ground, W + 40, 6);
      ctx.fillStyle = 'rgba(214,180,130,.35)';
      const ds = W * 0.07;
      for (let x = -((st.scroll) % ds); x < W + ds; x += ds) {
        const i = Math.round((x + st.scroll) / ds);
        ctx.beginPath(); ctx.arc(x + seed(i) * ds, M.ground + 14 + seed(i, 1) * (H - M.ground - 24), 1.8, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function flower(x, y, c) {
    ctx.fillStyle = c;
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 3, y + Math.sin(a) * 3, 2.4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
  }

  function heart(x, y, r, t) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
    glow.addColorStop(0, `rgba(255,170,195,${0.35 + Math.sin(t * 5) * 0.1})`); glow.addColorStop(1, 'rgba(255,170,195,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8fab';
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.bezierCurveTo(x - r * 2, y - r * 0.2, x - r, y - r * 1.6, x, y - r * 0.6);
    ctx.bezierCurveTo(x + r, y - r * 1.6, x + r * 2, y - r * 0.2, x, y + r);
    ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.arc(x - r * 0.6, y - r * 0.6, r * 0.22, 0, Math.PI * 2); ctx.fill();
  }

  // ---- Pelin: koşu (zıplayan adım + öne eğilme), zıplarken gerilme, inerken ezilme ----
  function runnerSprite() {
    if (!pelin) return;
    const running = st.state === 'run' && onGround();
    const phase = st.t * 12;
    const step = running ? Math.abs(Math.sin(phase)) : 0; // 0 → yere basış, 1 → adımın tepesi
    const bob = step * M.ch * 0.05;
    let sx = 1, sy = 1;
    if (running) { sy = 1 - (1 - step) * 0.05; sx = 1 + (1 - step) * 0.035; }
    if (!onGround()) { const k = Math.max(-1, Math.min(1, st.vy / (SETTINGS.jump * stage.H))); sy = 1 + k * 0.07; sx = 1 - k * 0.04; }
    if (st.squash > 0) { sy *= 1 - st.squash * 0.16; sx *= 1 + st.squash * 0.1; }
    const lean = st.state === 'crash' ? -0.28 : !onGround() ? 0.06 - (st.vy / stage.H) * 0.05 : running ? 0.07 + Math.sin(phase * 2) * 0.02 : 0;
    // Gölge
    const lift = Math.min(1, st.y / (stage.H * 0.35));
    ctx.fillStyle = `rgba(120,60,80,${0.18 * (1 - lift * 0.6)})`;
    ctx.beginPath(); ctx.ellipse(M.x + M.cw / 2, M.ground + 3, M.cw * 0.36 * (1 - lift * 0.5), 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(M.x + M.cw / 2, M.ground - st.y - bob);
    ctx.rotate(lean);
    ctx.scale(sx, sy);
    ctx.drawImage(pelin, -M.cw / 2, -M.ch, M.cw, M.ch);
    ctx.restore();
  }

  function dust() {
    for (const d of st.dust) {
      ctx.fillStyle = `rgba(255,250,244,${0.85 * (1 - d.t / d.life)})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r * (1 + d.t * 1.5), 0, Math.PI * 2); ctx.fill();
    }
  }

  function outline() { ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke(); }

  function obstacle(o) {
    const x = o.x, base = M.ground, w = o.w, h = o.h;
    const img = obstacleImgs.get(o.kind);
    // Yer gölgesi
    ctx.fillStyle = 'rgba(120,60,80,.14)';
    ctx.beginPath(); ctx.ellipse(x + w / 2, base + 2, w * 0.55, 4, 0, 0, Math.PI * 2); ctx.fill();
    if (img) { ctx.drawImage(img, x, base - h, w, h); return; }
    switch (o.kind.draw) {
      case 'books': {
        const cols = [['#ffb7c5', '#f49ab0'], ['#a9d4ec', '#7fb3d6'], ['#ffe08a', '#f3c95a'], ['#d8c8f5', '#b9a6e8']];
        const n = 3, bh = h / n;
        for (let i = 0; i < n; i++) {
          const [c, d] = cols[(i + Math.floor(o.x0seed ?? 0)) % cols.length];
          const off = (i % 2 ? 0.06 : -0.02) * w, bw = w * (0.92 - i * 0.06);
          const bx = x + off + (w - bw) / 2, by = base - bh * (i + 1);
          ctx.fillStyle = '#fff8ee'; roundRect(ctx, bx + 3, by + 2, bw - 3, bh - 3, 3); ctx.fill(); // sayfalar
          ctx.fillStyle = c; roundRect(ctx, bx, by, bw, bh - 1, 4); ctx.fill(); outline();
          ctx.fillStyle = d; ctx.fillRect(bx + bw * 0.12, by + 2, bw * 0.07, bh - 5); ctx.fillRect(bx + bw * 0.78, by + 2, bw * 0.07, bh - 5);
          ctx.fillStyle = 'rgba(255,255,255,.7)'; roundRect(ctx, bx + bw * 0.3, by + bh * 0.3, bw * 0.36, bh * 0.3, 2); ctx.fill();
        }
        break;
      }
      case 'cone':
        ctx.fillStyle = '#ffb38a';
        ctx.beginPath(); ctx.moveTo(x + w * 0.42, base - h); ctx.lineTo(x + w * 0.58, base - h);
        ctx.lineTo(x + w * 0.86, base - 7); ctx.lineTo(x + w * 0.14, base - 7); ctx.closePath(); ctx.fill(); outline();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(x + w * 0.33, base - h * 0.62); ctx.lineTo(x + w * 0.67, base - h * 0.62); ctx.lineTo(x + w * 0.72, base - h * 0.45); ctx.lineTo(x + w * 0.28, base - h * 0.45); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(x + w * 0.45, base - h + 3); ctx.lineTo(x + w * 0.36, base - 9); ctx.lineTo(x + w * 0.3, base - 9); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f49ab0'; roundRect(ctx, x, base - 8, w, 8, 3); ctx.fill(); outline();
        break;
      case 'coffee': {
        const cx = x + w * 0.12, cw = w * 0.76;
        ctx.fillStyle = '#fffaf4';
        ctx.beginPath(); ctx.moveTo(cx, base - h * 0.86); ctx.lineTo(cx + cw, base - h * 0.86); ctx.lineTo(cx + cw * 0.88, base); ctx.lineTo(cx + cw * 0.12, base); ctx.closePath(); ctx.fill(); outline();
        ctx.fillStyle = '#d9a98a'; ctx.fillRect(cx + cw * 0.08, base - h * 0.6, cw * 0.84, h * 0.26); // kılıf
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + cw / 2, base - h * 0.47, h * 0.07, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffb7c5'; roundRect(ctx, x + w * 0.04, base - h, w * 0.92, h * 0.16, 5); ctx.fill(); outline(); // kapak
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2;
        for (let k = 0; k < 2; k++) { // buhar
          const bx = cx + cw * (0.38 + k * 0.24), sy = base - h - 4;
          ctx.beginPath(); ctx.moveTo(bx, sy); ctx.bezierCurveTo(bx - 5, sy - h * 0.15, bx + 5, sy - h * 0.2, bx, sy - h * 0.35 + Math.sin(st.t * 4 + k) * 2); ctx.stroke();
        }
        break;
      }
      case 'castle': {
        ctx.fillStyle = '#f3cf94';
        roundRect(ctx, x, base - h * 0.55, w, h * 0.55, 3); ctx.fill(); outline();
        roundRect(ctx, x + w * 0.3, base - h * 0.95, w * 0.4, h * 0.45, 3); ctx.fill(); outline();
        ctx.fillStyle = '#e9bd7c';
        for (let k = 0; k < 3; k++) ctx.fillRect(x + (w * (k * 2 + 0.5)) / 6, base - h * 0.62, w / 9, h * 0.08);
        ctx.fillStyle = '#d9a86a'; roundRect(ctx, x + w * 0.42, base - h * 0.28, w * 0.16, h * 0.28, 4); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x + w * 0.35, base - h * 0.8, w * 0.06, h * 0.12);
        ctx.strokeStyle = '#9c6b4f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + w / 2, base - h * 0.95); ctx.lineTo(x + w / 2, base - h * 1.2); ctx.stroke();
        ctx.fillStyle = '#ff7b93'; ctx.beginPath(); ctx.moveTo(x + w / 2, base - h * 1.2); ctx.lineTo(x + w / 2 + w * 0.2, base - h * 1.13 + Math.sin(st.t * 8) * 1.5); ctx.lineTo(x + w / 2, base - h * 1.06); ctx.fill();
        break;
      }
      case 'ball': {
        const r = Math.min(w, h) / 2;
        const cx = x + w / 2, cy = base - r;
        const cols = ['#ffb7c5', '#fff', '#a9d4ec', '#fff', '#ffe08a', '#fff'];
        cols.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, (i * Math.PI) / 3 + st.t * 4, ((i + 1) * Math.PI) / 3 + st.t * 4); ctx.fill(); });
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); outline();
        ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(cx - r * 0.35, cy - r * 0.4, r * 0.18, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'shell':
        ctx.fillStyle = '#ffc4d2';
        ctx.beginPath(); ctx.ellipse(x + w / 2, base, w / 2, h, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); outline();
        ctx.strokeStyle = '#f49ab0'; ctx.lineWidth = 2;
        for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x + w / 2, base); ctx.lineTo(x + (w * i) / 5, base - h * 0.85); ctx.stroke(); }
        break;
      default:
        ctx.fillStyle = '#d8c8f5'; roundRect(ctx, x, base - h, w, h, 8); ctx.fill(); outline();
    }
  }

  // Sadece geliştirme: konsoldan durum okumak için
  if (import.meta.env.DEV) stage.root.debug = () => ({ st, M });
  return () => b.run();
}
