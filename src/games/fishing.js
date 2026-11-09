// 5. Balık tutma: denizde bir yere dokun → kayık oraya kayar, iğne iner. Tekrar dokun → yukarı çekilir.
// İğne inerken (ya da boş çıkarken) bir şeye değerse takılır. Balıklar derinlik şeritlerinde düzenli yüzer.
// Balık listesi: fish-config.js   Şişedeki mektuplar: src/content/bottle-notes.ts
import { actions } from '../core/store';
import { characterSprite } from './character.js';
import { drawFish, FISH, loadSheets } from './fish-config.js';
import { bag, createFx, createStage, hint, hud, loop, pointerPos, progressHtml, rand, roundRect, showLose, showNote, showWin, weighted } from './kit.js';

export const SETTINGS = {
  time: 60, // saniye
  target: 150, // hedef puan
  lanes: 7, // derinlik şeridi sayısı: her şeritte bir şey yüzer (dağılım düzenli olsun)
  fishSize: 0.1, // balık boyu (ekran genişliğinin oranı; piksel net kalsın diye tam kata yuvarlanır)
  swimSpeed: 0.15, // temel yüzme hızı (ekran genişliği / sn)
  hookDown: 0.65, // iğnenin inme hızı (ekran yüksekliği / sn)
  hookUp: 1.0, // balıkla yukarı çekme hızı
  hookUpEmpty: 1.4, // boş çekme hızı
  catchRadius: 0.6, // yakalama yarıçapı (balık boyunun oranı; affedici)
  boatSpeed: 1.6, // kayığın kayma hızı (ekran genişliği / sn)
  boatWidth: 0.3, // kayık genişliği (ekran genişliğinin oranı)
  surface: 0.24, // deniz yüzeyi (ekran yüksekliğinin oranı)
  maxLetters: 1, // bir oyunda en fazla kaç mektuplu şişe çıksın
};

