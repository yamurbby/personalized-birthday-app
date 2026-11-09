// Haritadaki görevler (mini oyunlar) için ortak arayüz ve TEK kayıt listesi.
//
// Yeni oyun eklemek:
//   1. Bu klasöre bir dosya yaz (ör. quiz.js; örnekler: scratch.js, tower.js; ortak yardımcılar: kit.js) ve bir `startGame` fonksiyonu dışa aktar:
//
//        import type { StartGame } from './index';
//        export const startGame: StartGame = (container, stopData, onComplete) => {
//          container.innerHTML = '...';   // oyunu container'ın içine çiz
//          // oyun bitince:  onComplete();
//          return () => { ... };          // isteğe bağlı: oyundan çıkılınca temizlik (zamanlayıcı, dinleyici)
//        };
//
//   2. Aşağıdaki `games` listesine bir satır ekle:   puzzle: { name: 'Yapboz', startGame: puzzle },
//   3. content/journey.ts içinde bir durağa ver:      task: 'puzzle'
//
// container: oyun ekranındaki boş alan (başlık çubuğunun altı, ekranın geri kalanı; position: relative).
// stopData: o durağın verisi: başlık, tarih, yazı, fotoğraflar (thumb/full adresleri). Bkz. core/journey.ts
// onComplete(): oyun kazanılınca çağır. Durak açılır ve anı ekranı gelir. Bir kez çağırman yeterli.
// Oyuncu "Geri" ile çıkarsa onComplete çağrılmaz, durak kilitli kalır; temizlik fonksiyonun çalışır.
import type { StopData } from '../core/journey';
import { startGame as balloons } from './balloons.js';
import { startGame as bigfish } from './bigfish.js';
import { startGame as candles } from './candles.js';
import { startGame as fishing } from './fishing.js';
import { startGame as puzzle } from './puzzle.js';
import { startGame as runner } from './runner.js';
import { startGame as scratch } from './scratch.js';
import { startGame as tower } from './tower.js';

export type StartGame = (
  container: HTMLElement,
  stopData: StopData,
  onComplete: () => void,
) => void | (() => void);

export interface GameEntry {
  /** oyun ekranının başlığında görünen ad */
  name: string;
  startGame: StartGame;
}

export const games: Record<string, GameEntry> = {
  scratch: { name: 'Kazı kazan', startGame: scratch },
  balloons: { name: 'Balon patlat', startGame: balloons },
  runner: { name: 'Zıplama', startGame: runner },
  puzzle: { name: 'Fotoğraf yapbozu', startGame: puzzle },
  fishing: { name: 'Balık tutma', startGame: fishing },
  tower: { name: 'Hayvan kulesi', startGame: tower },
  bigfish: { name: 'Büyük balık ol', startGame: bigfish },
  candles: { name: 'Mumları üfle', startGame: candles },
};
