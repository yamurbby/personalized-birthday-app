// 4. Fotoğraf yapbozu: durağın ilk fotoğrafı kare kırpılır, parçalara bölünür ve karıştırılır.
// Sürükle-bırak ya da iki parçaya sırayla dokunarak yer değiştir. (DOM ile; tuval gerekmez.)
import { bag, createFx, hud, loadImage, loop, showWin } from './kit.js';

export const SETTINGS = {
  grid: 3, // 3 → 3×3, 4 → 4×4
  boardWidth: 0.94, // tahta genişliği (ekran genişliğinin oranı)
  maxStartCorrect: 1, // karıştırınca en fazla bu kadar parça doğru yerde başlasın
  topOffset: 0.15, // dikey fotoğrafta kare kırpma üstten bu oranda aşağıdan başlar (puzzleCrop yoksa)
};

/** @type {import('./index').StartGame} */
export function startGame(container, stopData, onComplete) {
  const b = bag();
  const N = SETTINGS.grid;
  const root = document.createElement('div');
  root.className = 'gk';
  container.append(root);
  b.add(() => root.remove());

  // Efektler için şeffaf tuval (konfeti, parıltı) en üstte
  const canvas = document.createElement('canvas');
  canvas.className = 'gk-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:4';
  const stage = { root, canvas, ctx: canvas.getContext('2d'), W: 0, H: 0, dpr: 1 };
  const fx = createFx(stage);

  const wrap = document.createElement('div');
  wrap.className = 'pz';
  const board = document.createElement('div');
  board.className = 'pz-board';
  board.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
  const hintImg = document.createElement('div');
  hintImg.className = 'pz-hint-img';
  const tools = document.createElement('div');
  tools.className = 'pz-tools';
  const hintBtn = document.createElement('button');
  hintBtn.className = 'btn';
  hintBtn.textContent = 'İpucu (basılı tut)';
  tools.append(hintBtn);
  wrap.append(board, tools);
  root.append(wrap, canvas);
  const ui = hud(root, { moves: 'Hamle: <b>0</b>', info: `${N}×${N}` });

  const photo = stopData.puzzlePhoto ?? stopData.photos[0];
  const crop = stopData.puzzleCrop;
  let bg = { url: '', w: 1, h: 1 };
  let order = []; // order[konum] = parça no
  let moves = 0, size = 0, solved = false, sel = -1;
  let tiles = [];

  const fit = () => {
    stage.W = root.clientWidth; stage.H = root.clientHeight;
    stage.dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(stage.W * stage.dpr); canvas.height = Math.round(stage.H * stage.dpr);
    canvas.style.width = `${stage.W}px`; canvas.style.height = `${stage.H}px`;
    size = Math.floor(Math.min(stage.W * SETTINGS.boardWidth, stage.H - 150));
    board.style.width = board.style.height = `${size}px`;
    paint();
  };
  const ro = new ResizeObserver(fit);
  ro.observe(root);
  b.add(() => ro.disconnect());

  /** Kare kırpma (cover): fotoğrafın ortasından kare */
  function bgFor(piece, tile) {
    const s = Math.max(size / bg.w, size / bg.h);
    const w = bg.w * s, h = bg.h * s;
    // Kare kırpma: puzzleCrop odağı varsa ona göre; yoksa yatayda ortadan, dikeyde üstten %15 aşağıdan
    const clampOff = (v, max) => Math.max(0, Math.min(max, v));
    const ox = crop ? clampOff(crop.x * w - size / 2, w - size) : (w - size) / 2;
    const oy = crop ? clampOff(crop.y * h - size / 2, h - size) : clampOff(h * SETTINGS.topOffset, h - size);
    const col = piece % N, row = Math.floor(piece / N);
    return { image: `url("${bg.url}")`, size: `${w}px ${h}px`, pos: `${-(ox + col * tile)}px ${-(oy + row * tile)}px` };
  }

  function paint() {
    const gap = solved ? 0 : 3;
    const tile = (size - gap * (N + 1)) / N;
    const full = size - (solved ? 0 : 6);
    tiles.forEach((el, pos) => {
      const piece = order[pos];
      // Parçanın arka planı tahtanın tam boyutuna göre: kenar boşlukları hesaba katılmadan tam görüntü
      const st = bgFor(piece, size / N);
      el.style.width = el.style.height = `${tile}px`;
      el.style.backgroundImage = bg.url ? st.image : 'none';
      el.style.backgroundSize = st.size;
      el.style.backgroundPosition = st.pos;
      el.classList.toggle('sel', pos === sel);
    });
    const h = bgFor(0, 0);
    hintImg.style.backgroundImage = bg.url ? h.image : 'none';
    hintImg.style.backgroundSize = h.size.replace(/[\d.]+px/g, (v) => `${(parseFloat(v) * full) / size}px`);
    hintImg.style.backgroundPosition = h.pos.replace(/[\d.]+px/g, (v) => `${(parseFloat(v) * full) / size}px`);
  }

  function shuffle() {
    const ids = [...Array(N * N).keys()];
    do {
      for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    } while (ids.filter((p, i) => p === i).length > SETTINGS.maxStartCorrect);
    order = ids;
  }

  function build() {
    board.innerHTML = '';
    board.append(hintImg);
    tiles = order.map((_, pos) => {
      const el = document.createElement('div');
      el.className = 'pz-tile';
      el.dataset.pos = String(pos);
      board.append(el);
      return el;
    });
    paint();
  }

  function swap(a, c) {
    if (a === c || solved) return;
    [order[a], order[c]] = [order[c], order[a]];
    moves++;
    ui.moves.innerHTML = `Hamle: <b>${moves}</b>`;
    sel = -1;
    paint();
    for (const p of [a, c]) {
      if (order[p] === p) {
        const el = tiles[p];
        el.classList.remove('good'); void el.offsetWidth; el.classList.add('good');
        const r = el.getBoundingClientRect(), rr = root.getBoundingClientRect();
        fx.sparkle(r.left - rr.left + r.width / 2, r.top - rr.top + r.height / 2, 10);
      }
    }
    if (order.every((p, i) => p === i)) finish();
  }

  function finish() {
    solved = true;
    sel = -1;
    board.classList.add('solved');
    tools.style.visibility = 'hidden';
    paint();
    const rr = root.getBoundingClientRect(), r = board.getBoundingClientRect();
    fx.sparkle(r.left - rr.left + r.width / 2, r.top - rr.top + r.height / 2, 28);
    b.timeout(() => showWin(stage, fx, b, onComplete, `${moves} hamlede tamamladın!`), 600);
  }

  // ---- Sürükle / dokun ----
  let drag = null; // { from, x0, y0, ghost }
  b.on(board, 'pointerdown', (e) => {
    const el = e.target.closest?.('.pz-tile');
    if (!el || solved) return;
    e.preventDefault();
    board.setPointerCapture?.(e.pointerId);
    drag = { from: Number(el.dataset.pos), x0: e.clientX, y0: e.clientY, ghost: null };
  });
  b.on(board, 'pointermove', (e) => {
    if (!drag) return;
    if (!drag.ghost && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) {
      const src = tiles[drag.from];
      const g = src.cloneNode();
      g.className = 'pz-ghost';
      const r = src.getBoundingClientRect();
      g.style.width = `${r.width}px`; g.style.height = `${r.height}px`;
      document.body.append(g);
      drag.ghost = g; drag.w = r.width;
      src.classList.add('drag-src');
    }
    if (drag.ghost) {
      drag.ghost.style.left = `${e.clientX - drag.w / 2}px`;
      drag.ghost.style.top = `${e.clientY - drag.w / 2}px`;
    }
  });
  const end = (e) => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (d.ghost) {
      d.ghost.remove();
      tiles[d.from].classList.remove('drag-src');
      const under = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.pz-tile');
      if (under && board.contains(under)) swap(d.from, Number(under.dataset.pos));
      return;
    }
    // Dokunma: önce seç, sonra ikinciye dokununca yer değiştir
    if (sel < 0) { sel = d.from; paint(); }
    else if (sel === d.from) { sel = -1; paint(); }
    else swap(sel, d.from);
  };
  b.on(board, 'pointerup', end);
  b.on(board, 'pointercancel', () => { if (drag?.ghost) { drag.ghost.remove(); tiles[drag.from].classList.remove('drag-src'); } drag = null; });
  b.add(() => drag?.ghost?.remove());

  // İpucu: basılı tutunca tamamlanmış hali yarı saydam
  const on = (e) => { e.preventDefault(); hintImg.classList.add('on'); };
  const off = () => hintImg.classList.remove('on');
  b.on(hintBtn, 'pointerdown', on);
  b.on(hintBtn, 'pointerup', off);
  b.on(hintBtn, 'pointerleave', off);
  b.on(hintBtn, 'pointercancel', off);
  b.on(window, 'keydown', (e) => { if (e.key === 'h' || e.key === 'H') hintImg.classList.add('on'); });
  b.on(window, 'keyup', (e) => { if (e.key === 'h' || e.key === 'H') off(); });

  // Efekt döngüsü (sadece parıltı/konfeti)
  loop(b, (dt) => {
    fx.update(dt);
    stage.ctx.setTransform(stage.dpr, 0, 0, stage.dpr, 0, 0);
    stage.ctx.clearRect(0, 0, stage.W, stage.H);
    fx.draw(stage.ctx);
  });

  shuffle();
  build();
  fit();
  if (photo) {
    loadImage(photo.full).catch(() => loadImage(photo.thumb)).then((img) => {
      bg = { url: img.src, w: img.naturalWidth, h: img.naturalHeight };
      paint();
    }).catch(() => {});
  }

  // Sadece geliştirme: konsoldan durum okumak için
  if (import.meta.env.DEV) root.debug = () => ({ order: [...order], moves, solved });
  return () => b.run();
}
