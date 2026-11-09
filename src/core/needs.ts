import { balance } from './balance';
import type { Mood, NeedId, SaveState } from './types';
import { HOUR } from './time';

const { decayPerHour, floor, max, sleepEnergyPerHour } = balance.needs;

export function clampNeed(v: number) {
  return Math.max(0, Math.min(max, v));
}

/** Ceza yok: azalma bir değeri asla `floor`un altına itmez. */
function decay(v: number, amount: number) {
  if (v <= floor) return v;
  return Math.max(floor, v - amount);
}

/** Son kayıttan bu yana geçen gerçek zamanı uygular (uygulama kapalıyken de). */
export function applyTime(s: SaveState, t: number) {
  const hours = Math.max(0, (t - s.lastTick) / HOUR);
  if (hours === 0) return;
  const d = decayPerHour * hours;
  s.needs.food = decay(s.needs.food, d);
  s.needs.joy = decay(s.needs.joy, d);
  if (s.sleepingSince) {
    s.needs.energy = clampNeed(s.needs.energy + sleepEnergyPerHour * hours);
  } else {
    s.needs.energy = decay(s.needs.energy, d);
  }
  s.lastTick = t;
}

export function addNeed(s: SaveState, id: NeedId, amount: number) {
  s.needs[id] = clampNeed(s.needs[id] + amount);
}

export function moodOf(s: SaveState): Mood {
  if (s.sleepingSince) return 'sleeping';
  const { food, energy, joy } = s.needs;
  const lowest = Math.min(food, energy, joy);
  if (lowest < 35) {
    if (lowest === food) return 'hungry';
    if (lowest === energy) return 'sleepy';
    return 'bored';
  }
  if (food > 70 && energy > 70 && joy > 70) return 'happy';
  return 'idle';
}
