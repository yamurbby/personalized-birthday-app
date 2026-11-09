import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { actions, getState, useGame } from '../../core/store';
import { moodOf } from '../../core/needs';
import { dayKey, isToday } from '../../core/time';
import type { SaveState } from '../../core/types';
import { config } from '../../content/config';
import { bouquets, potUrl, type Bouquet } from '../../content/flowers';
import { foods } from '../../content/foods';
import { moodLines, musicLines, petLines } from '../../content/lines';
import { isMusicPlaying, nowPlayingTitle, onMusic, playMusic, stopMusic } from '../../core/music';
import { artOf, theme } from '../../theme';
import { Art } from '../components/Art';
import { Bubble, Icon, Sheet } from '../components/Bits';
import type { Hotspot } from '../../theme/types';
import { Character } from '../components/Character';
import { SideTable } from '../components/SideTable';

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
type SheetId = 'feed' | 'cheer' | 'flowers' | null;

/** Oda sahnesi: render edilmiş oda (hafif pastel filtreli) + dokunulabilir eşyalar. */
export function RoomScene({ s, onBed, onChair, children }: {
  s: SaveState; onBed?: () => void; onChair?: () => void; children?: ComponentChildren;
}) {
  const bg = theme.roomBackground;
  const spots = theme.roomHotspots;
  const spot = (h: Hotspot) => ({ left: `${h.left}%`, top: `${h.top}%`, width: `${h.width}%`, height: `${h.height}%` });
  return (
    <div class={`room ${s.sleepingSince ? 'lights-off' : ''}`}>
      {bg?.kind === 'img' && <img class="room-bg" src={bg.src} alt="" draggable={false} />}
      <div class="room-tint" />
      {spots?.bed && onBed && (
        <button class="hotspot" style={spot(spots.bed)} onClick={onBed} aria-label="Yatak: dinlen" />
      )}
      {spots?.chair && onChair && (
        <button class="hotspot" style={spot(spots.chair)} onClick={onChair} aria-label="Koltuk: neşelendir" />
      )}
      {isToday(config.birthday) && <div class="bday-banner">{config.birthdayBanner}</div>}
      {children}
    </div>
  );
}

