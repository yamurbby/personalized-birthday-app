import { useGame } from '../../core/store';
import type { Look, Mood, PieceSlot, Who } from '../../core/types';
import { config } from '../../content/config';
import { accessories } from '../../content/outfits';
import { theme } from '../../theme';
import type { Art as ArtT } from '../../theme/types';
import { Art } from './Art';

interface Props {
  who: Who;
  mood?: Mood;
  /** genişlik px; yükseklik temadaki oranla hesaplanır */
  size?: number;
  onTap?: () => void;
  bounce?: number; // değişince zıplama animasyonu tetiklenir
  /** kayıttaki kombin yerine bunu giydir (önizleme, sahneler) */
  look?: Look;
  /** sahneye özel yüz (ör. 'wish', 'blow'); temada yoksa ruh hali yüzü kullanılır */
  face?: string;
}

interface Layer { art: ArtT; tint?: string }

/** Kombini çizim sırasına göre katmanlara çevirir. */
export function lookLayers(look: Look): { body: Layer[]; head: Layer[] } {
  const piece = (slot: PieceSlot): Layer | null => {
    const id = look[slot];
    const art = id ? theme.wardrobe[`${slot}-${id}`] : undefined;
    return art ? { art, tint: look.colors?.[slot] } : null;
  };
  const acc = (layer: 'body' | 'head') => (look.acc ?? [])
    .filter((id) => accessories.find((a) => a.id === id)?.layer === layer)
    .map((id) => theme.wardrobe[`acc-${id}`])
    .filter((a): a is ArtT => !!a)
    .map((art) => ({ art }));
  const clothes = look.dress ? [piece('shoes'), piece('dress')] : [piece('shoes'), piece('bottom'), piece('top')];
  return { body: [...clothes.filter((x): x is Layer => !!x), ...acc('body')], head: acc('head') };
}

/** Bir katman; renk varsa parçanın şekliyle maskelenmiş bir renk katmanı “multiply” ile üstüne biner. */
function LayerView({ layer }: { layer: Layer }) {
  const src = layer.art.kind === 'img' ? layer.art.src : null;
  return (
    <>
      <Art art={layer.art} size="100%" class="char-layer" />
      {layer.tint && src && (
        <span
          class="char-layer char-tint"
          style={{ background: layer.tint, WebkitMaskImage: `url("${src}")`, maskImage: `url("${src}")` }}
        />
      )}
    </>
  );
}

/** Katmanlı karakter: arka saç → gövde → kıyafet → gövde aksesuarı → yüz → saç → baş aksesuarı */
export function Character({ who, mood = 'idle', size = 180, onTap, bounce, look, face }: Props) {
  const s = useGame();
  const set = theme.characters[who];
  const { body, head } = lookLayers(look ?? s.look[who]);
  const faceArt = (face && set.faces[face]) || set.faces[mood] || set.faces.idle;
  const layers: Layer[] = [
    ...[set.hairBack, set.base].filter((x): x is ArtT => !!x).map((art) => ({ art })),
    ...body,
    { art: faceArt },
    ...(set.hair ? [{ art: set.hair }] : []),
    ...head,
  ];
  const h = Math.round(size * set.aspect);
  const cls = `character ${mood === 'sleeping' ? 'is-sleeping' : 'is-awake'}`;
  const style = { width: `${size}px`, height: `${h}px` };
  const stack = (
    <span key={bounce} class={`char-stack ${bounce ? 'bounce' : ''}`}>
      {layers.map((l, i) => <LayerView key={i} layer={l} />)}
    </span>
  );
  const label = who === 'pelin' ? config.pelinName : config.partnerName;

  // Dokunulamıyorsa düz öğe: başka bir düğmenin içinde tıklamayı yutmasın
  return onTap
    ? <button type="button" class={cls} onClick={onTap} aria-label={label} style={style}>{stack}</button>
    : <span class={cls} role="img" aria-label={label} style={style}>{stack}</span>;
}