/** @type {import('./index').StartGame} */
export function startGame(container, _stopData, onComplete) {
  const b = bag();
  const stage = createStage(container, b, { pixel: true });
  const { ctx } = stage;
  const fx = createFx(stage);
  const ui = hud(stage.root, { time: '', score: '' });
  const tip = hint(stage.root, 'Denizde bir yere dokun: iğne oraya iner · Tekrar dokun: çek');

  let imgs = {}, pelin = null;
  loadSheets().then((x) => { imgs = x; });
  characterSprite('pelin', 240).then((c) => { pelin = c; });

  const surface = () => stage.H * SETTINGS.surface;
  const size = () => Math.min(stage.W * SETTINGS.fishSize, stage.H * 0.07);
  const boatW = () => Math.min(stage.W * SETTINGS.boatWidth, 150);
  /** iğne kayığın sağındaki olta ucundan iner */
  const hookX = () => st.boat.x + boatW() * 0.42;
  /** şeridin derinliği (0 = en üst, 1 = en alt) ve y konumu */
  const laneY = (i) => {
    const s = size(), top = surface() + s * 1.1, bottom = stage.H - s * 0.9;
    return top + ((bottom - top) * i) / Math.max(1, SETTINGS.lanes - 1);
  };

  let st;
  const bubbles = Array.from({ length: 14 }, () => ({ x: Math.random(), y: Math.random(), r: rand(1.5, 4), v: rand(0.03, 0.08) }));
  function reset() {
    st = {
      state: 'play', left: SETTINGS.time, score: 0, letters: 0, flash: 0, t: 0,
      lanes: Array(SETTINGS.lanes).fill(null),
      boat: { x: stage.W * 0.4, target: stage.W * 0.4 },
      hook: { y: 0, mode: 'idle', catch: null },
    };
    for (let i = 0; i < SETTINGS.lanes; i++) spawn(i, true);
    renderHud();
  }
  function renderHud() {
    ui.time.innerHTML = `⏱ <b>${Math.ceil(st.left)}</b> sn`;
    ui.score.innerHTML = progressHtml(`<b>${st.score}</b>/${SETTINGS.target}`, st.score / SETTINGS.target);
  }

  /**
   * Bir şeride yeni bir şey koyar. Derin şeritlerde nadir balık olasılığı artar, kabuklular en alt şeritte.
   * anywhere: oyun başında ekranın her yerine dağıt (boş başlamasın).
   */
  function spawn(lane, anywhere = false) {
    const depth = lane / Math.max(1, SETTINGS.lanes - 1);
    const bottomLane = lane === SETTINGS.lanes - 1;
    const pool = FISH.filter((f) => (f.type !== 'special' || st.letters < SETTINGS.maxLetters) && (f.type !== 'shell' || bottomLane))
      .map((f) => ({
        f,
        weight: f.weight * (f.rarity === 'rare' ? 0.3 + depth * 1.6 : f.rarity === 'legendary' ? depth * depth * 2 : f.type === 'shell' ? 2.5 : 1),
      }));
    const { f } = weighted(pool);
    const s = size() * (f.rarity === 'legendary' ? 1.25 : 1);
    const dir = lane % 2 ? 1 : -1; // komşu şeritler ters yönde yüzer
    const v = stage.W * SETTINGS.swimSpeed * f.speed * rand(0.85, 1.15);
    const x = anywhere ? rand(s, stage.W - s) : dir > 0 ? -s * rand(1, 2) : stage.W + s * rand(1, 2);
    st.lanes[lane] = { f, dir, s, v, x, y: laneY(lane), t: rand(0, 6) };
    if (f.type === 'special') st.letters++;
  }

  // ---- Girdi ----
  function tapAt(x) {
    if (st.state !== 'play') return;
    tip.hide();
    const h = st.hook;
    if (h.mode === 'idle') {
      // kayık dokunulan yere kayar, iğne hemen iner (kayık kayarken de iğne onunla gider)
      st.boat.target = Math.max(boatW() / 2, Math.min(stage.W - boatW() * 0.9, x - boatW() * 0.42));
      h.mode = 'down';
    } else if (h.mode === 'down') h.mode = 'up';
  }
  b.on(stage.root, 'pointerdown', (e) => {
    if (e.target.closest?.('.gk-panel')) return;
    e.preventDefault();
    tapAt(pointerPos(stage, e).x);
  });
  b.on(window, 'keydown', (e) => {
    if (st.state !== 'play') return;
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault();
      if (st.hook.mode === 'idle') st.boat.target = Math.max(boatW() / 2, Math.min(stage.W - boatW() * 0.9, st.boat.target + (e.code === 'ArrowLeft' ? -1 : 1) * stage.W * 0.12));
    }
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown') {
      e.preventDefault();
      if (e.repeat) return;
      if (st.hook.mode === 'idle') st.hook.mode = 'down';
      else if (st.hook.mode === 'down') st.hook.mode = 'up';
      tip.hide();
    }
  });

  function landed(c) {
    const f = c.f;
    const x = hookX(), y = surface() - 14;
    if (f.type === 'special') {
      st.state = 'note';
      fx.sparkle(x, y, 18, ['#fff', '#ffd36e', '#a9d4ec']);
      const note = actions.nextBottleNote();
      showNote(stage, 'Şişede bir mektup var! 💌', note, () => { st.state = 'play'; });
      return;
    }
    st.score = Math.max(0, st.score + f.points);
    if (f.type !== 'trash') actions.addFish(f.id);
    if (f.rarity === 'legendary') {
      st.flash = 1;
      fx.sparkle(x, y, 34, ['#ffd36e', '#ff8fab', '#fff', '#ffe27a']);
      fx.burst(x, y, 30);
      fx.text(stage.W / 2, stage.H * 0.42, `Efsanevi! +${f.points}`, 'big');
    } else if (f.points < 0) {
      fx.text(x, y, `${f.points} ${f.name}`, 'bad');
    } else {
      if (f.rarity === 'rare') fx.sparkle(x, y, 16);
      fx.text(x, y, `+${f.points} ${f.name}`, f.rarity === 'rare' ? 'big' : 'good');
    }
    renderHud();
    if (st.score >= SETTINGS.target) {
      st.state = 'won';
      showWin(stage, fx, b, onComplete, `${st.score} puan! Balıkların koleksiyona eklendi.`);
    }
  }

  function tryCatch(hy) {
    const hx = hookX();
    for (let i = 0; i < st.lanes.length; i++) {
      const fi = st.lanes[i];
      if (!fi) continue;
      const yy = fi.y + Math.sin(fi.t * 3) * fi.s * 0.08;
      if (Math.abs(fi.x - hx) < fi.s * SETTINGS.catchRadius + 4 && Math.abs(yy - hy) < fi.s * SETTINGS.catchRadius) {
        st.hook.catch = fi;
        st.hook.mode = 'up';
        st.lanes[i] = null;
        spawn(i);
        return true;
      }
    }
    return false;
  }

  reset();

  loop(b, (dt) => {
    st.t += dt;
    if (st.state === 'play') {
      st.left -= dt;
      if (Math.ceil(st.left) !== Math.ceil(st.left + dt)) renderHud();
      if (st.left <= 0) {
        st.left = 0; st.state = 'lost'; renderHud();
        showLose(stage, b, reset, 'Süre doldu', `${st.score}/${SETTINGS.target} puan. Bir daha?`);
      }
      // Balıklar: şeridinden çıkan yerine yenisi gelir
      st.lanes.forEach((fi, i) => {
        if (!fi) return spawn(i);
        fi.x += fi.dir * fi.v * dt; fi.t += dt;
        if (fi.x < -fi.s * 5 || fi.x > stage.W + fi.s * 5) spawn(i);
      });
      // Kayık hedefe kayar
      const bt = st.boat, d = bt.target - bt.x, max = SETTINGS.boatSpeed * stage.W * dt;
      bt.x += Math.abs(d) < max ? d : Math.sign(d) * max;
      // İğne
      const h = st.hook, maxY = stage.H - size() * 0.5 - surface();
      if (h.mode === 'down') {
        h.y += SETTINGS.hookDown * stage.H * dt;
        if (h.y >= maxY) { h.y = maxY; h.mode = 'up'; }
        tryCatch(surface() + h.y);
      } else if (h.mode === 'up') {
        h.y -= (h.catch ? SETTINGS.hookUp : SETTINGS.hookUpEmpty) * stage.H * dt;
        if (!h.catch) tryCatch(surface() + h.y); // boş çıkarken de takılabilir
        if (h.y <= 0) {
          h.y = 0; h.mode = 'idle';
          const c = h.catch; h.catch = null;
          if (c) landed(c);
        }
      }
    }
    for (const bu of bubbles) { bu.y -= bu.v * dt; if (bu.y < 0) { bu.y = 1; bu.x = Math.random(); } }
    st.flash = Math.max(0, st.flash - dt * 1.5);
    fx.update(dt);
    draw();
  });

  function draw() {
    stage.begin();
    const { W, H, dpr } = stage;
    const sf = surface();
    // Gökyüzü
    const sky = ctx.createLinearGradient(0, 0, 0, sf);
    sky.addColorStop(0, '#ffe9ef'); sky.addColorStop(1, '#fff6ee');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, sf);
    // Deniz: aşağı doğru koyulaşan pastel mavi
    const sea = ctx.createLinearGradient(0, sf, 0, H);
    sea.addColorStop(0, '#bfe6f7'); sea.addColorStop(0.6, '#8cc7e6'); sea.addColorStop(1, '#5f9fcb');
    ctx.fillStyle = sea; ctx.fillRect(0, sf, W, H - sf);
    ctx.fillStyle = '#f6e3c4'; ctx.fillRect(0, H - 10, W, 10);
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.2;
    for (const bu of bubbles) { ctx.beginPath(); ctx.arc(bu.x * W, sf + bu.y * (H - sf), bu.r, 0, Math.PI * 2); ctx.stroke(); }
    // Balıklar (sprite'lar sola bakar → sağa yüzenler çevrilir)
    for (const fi of st.lanes) if (fi) drawFish(ctx, imgs, fi.f, fi.x, fi.y + Math.sin(fi.t * 3) * fi.s * 0.08, fi.s, dpr, fi.dir > 0);

    // Dalga çizgisi
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (let x = -((st.t * 20) % 30); x < W; x += 30) { ctx.beginPath(); ctx.ellipse(x, sf + 2, 10, 2.5, 0, 0, Math.PI * 2); ctx.fill(); }
    // ---- Kayık ve Pelin (küçük kayık, Pelin belden yukarısı görünür) ----
    const bw = boatW(), bh = bw * 0.3, bx = st.boat.x;
    const bob = Math.sin(st.t * 2) * 2;
    const rim = sf - bh * 0.55 + bob; // kayık kenarı
    const tipX = hookX(), tipY = rim - bw * 0.75;
    if (pelin) {
      const pw = bw * 0.78, ph = (pelin.height / pelin.width) * pw;
      const show = 0.7; // görselin üstten ne kadarı çizilir (baş + gövde; alt kısmı kayığın içinde kalır)
      ctx.drawImage(pelin, 0, 0, pelin.width, pelin.height * show, bx - pw * 0.58, rim - ph * 0.62, pw, ph * show);
    }
    // Olta: Pelin'in elinden uca
    ctx.strokeStyle = '#9c6b4f'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx + bw * 0.08, rim - bh * 0.4); ctx.lineTo(tipX, tipY); ctx.stroke();
    ctx.lineCap = 'butt';
    // Gövde (Pelin'in alt kısmını örter)
    ctx.fillStyle = '#ffc4d2';
    ctx.beginPath();
    ctx.moveTo(bx - bw / 2, rim); ctx.lineTo(bx + bw / 2, rim);
    ctx.quadraticCurveTo(bx + bw * 0.44, rim + bh, bx + bw * 0.28, rim + bh);
    ctx.lineTo(bx - bw * 0.28, rim + bh);
    ctx.quadraticCurveTo(bx - bw * 0.44, rim + bh, bx - bw / 2, rim);
    ctx.fill();
    ctx.strokeStyle = 'rgba(91,68,82,.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#fff6f0'; roundRect(ctx, bx - bw * 0.48, rim - 2, bw * 0.96, 5, 2); ctx.fill();
    // İp + iğne
    const hy = sf + st.hook.y;
    ctx.strokeStyle = 'rgba(80,60,70,.65)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(tipX, hy); ctx.stroke();
    ctx.strokeStyle = '#6b5560'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(tipX + 3, hy + 2, 4, Math.PI * 0.1, Math.PI * 1.1, false); ctx.stroke();
    ctx.fillStyle = '#ff7b93'; ctx.beginPath(); ctx.arc(tipX, hy - 8, 3.5, 0, Math.PI * 2); ctx.fill();
    if (st.hook.catch) drawFish(ctx, imgs, st.hook.catch.f, tipX, hy + st.hook.catch.s * 0.35, st.hook.catch.s, dpr, false);
    // Efsanevi parlama
    if (st.flash > 0) { ctx.fillStyle = `rgba(255,236,170,${st.flash * 0.45})`; ctx.fillRect(0, 0, W, H); }
    fx.draw(ctx);
  }

  // Sadece geliştirme: konsoldan durum okumak için
  if (import.meta.env.DEV) stage.root.debug = () => ({ st, hookX: hookX(), surface: surface(), size: size() });
  return () => b.run();
}
