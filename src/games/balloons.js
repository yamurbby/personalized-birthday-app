// 2. Balon patlat: yükselen balonlara dokun. Kalpli balon 3 puan, yağmur bulutu eksi puan.
import { bag, COLORS, createFx, createStage, hud, loop, pointerPos, progressHtml, rand, showLose, showWin, weighted } from './kit.js';

export const SETTINGS = {
  time: 30, // saniye
  target: 25, // hedef puan
  spawnEvery: 0.4, // kaç saniyede bir yeni balon (ortalama)
  size: 0.085, // balon yarıçapı (ekran genişliğinin oranı)
  speed: 0.26, // yükselme hızı (ekran yüksekliği / sn)
  touchBonus: 1.35, // dokunma alanı balondan bu kadar büyük
  kinds: [
    { type: 'balloon', weight: 76, points: 1, speed: 1 },
    { type: 'heart', weight: 9, points: 3, speed: 1.7 },
    { type: 'cloud', weight: 15, points: -2, speed: 0.8 },
  ],
};

const PASTELS = ['#ffb7c5', '#bdebd6', '#d8c8f5', '#ffe08a', '#a9d4ec', '#ffcfa8'];

/** @type {import('./index').StartGame} */
export function startGame(container, _stopData, onComplete) {
  const b = bag();
  const stage = createStage(container, b);
  const { ctx } = stage;
  const fx = createFx(stage);
  const ui = hud(stage.root, { time: '', score: '' });

  let items = [], score = 0, left = SETTINGS.time, spawnT = 0, shake = 0, state = 'play', t = 0;

  function reset() {
    items = []; score = 0; left = SETTINGS.time; spawnT = 0; shake = 0; state = 'play';
    renderHud();
  }
  function renderHud() {
    ui.time.innerHTML = `⏱ <b>${Math.ceil(left)}</b> sn`;
    ui.score.innerHTML = progressHtml(`<b>${score}</b>/${SETTINGS.target}`, score / SETTINGS.target);
  }
  reset();

  function spawn() {
    const k = weighted(SETTINGS.kinds);
    const r = stage.W * SETTINGS.size * (k.type === 'cloud' ? 1.15 : rand(0.85, 1.1));
    items.push({
      ...k, r, x: rand(r * 1.2, stage.W - r * 1.2), y: stage.H + r * 2,
      vy: stage.H * SETTINGS.speed * k.speed * rand(0.8, 1.25), phase: rand(0, 6), color: PASTELS[Math.floor(Math.random() * PASTELS.length)],
    });
  }

  function hit(p) {
    // Üstte çizilen (sonra eklenen) önce
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const cx = it.x + Math.sin(it.phase) * it.r * 0.25;
      if (Math.hypot(p.x - cx, p.y - it.y) <= it.r * SETTINGS.touchBonus) {
        items.splice(i, 1);
        score = Math.max(0, score + it.points);
        if (it.type === 'cloud') { shake = 0.35; fx.text(cx, it.y, `${it.points}`, 'bad'); }
        else { fx.burst(cx, it.y, it.type === 'heart' ? 24 : 14); fx.text(cx, it.y - it.r, `+${it.points}`, it.type === 'heart' ? 'big' : 'good'); }
        renderHud();
        if (score >= SETTINGS.target) win();
        return;
      }
    }
  }

  function win() { state = 'won'; showWin(stage, fx, b, onComplete, `${score} puan topladın!`); }
  function lose() { state = 'lost'; showLose(stage, b, reset, 'Süre doldu', `${score}/${SETTINGS.target} puan. Bir daha?`); }

  b.on(stage.root, 'pointerdown', (e) => {
    if (state !== 'play') return;
    e.preventDefault();
    hit(pointerPos(stage, e));
  });

  loop(b, (dt) => {
    t += dt;
    if (state === 'play') {
      left -= dt;
      if (left <= 0) { left = 0; renderHud(); lose(); }
      else if (Math.ceil(left) !== Math.ceil(left + dt)) renderHud();
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = SETTINGS.spawnEvery * rand(0.6, 1.4); }
    }
    for (const it of items) { it.y -= it.vy * dt; it.phase += dt * 2.2; }
    items = items.filter((it) => it.y > -it.r * 3);
    shake = Math.max(0, shake - dt);
    fx.update(dt);
    draw();
  });

  function draw() {
    stage.begin();
    const { W, H } = stage;
    if (shake > 0) ctx.translate(Math.sin(t * 70) * shake * 14, Math.cos(t * 55) * shake * 6);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#dff0ff'); g.addColorStop(0.6, '#fff0f5'); g.addColorStop(1, '#fff6ee');
    ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
    for (const it of items) {
      const x = it.x + Math.sin(it.phase) * it.r * 0.25;
      if (it.type === 'cloud') drawCloud(x, it.y, it.r);
      else drawBalloon(x, it.y, it.r, it.type === 'heart' ? '#ff8fab' : it.color, it.type === 'heart', it.phase);
    }
    fx.draw(ctx);
  }

  function drawBalloon(x, y, r, color, heart, phase) {
    // İp
    ctx.strokeStyle = 'rgba(120,90,110,.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y + r * 1.2);
    ctx.quadraticCurveTo(x + Math.sin(phase) * r * 0.3, y + r * 1.8, x, y + r * 2.4); ctx.stroke();
    // Balon
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.88, r * 1.05, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - r * 0.14, y + r * 1.16); ctx.lineTo(x + r * 0.14, y + r * 1.16); ctx.lineTo(x, y + r * 0.98); ctx.fill();
    // Parlaklık
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.18, r * 0.3, -0.5, 0, Math.PI * 2); ctx.fill();
    if (heart) {
      ctx.fillStyle = '#fff';
      const s = r * 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.55);
      ctx.bezierCurveTo(x - s * 1.1, y - s * 0.1, x - s * 0.5, y - s * 0.9, x, y - s * 0.3);
      ctx.bezierCurveTo(x + s * 0.5, y - s * 0.9, x + s * 1.1, y - s * 0.1, x, y + s * 0.55);
      ctx.fill();
    }
  }

  function drawCloud(x, y, r) {
    ctx.fillStyle = '#a9adbb';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.2, r * 1.1, r * 0.48, 0, 0, Math.PI * 2);
    ctx.arc(x - r * 0.45, y, r * 0.45, 0, Math.PI * 2);
    ctx.arc(x + r * 0.3, y - r * 0.15, r * 0.58, 0, Math.PI * 2);
    ctx.fill();
    // Damlalar
    ctx.fillStyle = '#8fbbe0';
    for (let i = -1; i <= 1; i++) {
      const dx = x + i * r * 0.45, dy = y + r * 0.85 + ((t * 60 + i * 13) % (r * 0.6));
      ctx.beginPath(); ctx.ellipse(dx, dy, r * 0.06, r * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    }
    // Somurtkan yüz
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath(); ctx.arc(x - r * 0.25, y + r * 0.05, r * 0.06, 0, Math.PI * 2); ctx.arc(x + r * 0.25, y + r * 0.05, r * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.ink; ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.beginPath(); ctx.arc(x, y + r * 0.35, r * 0.16, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  }

  return () => b.run();
}
