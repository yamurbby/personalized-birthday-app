// 6. Hayvan kulesi: üstte gidip gelen hayvan küpünü doğru anda bırak, kuleyi hedef yüksekliğe çıkar.
// Fizik motoru yok; düşüş ve oturma basit hesaplarla.
import { bag, createFx, createStage, hint, hud, livesText, loop, progressHtml, showLose, showWin } from './kit.js';

// ---------------------------------------------------------------------------
// Zorluk ayarları
// ---------------------------------------------------------------------------
export const SETTINGS = {
  targetHeight: 10, // kaç hayvanlık kule kazandırır
  lives: 3, // can sayısı
  swingSpeed: 1.7, // sallanma hızı (radyan/sn): büyüdükçe hızlı gidip gelir
  swingSpeedPerBlock: 0.12, // her yeni hayvanda hıza eklenen miktar
  swingAmplitude: 0.36, // sallanma genişliği (ekran genişliğinin oranı, merkezden bir yana)
  perfectTolerance: 0.08, // "Mükemmel!" için en fazla kayma (küp genişliğinin oranı)
  wobbleFrom: 0.3, // bu orandan fazla kayarsa kule sallanır
  points: 1, // her hayvan
  perfectBonus: 2, // "Mükemmel!" bonusu
  blockWidth: 0.18, // küp gövdesinin genişliği (ekran genişliğinin oranı)
  seatOffset: 0, // tüm hayvanlar için ek oturma payı (küp genişliğinin oranı): + iç içe geçirir, − arayı açar
  baseWidth: 1.6, // alttaki kaidenin genişliği (küp genişliğinin katı)
  gravity: 4.2, // düşüş ivmesi (ekran yüksekliği / sn²)
};

// ---------------------------------------------------------------------------
// Hayvanlar (src/assets/animals/). Eklemek/çıkarmak için satır ekle/sil.
//   seat:   görselin üstünden "oturma yüzeyine" kadar px (kulak, boynuz, anten bunun üstünde kalır;
//           üstteki hayvanın ayakları buraya basar). Küpler iç içe ya da havada duruyorsa bunu ayarla.
//   left/right: gövdenin yanlarındaki boşluk px (kanat, kol, kulak). Ortalama ve düşme bu gövdeye göre hesaplanır.
//   bottom: görselin altındaki boşluk/gölge px (ayakların altı).
// Değerler `npm run animals` ile hesaplandı (görseller 3B modellerden: tools/render-pets.html).
// ---------------------------------------------------------------------------
export const ANIMALS = [
  { file: 'beaver.png', seat: 69, left: 10, right: 10, bottom: 0 },
  { file: 'bee.png', seat: 142, left: 33, right: 33, bottom: 0 },
  { file: 'bunny.png', seat: 111, left: 23, right: 23, bottom: 0 },
  { file: 'cat.png', seat: 116, left: 22, right: 23, bottom: 0 },
  { file: 'caterpillar.png', seat: 57, left: 32, right: 31, bottom: 0 },
  { file: 'chick.png', seat: 43, left: 116, right: 117, bottom: 0 },
  { file: 'cow.png', seat: 42, left: 46, right: 46, bottom: 0 },
  { file: 'crab.png', seat: 41, left: 129, right: 129, bottom: 0 },
  { file: 'deer.png', seat: 131, left: 40, right: 40, bottom: 0 },
  { file: 'dog.png', seat: 36, left: 11, right: 12, bottom: 0 },
  { file: 'elephant.png', seat: 36, left: 83, right: 82, bottom: 0 },
  { file: 'fish.png', seat: 98, left: 74, right: 74, bottom: 0 },
  { file: 'fox.png', seat: 56, left: 16, right: 15, bottom: 0 },
  { file: 'giraffe.png', seat: 61, left: 50, right: 54, bottom: 0 },
  { file: 'hog.png', seat: 43, left: 21, right: 21, bottom: 0 },
  { file: 'koala.png', seat: 39, left: 78, right: 78, bottom: 0 },
  { file: 'lion.png', seat: 103, left: 27, right: 27, bottom: 0 },
  { file: 'monkey.png', seat: 96, left: 101, right: 101, bottom: 0 },
  { file: 'panda.png', seat: 45, left: 19, right: 19, bottom: 0 },
  { file: 'parrot.png', seat: 88, left: 122, right: 122, bottom: 0 },
  { file: 'penguin.png', seat: 43, left: 116, right: 117, bottom: 0 },
  { file: 'pig.png', seat: 36, left: 11, right: 11, bottom: 0 },
  { file: 'polar.png', seat: 31, left: 6, right: 6, bottom: 0 },
  { file: 'tiger.png', seat: 114, left: 32, right: 32, bottom: 0 },
];

