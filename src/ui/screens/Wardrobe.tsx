// Gardırop / “Bizi Giydir”: dolaptaki parçalarla Pelin'i ve beni serbestçe giydir.
import { useMemo, useState } from 'preact/hooks';
import { actions, useGame } from '../../core/store';
import type { Look, PieceSlot, Who } from '../../core/types';
import { costOf, isUnlocked } from '../../core/unlocks';
import { accessories, outfits, palette, whoNames } from '../../content/outfits';
import { theme } from '../../theme';
import { sfx } from '../../core/sfx';
import { CostTag, Icon, Overlay } from '../components/Bits';
import { Character } from '../components/Character';

type Tab = 'ready' | PieceSlot | 'acc';
const tabs: { id: Tab; label: string; icon: string }[] = [
  // icon: theme.icons içindeki ad
  { id: 'ready', label: 'Hazır', icon: 'ready' },
  { id: 'top', label: 'Üst', icon: 'top' },
  { id: 'bottom', label: 'Alt', icon: 'bottom' },
  { id: 'dress', label: 'Elbise', icon: 'dress' },
  { id: 'shoes', label: 'Ayakkabı', icon: 'shoes' },
  { id: 'acc', label: 'Aksesuar', icon: 'acc' },
];

/** Küçük resimde parçanın görünen bölgesi (tuvale göre %) */
const focus: Record<PieceSlot | 'acc', string> = {
  top: '50% 58%', bottom: '50% 78%', dress: '50% 68%', shoes: '50% 97%', acc: '50% 40%',
};

/** Tema içindeki parça id'leri, sırayla: '1','1c','2','2c'… */
function piecesOf(slot: PieceSlot): string[] {
  return Object.keys(theme.wardrobe)
    .filter((k) => k.startsWith(`${slot}-`))
    .map((k) => k.slice(slot.length + 1))
    .sort((a, b) => parseInt(a) - parseInt(b) || a.length - b.length);
}

