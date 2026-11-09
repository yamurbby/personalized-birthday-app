// Tüm sayısal ayarlar tek yerde. Oynadıkça buradan ince ayar yap.
// Yıldızlar bakım eylemlerinden ve günün ilk kombininden gelir; hazır kombinleri açar.

export const balance = {
  needs: {
    decayPerHour: 4, // ihtiyaçlar saatte bu kadar azalır
    floor: 15, // asla bunun altına inmez (ceza yok)
    max: 100,
    start: { food: 70, energy: 80, joy: 75 },
    sleepEnergyPerHour: 60,
  },
  care: {
    petJoy: 6,
    musicJoy: 12,
    noteJoy: 15,
    flowerJoy: 20, // çiçek buketi
    starsPerCare: 1, // bakım eylemi başına yıldız…
    dailyCareStarCap: 8, // …günde en fazla bu kadar
    notesPerDay: 3,
  },
  dressup: {
    dailyStars: 3, // günün ilk kombin kaydı…
    joy: 10,
  },
  startCurrency: { stars: 5 },
};
