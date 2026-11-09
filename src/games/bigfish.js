// 7. Büyük balık ol: Pelin'in balığı parmağın biraz üstünü takip eder. Küçükleri ye, büyü; büyüklerden kaç.
// Balıklar fish-config.js'ten (çöp, kabuklu ve mektup hariç). Oyuncu ince beyaz çizgiyle ayırt edilir.
import { FISH, loadSheets, SPRITE, spriteCanvas } from './fish-config.js';
import { bag, createFx, createStage, hint, hud, livesText, loop, pick, pointerPos, progressHtml, rand, showLose, showWin } from './kit.js';

export const SETTINGS = {
  player: 'japon', // Pelin'in balığı (fish-config.js'teki id)
  startSize: 0.08, // başlangıç boyu (ekran genişliğinin oranı)
  goalSize: 0.22, // bu boya ulaşınca kazanılır
  lives: 3,
  follow: 7, // takip yumuşaklığı (büyük = daha çabuk)
  maxSpeed: 1.1, // en yüksek hız (ekran genişliği / sn)
  fingerOffset: 0.09, // balık parmağın ne kadar üstünde dursun (ekran yüksekliğinin oranı)
  fishCount: 9, // ekrandaki balık sayısı
  minEdible: 3, // her zaman en az bu kadar yenebilir balık olsun
  edibleBelow: 0.9, // bundan küçük oranda olanlar yenebilir
  growth: 0.35, // yenen balığın boyunun ne kadarı kadar büyünür (alan mantığıyla)
  invulnerable: 1.6, // can kaybedince dokunulmazlık (sn)
  hitbox: 0.33, // çarpışma yarıçapı (boyun oranı; affedici)
  dangerColor: '#ff7b6b', // yenemeyeceğin (büyük) balıkların dış çizgisi
};

