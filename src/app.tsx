import { useEffect, useState } from 'preact/hooks';
import { actions, useGame } from './core/store';
import type { TabId } from './core/types';
import { theme } from './theme';
import { Toasts } from './ui/components/Bits';
import { NavBar } from './ui/components/NavBar';
import { TopBar } from './ui/components/TopBar';
import { Campus } from './ui/screens/Campus';
import { Intro } from './ui/screens/Intro';
import { Room } from './ui/screens/Room';
import { Settings } from './ui/screens/Settings';
import { Together } from './ui/screens/Together';
import { findTogetherCard } from './ui/together';
import { Wardrobe } from './ui/screens/Wardrobe';

export function App() {
  const s = useGame();
  const [tab, setTab] = useState<TabId>('room');
  const [card, setCard] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [replayIntro, setReplayIntro] = useState(false);
  const [wardrobe, setWardrobe] = useState(false);

  useEffect(() => {
    actions.init();
    // İhtiyaçları canlı güncelle; uygulamaya geri dönünce de hesapla
    const id = setInterval(() => actions.tick(), 30_000);
    const vis = () => document.visibilityState === 'visible' && actions.tick();
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, []);

  const openCard = findTogetherCard(card);

  return (
    <div class={`app ${theme.pixelArt ? 'pixel' : ''}`}>
      <TopBar onSettings={() => setSettings(true)} />
      <main class="content">
        {tab === 'room' && <Room onWardrobe={() => setWardrobe(true)} />}
        {tab === 'campus' && <Campus />}
        {tab === 'together' && <Together onOpen={setCard} />}
      </main>
      <NavBar tab={tab} onTab={setTab} />

      {openCard && <openCard.Screen onClose={() => setCard(null)} />}
      {wardrobe && <Wardrobe onClose={() => setWardrobe(false)} />}
      {settings && <Settings onClose={() => setSettings(false)} onReplayIntro={() => setReplayIntro(true)} />}
      {!s.seenIntro && <Intro />}
      {s.seenIntro && replayIntro && <Intro onDone={() => setReplayIntro(false)} />}
      <Toasts />
    </div>
  );
}