export function Wardrobe({ onClose, initialWho = 'pelin' }: { onClose: () => void; initialWho?: Who }) {
  const s = useGame();
  const [who, setWho] = useState<Who>(initialWho);
  const [drafts, setDrafts] = useState<Record<Who, Look>>(() => structuredClone(s.look));
  const [tab, setTab] = useState<Tab>('ready');
  const look = drafts[who];
  const changed = JSON.stringify(drafts) !== JSON.stringify(s.look);

  const edit = (fn: (l: Look) => void) => {
    setDrafts((d) => {
      const next = structuredClone(d);
      fn(next[who]);
      return next;
    });
    sfx('pop');
  };

  const choose = (slot: PieceSlot, id: string | undefined) => edit((l) => {
    l[slot] = id;
    if (slot === 'dress' && id) { delete l.top; delete l.bottom; }
    if ((slot === 'top' || slot === 'bottom') && id && l.dress) {
      // elbiseden üst-alta geçerken eksik parçayı tamamla
      delete l.dress;
      l.top ??= '1c';
      l.bottom ??= '1c';
    }
    if (l.colors && !id) delete l.colors[slot];
  });

  const setColor = (slot: PieceSlot, c: string | null) => edit((l) => {
    l.colors ??= {};
    if (c) l.colors[slot] = c; else delete l.colors[slot];
  });

  const toggleAcc = (id: string) => edit((l) => {
    const cur = new Set(l.acc ?? []);
    if (cur.has(id)) cur.delete(id); else cur.add(id);
    l.acc = [...cur];
  });

  const save = () => {
    (['pelin', 'partner'] as Who[]).forEach((w) => {
      if (JSON.stringify(drafts[w]) !== JSON.stringify(s.look[w])) actions.saveLook(w, drafts[w]);
    });
    onClose();
  };

  const slotTab = tab === 'top' || tab === 'bottom' || tab === 'dress' || tab === 'shoes' ? tab : null;
  const pieces = useMemo(() => (slotTab ? piecesOf(slotTab) : []), [slotTab]);
  // Elbise varken üst/alt seçili sayılmaz, tersi de
  const colorable = slotTab && look[slotTab];

  return (
    <Overlay class="wardrobe">
      <header class="wd-head">
        <button class="icon-btn" onClick={onClose} aria-label="Kapat">✕</button>
        <h1>Gardırop</h1>
        <button class={`btn primary small ${changed ? '' : 'muted-btn'}`} onClick={save} disabled={!changed}>Kaydet</button>
      </header>

      <div class="wd-stage">
        {(['pelin', 'partner'] as Who[]).map((w) => (
          <button key={w} class={`wd-person ${who === w ? 'on' : ''}`} onClick={() => { setWho(w); sfx('flip'); }}>
            <Character who={w} mood="happy" size={who === w ? 128 : 92} look={drafts[w]} />
            <span class="wd-name">{whoNames[w]}</span>
          </button>
        ))}
      </div>

      <div class="closet">
        <div class="closet-top">
          {tabs.map((t) => (
            <button key={t.id} class={`drawer ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={22} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div class="closet-inside">
          {slotTab && (slotTab === 'top' || slotTab === 'dress') && <div class="rod" />}

          {tab === 'ready' && (
            <div class="hangers">
              {outfits.filter((o) => o.who === who).map((o) => {
                const open = isUnlocked(s, 'outfits', o.id);
                const cost = costOf(o.unlock);
                return (
                  <button key={o.id} class={`hanger-item preset ${open ? '' : 'locked'}`} onClick={() => {
                    if (!open) { if (cost) actions.buy('outfits', o.id); return; }
                    edit((l) => { Object.keys(l).forEach((k) => delete (l as any)[k]); Object.assign(l, structuredClone(o.look)); });
                  }}>
                    <span class={open ? '' : 'dim'}><Character who={who} mood="happy" size={58} look={o.look} /></span>
                    <span class="hanger-label">{o.name}</span>
                    {!open && (cost ? <CostTag {...cost} /> : <small>{o.unlock.type === 'event' ? o.unlock.hint : <Icon name="lock" size={14} />}</small>)}
                  </button>
                );
              })}
            </div>
          )}

          {slotTab && (
            <div class={`hangers ${slotTab === 'shoes' || slotTab === 'bottom' ? 'shelf' : ''}`}>
              {slotTab === 'shoes' && (
                <button class={`hanger-item ${!look.shoes ? 'on' : ''}`} onClick={() => choose('shoes', undefined)}>
                  <span class="thumb none">Yalın ayak</span>
                </button>
              )}
              {pieces.map((id) => {
                const art = theme.wardrobe[`${slotTab}-${id}`];
                const src = art?.kind === 'img' ? art.src : '';
                return (
                  <button key={id} class={`hanger-item ${look[slotTab] === id ? 'on' : ''}`} onClick={() => choose(slotTab, id)}>
                    <span class="thumb" style={{ backgroundImage: `url("${src}")`, backgroundPosition: focus[slotTab] }} />
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'acc' && (
            <div class="hangers">
              {accessories.map((a) => {
                const open = actions.accessoryOpen(a.id, s);
                const art = theme.wardrobe[`acc-${a.id}`];
                const src = art?.kind === 'img' ? art.src : '';
                return (
                  <button key={a.id} class={`hanger-item ${look.acc?.includes(a.id) ? 'on' : ''} ${open ? '' : 'locked'}`}
                    onClick={() => open && toggleAcc(a.id)}>
                    <span class={`thumb ${open ? '' : 'dim'}`} style={{ backgroundImage: `url("${src}")`, backgroundPosition: a.layer === 'head' ? '50% 8%' : focus.acc }} />
                    <span class="hanger-label">{a.name}</span>
                    {!open && <small>{outfits.find((o) => o.id === a.requires[0])?.name} ile açılır</small>}
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {colorable && (
          <div class="swatches" aria-label="Renk">
            {palette.map((c) => (
              <button
                key={c ?? 'orig'}
                class={`swatch ${(look.colors?.[slotTab!] ?? null) === c ? 'on' : ''} ${c ? '' : 'orig'}`}
                style={c ? { background: c } : undefined}
                onClick={() => setColor(slotTab!, c)}
                aria-label={c ?? 'Kendi rengi'}
              >{c ? '' : '↺'}</button>
            ))}
          </div>
        )}
      </div>
    </Overlay>
  );
}
