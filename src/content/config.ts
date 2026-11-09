// Kişisel ayarlar: isimler, doğum günü, not başlığı ve imzası.

export const config = {
  pelinName: 'Pelin',
  partnerName: 'Yağmur',
  /** Doğum günü (AA-GG). O gün oyunda konfeti ve özel afiş çıkar. */
  birthday: '12-01', // 1 Aralık
  intro: {
    // Mumlar sönünce çıkan zarfın içindeki notun başlığı ve imzası.
    // Notun KENDİSİ ayrı dosyada: src/content/dogum-gunu-notu.txt
    title: 'İyi ki doğdun Pelin!',
    signature: '— Yamurun <3',
    envelopeLine: 'Sana küçük bir notum var!', // zarf çıkınca senin söylediğin cümle
  },
  /** Doğum günü tarihinde odada çıkan afiş metni. */
  birthdayBanner: 'Doğum günün kutlu olsun!',
};