const urls = import.meta.glob('../assets/animals/*.png', { eager: true, query: '?url', import: 'default' });
const urlOf = (file) => urls[`../assets/animals/${file}`];

/** Gökyüzü: alttaki ve en tepedeki renkler [üst, alt] */
const SKY_LOW = ['#ffd9e4', '#fff1e8'];
const SKY_HIGH = ['#eef5ff', '#fdf3f7'];
const HUD_H = 52; // üstteki bilgi çubuğu

/** @type {import('./index').StartGame} */
export function startGame(container, _stopData, onComplete) {
  const b = bag();
  const stage = createStage(container, b);
  const { ctx } = stage;
  const fx = createFx(stage);
  const ui = hud(stage.root, { height: '', score: '', lives: '' });
  ui.lives.className = 'gk-chip gk-lives';
  const tip = hint(stage.root, 'Yükleniyor…', { autoHide: 0 });

  // ---- Görseller ----
  let animals = ANIMALS.filter((a) => urlOf(a.file) || (console.warn('[tower] görsel yok:', a.file), false))
    .map((a) => ({ ...a, img: Object.assign(new Image(), { src: urlOf(a.file) }) }));
  let ready = false;
  const loaded = (img) => new Promise((ok) => { if (img.complete) ok(); else { img.onload = img.onerror = () => ok(); } });
  Promise.all(animals.map((a) => loaded(a.img))).then(() => {
    if (b.done) return;
    animals = animals.filter((a) => a.img.naturalWidth > 0); // yüklenemeyenleri atla
    ready = animals.length > 0;
    tip.set('Dokun, hayvanı bırak!');
    b.timeout(() => tip.hide(), 3000);
    reset();
  });

  // ---- Ölçüler ----
  const B = () => Math.min(stage.W * SETTINGS.blockWidth, stage.H * 0.11); // gövde genişliği (px)
  const scaleOf = (a) => B() / (a.img.naturalWidth - a.left - a.right || 1);
  /** ayaktan oturma yüzeyine yükseklik (ek oturma payı dahil) */
  const seatH = (a) => (a.img.naturalHeight - a.bottom - a.seat) * scaleOf(a) - SETTINGS.seatOffset * B();
  const fullH = (a) => (a.img.naturalHeight - a.bottom) * scaleOf(a);
  const groundY = () => stage.H - stage.H * 0.09; // dünya y=0 (kaidenin üstü) ekranda nerede

  // ---- Oyun durumu (dünya: x ekranla aynı, y yukarı doğru, kaidenin üstü = 0) ----
  let stack = []; // { a, x, y, land }
  let current = null; // { a, x, y, vy, phase, rot, state: 'swing'|'drop'|'miss', vx, vr }
  let lives = SETTINGS.lives, score = 0, camera = 0, wobble = 0, time = 0, lastAnimal = null;
  let state = 'play';
  const clouds = Array.from({ length: 24 }, (_, i) => ({ y: 0.25 + i * 0.22 + Math.random() * 0.1, x: Math.random(), s: 0.6 + Math.random() * 0.7, v: (Math.random() - 0.5) * 0.02 }));

  const topY = () => (stack.length ? stack[stack.length - 1].y + seatH(stack[stack.length - 1].a) : 0);
  const support = () => (stack.length ? { x: stack[stack.length - 1].x, half: B() / 2 } : { x: stage.W / 2, half: (B() * SETTINGS.baseWidth) / 2 });
  /** Sallanan hayvanın ayaklarının ekrandaki yeri: bilgi çubuğunun altında, en uzun hayvan sığacak kadar */
  const hangScreenY = () => HUD_H + 16 + B() * 1.8;
  const toScreen = (wy) => groundY() - (wy - camera);
  const swingAmp = () => Math.min(stage.W * SETTINGS.swingAmplitude, stage.W / 2 - B() * 0.8);

  function pickAnimal() {
    const pool = animals.length > 1 ? animals.filter((a) => a !== lastAnimal) : animals;
    lastAnimal = pool[Math.floor(Math.random() * pool.length)];
    return lastAnimal;
  }

  function spawn() {
    const phase = Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2; // bir kenardan başlar
    current = { a: pickAnimal(), x: stage.W / 2 + Math.sin(phase) * swingAmp(), y: 0, vy: 0, vx: 0, rot: 0, vr: 0, state: 'swing', phase };
  }

  function reset() {
    stack = []; lives = SETTINGS.lives; score = 0; camera = 0; wobble = 0; lastAnimal = null; state = 'play';
    spawn();
    renderHud();
  }

  function renderHud() {
    ui.height.innerHTML = progressHtml(`<b>${stack.length}</b>/${SETTINGS.targetHeight}`, stack.length / SETTINGS.targetHeight);
    ui.score.innerHTML = `<b>${score}</b> puan`;
    ui.lives.textContent = livesText(lives, SETTINGS.lives);
  }
  renderHud();

  function drop() {
    if (!ready || state !== 'play' || !current || current.state !== 'swing') return;
    current.state = 'drop';
    current.vy = 0;
    current.rot = 0;
    tip.hide();
  }

  function land() {
    const s = support();
    const dx = current.x - s.x;
    if (Math.abs(dx) > s.half) {
      // Ağırlık merkezi alttakinin dışında: devrilip düşer
      current.state = 'miss';
      current.vx = Math.sign(dx) * stage.W * 0.4;
      current.vr = Math.sign(dx) * 4;
      return;
    }
    const off = Math.abs(dx) / B();
    const perfect = stack.length > 0 ? off <= SETTINGS.perfectTolerance : off <= SETTINGS.perfectTolerance * 2;
    const block = { a: current.a, x: perfect ? s.x : current.x, y: topY(), land: 0 };
    stack.push(block);
    current = null;
    let gain = SETTINGS.points;
    const sy = toScreen(block.y + seatH(block.a));
    if (perfect) {
      gain += SETTINGS.perfectBonus;
      fx.text(block.x, sy - 18, `Mükemmel! +${gain}`, 'big');
      fx.sparkle(block.x, sy + seatH(block.a) * 0.4, 16);
    } else {
      fx.text(block.x, sy - 12, `+${gain}`);
      if (off >= SETTINGS.wobbleFrom) wobble = Math.min(1, wobble + 0.7 + off);
    }
    score += gain;
    renderHud();
    if (stack.length >= SETTINGS.targetHeight) {
      state = 'won';
      showWin(stage, fx, b, onComplete, `${SETTINGS.targetHeight} hayvanlık kule, ${score} puan!`);
    } else spawn();
  }

  function miss() {
    lives--;
    current = null;
    renderHud();
    if (lives <= 0) {
      state = 'lost';
      showLose(stage, b, reset, 'Kule yıkıldı', `${stack.length}/${SETTINGS.targetHeight} hayvana kadar çıktın.`);
    } else {
      fx.text(stage.W / 2, stage.H * 0.5, 'Düştü!', 'bad');
      spawn();
    }
  }

  // ---- Güncelleme ----
  function update(dt) {
    time += dt;
    wobble = Math.max(0, wobble - dt * 0.9);
    // Kamera: kulenin tepesi sallanan hayvanın biraz altında kalsın
    const want = Math.max(0, topY() - (groundY() - hangScreenY() - B() * 1.2));
    camera += (want - camera) * Math.min(1, dt * 3.5);

    if (current) {
      const c = current;
      if (c.state === 'swing') {
        const speed = SETTINGS.swingSpeed + stack.length * SETTINGS.swingSpeedPerBlock;
        c.phase += dt * speed;
        const nx = stage.W / 2 + Math.sin(c.phase) * swingAmp();
        const tilt = -((nx - c.x) / Math.max(dt, 1e-3)) * 0.0004; // gidiş yönüne hafif eğilir
        c.rot = Math.max(-0.15, Math.min(0.15, tilt));
        c.x = nx;
        c.y = camera + (groundY() - hangScreenY()); // ekranda sabit yükseklikte
      } else if (c.state === 'drop') {
        c.vy += SETTINGS.gravity * stage.H * dt;
        c.y -= c.vy * dt;
        if (c.y <= topY()) { c.y = topY(); land(); }
      } else if (c.state === 'miss') {
        c.vy += SETTINGS.gravity * stage.H * dt;
        c.y -= c.vy * dt;
        c.x += c.vx * dt;
        c.rot += c.vr * dt;
        if (toScreen(c.y) > stage.H + B() * 3) miss();
      }
    }
    for (const bl of stack) bl.land += dt;
    for (const c of clouds) { c.x += c.v * dt; if (c.x > 1.2) c.x = -0.2; if (c.x < -0.2) c.x = 1.2; }
    fx.update(dt);
  }

  // ---- Çizim ----
  const lerpColor = (a, c, t) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [x, y] = [p(a), p(c)];
    return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
  };

  function drawAnimal(a, x, feetY, rot = 0, squash = 1) {
    const s = scaleOf(a);
    const iw = a.img.naturalWidth * s, ih = a.img.naturalHeight * s;
    ctx.save();
    ctx.translate(x, feetY);
    ctx.rotate(rot);
    ctx.scale(2 - squash, squash);
    ctx.drawImage(a.img, -(a.left + (a.img.naturalWidth - a.left - a.right) / 2) * s, -ih + a.bottom * s, iw, ih);
    ctx.restore();
  }

  function cloud(x, y, s) {
    ctx.beginPath();
    ctx.ellipse(x, y + 6 * s, 30 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.arc(x - 11 * s, y, 13 * s, 0, Math.PI * 2);
    ctx.arc(x + 9 * s, y - 4 * s, 16 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    stage.begin();
    const { W, H } = stage;
    const p = Math.min(1, camera / Math.max(1, SETTINGS.targetHeight * B() * 0.9));
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, lerpColor(SKY_LOW[0], SKY_HIGH[0], p));
    g.addColorStop(1, lerpColor(SKY_LOW[1], SKY_HIGH[1], p));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Bulutlar (yükseldikçe geçer; biraz paralaks)
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    const cs = Math.max(0.6, W / 420);
    for (const c of clouds) {
      const sy = groundY() - (c.y * H - camera * 0.7);
      if (sy > -40 && sy < H + 40) cloud(c.x * W, sy, c.s * cs);
    }

    // Kaçan hayvan zeminin arkasında kaybolsun
    if (current?.state === 'miss') drawAnimal(current.a, current.x, toScreen(current.y), current.rot);

    // Zemin: mint tepe + kaide
    const gy = toScreen(0);
    if (gy < H + 60) {
      ctx.fillStyle = '#c9eedc';
      ctx.beginPath();
      ctx.moveTo(0, gy + 26);
      ctx.quadraticCurveTo(W / 2, gy - 4, W, gy + 26);
      ctx.lineTo(W, H + 400); ctx.lineTo(0, H + 400); ctx.closePath();
      ctx.fill();
      const bw = B() * SETTINGS.baseWidth;
      ctx.fillStyle = '#ffc4d2';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(W / 2 - bw / 2, gy, bw, 18, 7) : ctx.rect(W / 2 - bw / 2, gy, bw, 18); ctx.fill();
      ctx.fillStyle = '#fff6f0';
      ctx.fillRect(W / 2 - bw / 2 + 5, gy + 3, bw - 10, 5);
    }

    // Kule (sallanırken yükseklikle artan yan kayma)
    const sway = Math.sin(time * 9) * wobble * 0.05;
    for (const bl of stack) {
      const sy = toScreen(bl.y);
      if (sy < -B() * 3 || sy > H + B() * 3) continue;
      const k = Math.min(1, bl.land / 0.25);
      const squash = bl.land < 0.25 ? 1 - Math.sin(k * Math.PI) * 0.12 : 1; // oturunca hafif ezilip toparlanır
      drawAnimal(bl.a, bl.x + sway * (bl.y + seatH(bl.a) / 2), sy, sway * 0.6, squash);
    }

    // Sallanan / düşen hayvan + ip + iniş gölgesi
    if (current && current.state !== 'miss') {
      const sy = toScreen(current.y);
      if (current.state === 'swing') {
        ctx.strokeStyle = '#e8a9ba'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(current.x, HUD_H - 4); ctx.lineTo(current.x, sy - fullH(current.a) + 4); ctx.stroke();
        ctx.fillStyle = '#ff7b93';
        ctx.beginPath(); ctx.arc(current.x, HUD_H - 4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(160,80,110,.12)';
        ctx.beginPath(); ctx.ellipse(current.x, toScreen(topY()) + 2, B() * 0.45, 4, 0, 0, Math.PI * 2); ctx.fill();
      }
      drawAnimal(current.a, current.x, sy, current.rot);
    }
    fx.draw(ctx);
  }

  loop(b, (dt) => { if (ready && stage.W > 0) { update(dt); draw(); } });

  // ---- Girdi ----
  b.on(stage.root, 'pointerdown', (e) => { if (e.target.closest?.('.gk-panel')) return; e.preventDefault(); drop(); });
  b.on(window, 'keydown', (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); drop(); } });
  // Sadece geliştirme: konsoldan durum okumak için (document.querySelector('.gk').debug())
  if (import.meta.env.DEV) stage.root.debug = () => ({ current, stack, lives, score, state, camera, W: stage.W, H: stage.H, B: B(), support: support() });

  return () => b.run();
}
