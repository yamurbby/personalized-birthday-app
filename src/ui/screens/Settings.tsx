import { useState } from 'preact/hooks';
import { actions, useGame } from '../../core/store';
import { Icon, Sheet } from '../components/Bits';
import { credits } from '../../content/credits';

export function Settings({ onClose, onReplayIntro }: { onClose: () => void; onReplayIntro: () => void }) {
  const s = useGame();
  const [confirm, setConfirm] = useState(false);
  const [taps, setTaps] = useState(0);
  return (
    <Sheet title="Ayarlar" onClose={onClose}>
      <div class="settings">
        <button class="row-btn" onClick={() => { onClose(); onReplayIntro(); }}>
          <span>Doğum günü sahnesini tekrar izle</span><Icon name="cake" size={20} />
        </button>
        <button class="row-btn" onClick={() => actions.toggleSound()}>
          <span>Sesler</span><strong>{s.settings.sound ? 'Açık' : 'Kapalı'}</strong>
        </button>
        <p class="muted">İlerlemen sadece bu telefonda, bu tarayıcıda saklanır. Ana ekrana eklersen daha güvende olur.</p>
        {import.meta.env.DEV && (
          <>
            <button class="row-btn" onClick={() => actions.devGrant()}><span>[geliştirici] +50 yıldız</span></button>
            <button class="row-btn" onClick={() => actions.devJourney(s.journey.done + 1)}><span>[geliştirici] haritada 1 durak ilerle</span></button>
            <button class="row-btn" onClick={() => actions.devJourney(0)}><span>[geliştirici] haritayı başa al</span></button>
          </>
        )}
        <details class="credits">
          <summary>Emeği geçenler</summary>
          {credits.map((c) => (
            <p key={c.what}>
              {c.what} — {c.author} ({c.source}),{' '}
              <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">{c.license}</a>. {c.changes}
            </p>
          ))}
        </details>
        {/* Sıfırlama gizli: başlığa 5 kez dokun */}
        <p class="version" onClick={() => setTaps((t) => t + 1)}>Pelin’in Molası · v0.1</p>
        {taps >= 5 && !confirm && (
          <button class="row-btn danger" onClick={() => setConfirm(true)}><span>İlerlemeyi sıfırla</span></button>
        )}
        {confirm && (
          <div class="confirm">
            <p>Tüm ilerleme silinecek. Emin misin?</p>
            <button class="btn danger" onClick={() => { actions.resetAll(); onClose(); }}>Evet, sıfırla</button>
            <button class="btn" onClick={() => setConfirm(false)}>Vazgeç</button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