/** @type {import('./index').StartGame} */
export function startGame(container, _stopData, onComplete) {
  const b = bag();
  const stage = createStage(container, b, { pixel: true });
  const { ctx } = stage;
  const fx = createFx(stage);
  const ui = hud(stage.root, { grow: '', lives: '' });
  const tip = hint(stage.root, 'Parmağını sürükle: küçükleri ye, büyüklerden kaç!');

  const swimmers = FISH.filter((f) => f.type === 'fish');
  const playerFish = FISH.find((f) => f.id === SETTINGS.player) ?? swimmers[0];
  let imgs = {};
  const outlined = new Map();
  loadSheets().then((x) => { imgs = x; });

  /** 1 piksellik dış çizgili 18×18 kopya: oyuncu beyaz, tehlikeli (büyük) balıklar mercan */
  function outline(f, color = '#fff') {
    const key = f.id + color;
    if (outlined.has(key)) return outlined.get(key);
    const img = imgs[f.sheet];
    if (!img?.naturalWidth) return null;
    const c = document.createElement('canvas');
    c.width = c.height = SPRITE + 2;
    const g = c.getContext('2d');
    const sil = document.createElement('canvas');
    sil.width = sil.height = SPRITE;
    const sg = sil.getContext('2d');
    sg.drawImage(img, f.col * SPRITE, f.row * SPRITE, SPRITE, SPRITE, 0, 0, SPRITE, SPRITE);
    sg.globalCompositeOperation = 'source-in';
    sg.fillStyle = color; sg.fillRect(0, 0, SPRITE, SPRITE);
    for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) g.drawImage(sil, dx, dy);
    g.drawImage(img, f.col * SPRITE, f.row * SPRITE, SPRITE, SPRITE, 1, 1, SPRITE, SPRITE);
    outlined.set(key, c);
    return c;
  }

  /** Piksel net çizim: cihaz pikselinde tam kat ölçek */
  function sprite(src, sx, sy, n, cx, cy, size, flip, rotate = false) {
    const scale = Math.max(1, Math.round((size * stage.dpr) / SPRITE));
    const s = (scale * n) / stage.dpr;
    ctx.save();
    // Önce döndür (yatık sprite → yatay), sonra yüzme yönüne göre aynala
    ctx.translate(Math.round(cx * stage.dpr) / stage.dpr, Math.round(cy * stage.dpr) / stage.dpr);
    if (flip) ctx.scale(-1, 1);
    if (rotate) ctx.rotate(-Math.PI / 4);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, sx, sy, n, n, -s / 2, -s / 2, s, s);
    ctx.restore();
  }

  let st;
  function reset() {
    const W = stage.W, H = stage.H;
    st = {
      state: 'ready', lives: SETTINGS.lives, t: 0, inv: 0, eaten: 0,
      p: { x: W / 2, y: H * 0.55, s: W * SETTINGS.startSize, right: true },
      target: { x: W / 2, y: H * 0.55 }, keys: {}, fish: [],
    };
    renderHud();
  }
  const growth = () => (st.p.s - stage.W * SETTINGS.startSize) / (stage.W * (SETTINGS.goalSize - SETTINGS.startSize));
  function renderHud() {
    ui.grow.innerHTML = progressHtml('Büyüme', growth());
    ui.lives.className = 'gk-chip gk-lives';
    ui.lives.textContent = livesText(st.lives, SETTINGS.lives);
  }
  reset();

  function spawn(small = false) {
    const edible = st.fish.filter((o) => o.s < st.p.s * SETTINGS.edibleBelow).length;
    const r = small || edible < SETTINGS.minEdible ? rand(0.4, 0.78) : rand(0.5, 1.9);
    const s = Math.min(stage.W * 0.5, Math.max(stage.W * 0.04, st.p.s * r));
    const dir = Math.random() < 0.5 ? 1 : -1;
    st.fish.push({
      f: pick(swimmers), s, dir, x: dir > 0 ? -s : stage.W + s,
      y: rand(70 + s / 2, stage.H - s / 2 - 10),
      v: stage.W * rand(0.1, 0.24) / Math.sqrt(Math.max(0.6, s / st.p.s)), t: rand(0, 6),
    });
  }

  // Girdi: parmak/fare hedefi (biraz üstü), klavye okları
  const aim = (e) => {
    const q = pointerPos(stage, e);
    const touch = e.pointerType === 'touch';
    st.target = { x: q.x, y: q.y - (touch ? stage.H * SETTINGS.fingerOffset : 0) };
    if (st.state === 'ready') { st.state = 'play'; tip.hide(); }
  };
  b.on(stage.root, 'pointerdown', (e) => { if (e.target.closest?.('.gk-panel')) return; e.preventDefault(); aim(e); });
  b.on(stage.root, 'pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) aim(e); });
  const keyMap = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd', KeyA: 'l', KeyD: 'r', KeyW: 'u', KeyS: 'd' };
  b.on(window, 'keydown', (e) => { const k = keyMap[e.code]; if (k) { e.preventDefault(); st.keys[k] = true; if (st.state === 'ready') { st.state = 'play'; tip.hide(); } } });
  b.on(window, 'keyup', (e) => { const k = keyMap[e.code]; if (k) st.keys[k] = false; });

  loop(b, (dt) => {
    const W = stage.W, H = stage.H;
    st.t += dt;
    if (st.state === 'play' || st.state === 'ready') {
      const p = st.p;
      // Klavye: hedefi kaydır
      const kv = W * 0.8 * dt;
      if (st.keys.l) st.target.x -= kv;
      if (st.keys.r) st.target.x += kv;
      if (st.keys.u) st.target.y -= kv;
      if (st.keys.d) st.target.y += kv;
      st.target.x = Math.max(0, Math.min(W, st.target.x));
      st.target.y = Math.max(60, Math.min(H, st.target.y));
      // Yumuşak takip (ışınlanma yok) + hız sınırı
      let dx = (st.target.x - p.x) * Math.min(1, dt * SETTINGS.follow);
      let dy = (st.target.y - p.y) * Math.min(1, dt * SETTINGS.follow);
      const max = W * SETTINGS.maxSpeed * dt, d = Math.hypot(dx, dy);
      if (d > max) { dx *= max / d; dy *= max / d; }
      p.x += dx; p.y += dy;
      if (Math.abs(dx) > 0.3) p.right = dx > 0;
      p.x = Math.max(p.s / 2, Math.min(W - p.s / 2, p.x));
      p.y = Math.max(60 + p.s / 2, Math.min(H - p.s / 2, p.y));
    }
    if (st.state === 'play') {
      st.inv = Math.max(0, st.inv - dt);
      while (st.fish.length < SETTINGS.fishCount) spawn();
      // Her zaman yenebilecek balık olsun (büyüyünce eskiler tehlikeli hale gelebilir)
      let guard = 0;
      while (st.fish.filter((o) => o.s < st.p.s * SETTINGS.edibleBelow).length < SETTINGS.minEdible && guard++ < 5) spawn(true);
      for (const o of st.fish) { o.x += o.dir * o.v * dt; o.t += dt; }
      st.fish = st.fish.filter((o) => o.x > -o.s * 1.5 && o.x < W + o.s * 1.5);
      const p = st.p;
      for (const o of [...st.fish]) {
        const oy = o.y + Math.sin(o.t * 3) * o.s * 0.06;
        if (Math.hypot(o.x - p.x, oy - p.y) > (o.s + p.s) * SETTINGS.hitbox) continue;
        if (o.s < p.s * SETTINGS.edibleBelow) {
          st.fish.splice(st.fish.indexOf(o), 1);
          p.s = Math.sqrt(p.s * p.s + (o.s * o.s) * SETTINGS.growth);
          st.eaten++;
          fx.text(o.x, oy, `+${Math.max(1, Math.round((o.s / p.s) * 10))}`);
          fx.sparkle(o.x, oy, 8);
          renderHud();
          if (growth() >= 1) {
            st.state = 'won';
            fx.sparkle(p.x, p.y, 30);
            showWin(stage, fx, b, onComplete, `${st.eaten} balık yedin, kocaman oldun!`);
            break;
          }
        } else if (st.inv <= 0) {
          st.lives--;
          st.inv = SETTINGS.invulnerable;
          fx.text(p.x, p.y - p.s / 2, 'Ay!', 'bad');
          // Geri sekme
          const ang = Math.atan2(p.y - oy, p.x - o.x);
          st.target = { x: p.x + Math.cos(ang) * W * 0.25, y: p.y + Math.sin(ang) * W * 0.25 };
          renderHud();
          if (st.lives <= 0) {
            st.state = 'lost';
            showLose(stage, b, reset, 'Yakalandın!', `${Math.round(growth() * 100)}% büyüdün. Bir daha?`);
            break;
          }
        }
      }
    }
    fx.update(dt);
    draw();
  });

  function draw() {
    stage.begin();
    const { W, H } = stage;
    const sea = ctx.createLinearGradient(0, 0, 0, H);
    sea.addColorStop(0, '#d6f0fb'); sea.addColorStop(0.55, '#a7d6ee'); sea.addColorStop(1, '#7db7dc');
    ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);
    // Işık huzmeleri + yosun
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    for (let i = 0; i < 4; i++) {
      const x = ((i * 0.27 + st.t * 0.01) % 1) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + W * 0.08, 0); ctx.lineTo(x - W * 0.1, H); ctx.lineTo(x - W * 0.2, H); ctx.fill();
    }
    ctx.fillStyle = '#9fdcc0';
    for (let i = 0; i < 7; i++) {
      const x = (i + 0.5) * (W / 7), h = H * (0.08 + (i % 3) * 0.03);
      ctx.beginPath(); ctx.ellipse(x + Math.sin(st.t * 1.5 + i) * 4, H - h / 2, 6, h / 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    // Diğer balıklar: yenebilenler normal; yenemeyeceği (büyük) olanlar mercan çizgili ve nabız gibi atar.
    // Her karede oyuncunun o anki boyuna göre karar verilir: oyuncu büyüyünce tehlikeli olan normale döner.
    for (const o of st.fish) {
      const oy = o.y + Math.sin(o.t * 3) * o.s * 0.06;
      const img = imgs[o.f.sheet];
      if (!img?.naturalWidth) continue;
      const danger = o.s >= st.p.s * SETTINGS.edibleBelow;
      const red = danger && outline(o.f, SETTINGS.dangerColor);
      if (red) {
        const pulse = 1 + Math.sin(st.t * 7 + o.t) * 0.05;
        sprite(red, 0, 0, SPRITE + 2, o.x, oy, o.s * pulse * ((SPRITE + 2) / SPRITE), o.dir > 0, o.f.rotate);
      } else sprite(spriteCanvas(img, o.f), 0, 0, SPRITE + 2, o.x, oy, o.s * ((SPRITE + 2) / SPRITE), o.dir > 0, o.f.rotate); // ayrı kesilmiş kopya: komşu sprite sızmaz
    }
    // Oyuncu (beyaz dış çizgi; dokunulmazken yanıp söner)
    const p = st.p;
    const out = outline(playerFish);
    if (out && !(st.inv > 0 && Math.floor(st.t * 12) % 2)) sprite(out, 0, 0, SPRITE + 2, p.x, p.y, p.s * ((SPRITE + 2) / SPRITE), p.right, playerFish.rotate);
    fx.draw(ctx);
  }

  // Sadece geliştirme: konsoldan durum okumak için
  if (import.meta.env.DEV) stage.root.debug = () => ({ st, M: typeof M === 'undefined' ? null : M });
  return () => b.run();
}
