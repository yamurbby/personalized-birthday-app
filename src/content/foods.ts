import type { Food } from '../core/types';

// Yemek tepsisi. `favorite` olanlar ekstra neşe verir. İkonlar: theme/placeholder.ts → foods
// TODO: Pelin'in sevdiklerini ekle.
export const foods: Food[] = [
  { id: 'simit', name: 'Simit', food: 15 },
  { id: 'hamburger', name: 'Hamburger', food: 25, line: 'Nöbet sonrası hamburger, hak edildi.' },
  { id: 'kiraz', name: 'Kiraz', food: 10, joy: 2, line: 'Kiraz mevsimi gibisi yok.' },
  { id: 'makarna', name: 'Makarna', food: 30 },
  { id: 'kurabiye', name: 'Kurabiye', food: 8, joy: 10, line: 'Sınav haftasının ilacı!' },
  { id: 'favori', name: 'Favori yemeği', food: 35, joy: 15, favorite: true, line: 'Bunu en çok ben severim!' }, // TODO
];