export function Room({ onWardrobe }: { onWardrobe: () => void }) {
  const s = useGame();
  const mood = moodOf(s);
  const [sheet, setSheet] = useState<SheetId>(null);
  const [line, setLine] = useState<string | null>(null);
  const [bounce, setBounce] = useState(0);
  /** Pelin'e doğru uçan buket (animasyon bitince verilir) */
  const [flying, setFlying] = useState<Bouquet | null>(null);

  const say = (t: string | null) => { setLine(t); setBounce((b) => b + 1); };

  // Ara sıra kendiliğinden konuşsun
  useEffect(() => {
    say(pick(moodLines[moodOf(getState())]));
    const id = setInterval(() => setLine(pick(moodLines[moodOf(getState())])), 15000);
    return () => clearInterval(id);
  }, []);

  const sleeping = !!s.sleepingSince;
  const rest = () => { stopMusic(); actions.sleep(); setLine('Zzz…'); };
  // Müzik: çalarken Pelin dans eder, notalar süzülür; odadan çıkınca durur
  const [playing, setPlaying] = useState(isMusicPlaying());
  useEffect(() => { const off = onMusic(setPlaying); return () => { off(); stopMusic(); }; }, []);
  // Sarıl: Yağmur yandan gelir, Pelin'e sarılır, kalpler uçar, sonra çıkar
  const [hug, setHug] = useState(0);
  const hugLines = [`Ben de seni çok seviyorum ${config.partnerName}!`, 'En sevdiğim sarılma 💗', 'Bırakma beni hemen!', 'Tam da buna ihtiyacım vardı.'];
  const hugNow = () => {
    actions.pet();
    setSheet(null);
    const id = Date.now();
    setHug(id);
    window.setTimeout(() => say(pick(hugLines)), 600);
    window.setTimeout(() => setHug((h) => (h === id ? 0 : h)), 3400);
  };
  const music = () => {
    actions.music();
    setSheet(null);
    if (!s.settings.sound) { say('Ses kapalı… Ayarlar’dan açarsan şarkımızı çalarım!'); return; }
    playMusic();
    say(pick(musicLines));
  };
  const giveFlowers = (b: Bouquet) => {
    setSheet(null);
    setFlying(b);
    setTimeout(() => { actions.giveFlowers(b.id); say(b.line); setFlying(null); }, 1300);
  };
  /** Bugün verilen buket vazoda durur */
  const vase = s.bouquet && s.bouquet.day === dayKey() ? bouquets.find((b) => b.id === s.bouquet!.id) : undefined;

  return (
    <section class="screen room-screen">
      <RoomScene
        s={s}
        onBed={sleeping ? undefined : rest}
        onChair={sleeping ? undefined : () => setSheet('cheer')}
      >
        <div class={`pelin-spot ${playing ? 'dancing' : ''} ${hug ? 'hugging' : ''}`}>
          {hug > 0 && (
            <>
              {/* Yağmur Pelin'in yanında belirir, omuz omuza başlarını yaslarlar; aralarında kalp atar */}
              <span class="hug-partner" key={hug} aria-hidden="true">
                <Character who="partner" mood="happy" size={150} />
              </span>
              <span class="hug-heart" key={`h${hug}`} aria-hidden="true">💗</span>
              <span class="hug-hearts" key={`s${hug}`} aria-hidden="true">
                {[0, 1, 2, 3].map((i) => <i key={i} style={{ animationDelay: `${0.9 + i * 0.35}s`, left: `${15 + i * 22}%` }}>💗</i>)}
              </span>
            </>
          )}
          {playing && (
            <span class="music-notes" aria-hidden="true">
              {['♪', '♫', '♪', '♬', '♫', '♪'].map((n, i) => <i key={i} style={{ animationDelay: `${i * 0.45}s`, left: `${10 + ((i * 37) % 80)}%` }}>{n}</i>)}
            </span>
          )}
          <Bubble text={line} />
          <SideTable pot={vase && potUrl(vase)} potName={vase?.name} />
          <Character
            who="pelin"
            mood={mood}
            size={150}
            bounce={bounce}
            onTap={sleeping ? undefined : () => { actions.pet(); say(pick(petLines)); }}
          />
        </div>
      </RoomScene>

      {sleeping ? (
        <div class="action-bar">
          <p class="sleep-note">Pelin uyuyor… enerji doluyor <Icon name="energy" size={18} /> {Math.round(s.needs.energy)}%</p>
          <button class="btn primary" onClick={() => { actions.wake(); say('Günaydın! Ne kadar uyudum?'); }}>Uyandır</button>
        </div>
      ) : (
        <>
          {playing && (
            <button class="music-pill" onClick={stopMusic} aria-label="Müziği durdur">
              <span class="music-pill-note">♪</span> {nowPlayingTitle} <b>■ Durdur</b>
            </button>
          )}
        <div class="action-bar">
          <ActionBtn icon="feed" label="Besle" onClick={() => setSheet('feed')} />
          <ActionBtn icon="rest" label="Dinlen" onClick={rest} />
          <ActionBtn icon="cheer" label="Neşelendir" onClick={() => setSheet('cheer')} />
          <ActionBtn icon="wardrobe" label="Gardırop" onClick={onWardrobe} />
        </div>
        </>
      )}

      {sheet === 'feed' && (
        <Sheet title="Ne yesin?" onClose={() => setSheet(null)}>
          <div class="grid3">
            {foods.map((f) => (
              <button key={f.id} class={`tile ${f.favorite ? 'fav' : ''}`} onClick={() => {
                const l = actions.feed(f.id);
                say(l ?? 'Mmm, teşekkürler!');
                setSheet(null);
              }}>
                <Art art={artOf(theme.foods, f.id)} size={48} />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {sheet === 'cheer' && (
        <Sheet title="Neşelendir" onClose={() => setSheet(null)}>
          <div class="grid3">
            <button class="tile" onClick={hugNow}>
              <Icon name="pet" size={44} /><span>Sarıl</span>
            </button>
            <button class="tile" onClick={music}>
              <Icon name="music" size={44} /><span>Müzik aç</span>
            </button>
            <button class="tile" onClick={() => setSheet('flowers')}>
              <Icon name="flowers" size={44} /><span>Çiçek ver</span>
            </button>
            <button class="tile" onClick={() => {
              const n = actions.drawNote();
              say(n ?? 'Bugünlük notlar bitti, yarın yenileri gelir.');
              setSheet(null);
            }}>
              <Icon name="note" size={44} /><span>Sürpriz not</span>
              <small>{actions.notesLeftToday()} kaldı</small>
            </button>
          </div>
        </Sheet>
      )}

      {sheet === 'flowers' && (
        <Sheet title="Hangi çiçeği verelim?" onClose={() => setSheet(null)}>
          <div class="grid3">
            {bouquets.map((b) => (
              <button key={b.id} class="tile bouquet-tile" onClick={() => giveFlowers(b)}>
                {potUrl(b) ? <img class="bouquet-img" src={potUrl(b)} alt="" draggable={false} /> : <span class="bouquet-emoji">{b.emoji}</span>}
                <span>{b.name}</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {/* Buket aşağıdan Pelin'e uçar, etrafına yaprak yağar */}
      {flying && (
        <div class="flower-fly" aria-hidden="true">
          <span class="flower-bunch">{flying.emoji}</span>
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i} class="petal" style={{ left: `${8 + ((i * 53) % 84)}%`, animationDelay: `${0.5 + (i % 6) * 0.12}s` }}>
              {i % 3 ? '🌸' : flying.emoji}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button class="action-btn" onClick={onClick}>
      <Icon name={icon} size={30} />
      <span>{label}</span>
    </button>
  );
}
