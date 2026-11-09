// Uygulamadaki katmanlı chibi karakteri (saç, yüz, kıyafet, renkler) tek bir tuvale birleştirir.
// Tuval oyunlarında karakteri görsel olarak çizmek için: const sprite = await characterSprite('pelin', 240)
import { getState } from '../core/store';
import { theme } from '../theme';
import { lookLayers } from '../ui/components/Character';

const load = (src) => new Promise((ok) => {
  const img = new Image();
  img.onload = () => ok(img);
  img.onerror = () => ok(null);
  img.src = src;
});

/**
 * who: 'pelin' | 'partner'; width: çıktı genişliği (cihaz pikseli); look: verilmezse kayıttaki kombin.
 * face: 'happy' gibi bir yüz adı. Dönüş: HTMLCanvasElement (yükseklik = width × aspect).
 */
export async function characterSprite(who, width, { look, face = 'happy' } = {}) {
  const set = theme.characters[who];
  const { body, head } = lookLayers(look ?? getState().look[who]);
  const faceArt = set.faces[face] ?? set.faces.idle;
  const layers = [
    ...[set.hairBack, set.base].filter(Boolean).map((art) => ({ art })),
    ...body,
    { art: faceArt },
    ...(set.hair ? [{ art: set.hair }] : []),
    ...head,
  ].filter((l) => l.art?.kind === 'img');

  const w = Math.round(width), h = Math.round(width * set.aspect);
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  const imgs = await Promise.all(layers.map((l) => load(l.art.src)));
  const tmp = document.createElement('canvas');
  tmp.width = w; tmp.height = h;
  const tctx = tmp.getContext('2d');
  layers.forEach((l, i) => {
    const img = imgs[i];
    if (!img) return;
    ctx.drawImage(img, 0, 0, w, h);
    if (l.tint) {
      // Uygulamadaki gibi: parçanın şekliyle maskelenmiş renk, "multiply" ile üstüne biner
      tctx.globalCompositeOperation = 'source-over';
      tctx.clearRect(0, 0, w, h);
      tctx.drawImage(img, 0, 0, w, h);
      tctx.globalCompositeOperation = 'source-in';
      tctx.fillStyle = l.tint;
      tctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(tmp, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
  });
  return out;
}
