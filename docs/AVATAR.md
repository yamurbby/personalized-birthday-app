# Avatar asset rehberi

Tarz: **yumuşak gölgeli 2B chibi**, tüm vücut, pastel renkler. Oda gerçekçi ve pastel bir 3B render,
avatarlar onun önünde “sticker” gibi değil, sıcak ve yumuşak durmalı.

## Ararken neye bakmalı?

**İyi işaretler**
- “chibi character creator”, “paper doll”, “dress-up”, “layered character” gibi paketler
  (gövde, yüz, saç, kıyafet ayrı parçalar halinde).
- PNG + şeffaf arka plan, ya da katmanlı PSD/SVG.
- Aynı karakter için birden fazla **yüz ifadesi** (mutlu, şaşkın, uykulu…).
- Saç rengi/modeli değiştirilebiliyor → arkadaşıma ve bana benzetebilmek için.

**Uzak dur**
- Piksel art (oda ile uyuşmaz).
- Kalın siyah dış çizgili, çok doygun renkli “oyun ikonu” tarzı.
- Her ifadesi farklı açıdan/pozdan çizilmiş karakterler (katmanlar üst üste oturmaz).

## Lisans kontrol listesi
- [ ] Ticari olmayan kişisel kullanım yetmez mi? → Bu oyun ücretsiz bir hediye; yine de
      **“web’de yayınlanan oyunda kullanılabilir”** olmalı.
- [ ] Atıf gerekiyorsa `src/content/credits.ts` dosyasına eklenecek (oyunda görünür).
- [ ] “Yeniden dağıtılamaz” şartı varsa sorun yok: dosyalar oyunun içinde gömülü gelir, ayrı
      indirme olarak sunulmaz. Ama “oyunda kullanılamaz” yazıyorsa olmaz.
- [ ] Yapay zekâ ile üretilmiş paketlerde de lisans metnine bak.

## Oyunun beklediği yapı

Tüm katmanlar **aynı tuval boyutunda** ve üst üste konunca doğru hizalanmalı.

| Ayar | Değer |
|---|---|
| Tuval | 400×500 veya 800×1000 px (4:5) |
| Ayaklar | tuvalin altında ortada (alttan ~%4 boşluk) |
| Format | şeffaf PNG / WebP (ya da SVG) |
| Kafa:vücut | yaklaşık 1:1 – 1:1.5 (chibi) |

### Katmanlar (çizim sırası)

| Katman | Arkadaşım | Ben | Not |
|---|---|---|---|
| `hairBack` | uzun saçın arka kısmı | — | gövdenin arkasında kalır |
| `base` | gövde, ten, ayakkabı | aynı | yüz **çizilmemiş** olmalı |
| `outfit` | kıyafet başına 1 dosya | aynı | şu an: kazak, önlük, pijama, doğum günü / kapüşonlu, parti |
| `face` | 6 ifade | 6 ifade | aşağıya bak |
| `hair` | ön saç / perçem | saç | |
| `outfitTop` | şapka, taç | aynı | saçın üstüne çizilir (isteğe bağlı) |

**Yüz ifadeleri:** `happy` mutlu · `idle` normal · `hungry` aç · `sleepy` uykulu ·
`bored` sıkılmış · `sleeping` uyuyor (gözler kapalı)

> Paket katmansız, her ifade için tam bir karakter resmi veriyorsa da çalışır:
> `base` boş bırakılır, `faces` tam resimler olur. O durumda kıyafet değiştirme olmaz.

### Dosya adları (öneri)
```
src/assets/avatars/pelin/hair-back.png
src/assets/avatars/pelin/base.png
src/assets/avatars/pelin/face-happy.png … face-sleeping.png
src/assets/avatars/pelin/hair.png
src/assets/avatars/pelin/outfit-p_casual.png  (id'ler src/content/outfits.ts ile aynı)
src/assets/avatars/ben/…
```

Bulduğun paketi (ya da birkaç örnek görseli) at, ben uyarlayıp `src/theme/pinkRoom.ts` içine
bağlarım. Şu anki geçici avatarlar `src/theme/placeholderAvatars.ts` içinde, aynı ölçülerde.

## Kişiselleştirme notları (doldur)
- Arkadaşım: saç rengi/uzunluğu … · gözlük? … · sevdiği renk/kıyafet … · aksesuar …
- Ben (kız): saç rengi/uzunluğu … · gözlük? … · sevdiğin kıyafet/renk … · aksesuar …

## Şu an kullanılan paket (2026-11-07)

Katmanlı chibi paketi `art-src/avatar-pack/` içinde (yayına girmez). Oyuna giren katmanlar
`npm run avatars` ile üretilir:

1. Parça seçimi ve kıyafet renkleri: [scripts/avatar-recipe.mjs](../scripts/avatar-recipe.mjs)
   (saç modeli/rengi, ten, göz rengi, her kıyafetin parçaları ve tonu, ifade → kaş/ağız)
2. `npm run avatars` → `src/assets/avatars/<kim>/*.webp`
3. Oyun bunları otomatik bulur (`src/theme/avatars.ts`).

**Saçlarda** klasörün üst seviyesi boyanmamış (beyaz) sürüm, `COLOR` klasörü aynı saçın renkli
sürümleri (b…h harfleri renk). Oyunda sadece `COLOR` kullanılır.

**Kıyafetlerde ise** (top, bottom, dress, shoes) ana klasör ile `colors`/`COLOR` klasörü
**farklı kıyafetler** içerir: `9` ana klasördeki, `9c` renkli klasördeki parçadır. İkisi üst
üste konmaz. Beyaz parçalar tarifteki renge boyanabilir. Kapalı göz (uyuyor), stetoskop ve parti şapkası pakette yok, betik çiziyor.
