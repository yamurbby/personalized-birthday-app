# Doğum Günü Oyunu — Tasarım ve Mimari (v1 taslağı)

> Arkadaşıma doğum günü hediyesi: telefonda tarayıcıdan oynanan, Pou'dan esinlenen
> kişisel bir bakım/mola oyunu. Amaç görev baskısı değil; küçük molalar ve sürprizler.

---

## 1. Oyunun duygusu (tasarım ilkeleri)

1. **Ceza yok.** İhtiyaçlar zamanla yavaşça azalır ama karakter asla "ölmez", hasta olmaz,
   suçlayıcı bildirim yoktur. Düşük değer sadece yüz ifadesini değiştirir ("uykum geldi").
2. **Her oturum 1–3 dakikada tatmin etsin.** Nöbet arasında açılıp kapanabilmeli.
3. **Her şey bir sürprize çıksın.** Kazanılan her şey ya odaya bir eşya, ya yeni bir
   etkinlik, ya da bir anı açar.
4. **Tek elle, dikey ekranda oynanır.** Tüm dokunma hedefleri ≥ 44px, alt bölgede.
5. **Kişisel detay > oyun mekaniği.** Sevdiği yemekler, ortak diziler, iç şakalar
   oyunun asıl içeriği; mekanik onları taşıyan araç.

---

## 2. Ekran akışı

```
İlk açılış
  └─ Doğum günü girişi (pasta + mum üfleme dokunuşu + kısa mesaj)
       └─ Kısa tanıtım (3 baloncuk: besle / oyna / anıları aç)
            └─ ODA

Ana kabuk (her ekranda)
  ┌──────────────────────────────────────────┐
  │ Üst çubuk: 🍓 Tok  ⚡ Enerji  💛 Neşe     │
  │            ⭐ Yıldız   💗 Hatıra   ⚙️     │
  ├──────────────────────────────────────────┤
  │              (sekme içeriği)             │
  ├──────────────────────────────────────────┤
  │   [ Oda ]    [ Kampüs ]    [ Birlikte ]  │  ← alt gezinti
  └──────────────────────────────────────────┘
```

### Oda
- Ortada arkadaşımın karakteri, ihtiyaçlarına göre ifade (mutlu / aç / uykulu / sıkılmış).
- Alt eylem çubuğu: **Besle · Dinlen · Neşelendir · Dekor**
  - **Besle** → yemek tepsisi açılır; yemeği karaktere sürükle ya da dokun. Bazı yemekler
    "favori" (ör. ⟨arkadaşımın sevdiği yemek⟩) → ekstra neşe ve özel replik.
  - **Dinlen** → ışık kapanır, karakter uyur; "5 dakikalık mola" ya da hemen uyandır.
    Enerji gerçek zamanda dolar (uygulama kapalıyken de).
  - **Neşelendir** → küçük seçenekler: sev (dokun-okşa), müzik aç, **sürpriz not** çek
    (sende yazılı motivasyon/iç şaka havuzundan rastgele bir kart).
  - **Dekor** → oda slotları (duvar, zemin, yatak, masa, poster, bitki, lamba).
    Her slotta açılmış varyantlar arasında seçim. Serbest sürükle-bırak yok (v1).
- Yıldızla açılan eşyalar burada görünür.

### Kampüs
- Mini oyun kartları: isim, en iyi skor, kazanılabilecek ödül.
- **Anatomi Eşleştirme** — kart eşleştirme (organ çizimi ↔ adı), 4×3 kart, ~60 sn.
- **Nöbet Çantası** — eşyalar sırayla akar; nöbete gereken mi (steteskop, şarj aleti,
  kahve…) yoksa gereksiz mi (dizi kumandası, kedi…) diye sağa/sola kaydır. ~45 sn.
- Sonuç ekranı: 1–3 yıldız + karakterden bir replik. Oynamak Enerji'yi biraz azaltır,
  Neşe'yi artırır (dinlenmeye geri dönüş için yumuşak bir döngü).

### Birlikte
- Sahnede iki avatar: arkadaşım ve ben.
- Etkinlik kartları (hatıra puanıyla açılır):
  - **Kahve molası** — içecek seç, iki avatar yan yana oturur, kısa diyalog.
  - **Film/dizi gecesi** — film kartlarından seç → koltuk sahnesi (ışık kararır,
    ekran parlıyor, patlamış mısır) → o filme özel kısa kişisel mesaj.
  - (sonraki sürümlere: yürüyüş, sınav sonrası kutlama, yemek pişirme…)
- **Anı albümü** düğmesi → albüm.

### Anı albümü
- Izgara görünüm; kilitli anılar bulanık/silüet + "💗 30 ile açılır" ya da
  "Film gecesini ilk kez yap" gibi koşul.
- Anıya dokun → tam ekran fotoğraf, başlık, tarih, not.
- **Son sayfa:** tüm anılar (veya belirlenen eşik) açılınca doğum günü mektubu.

---

## 3. Oyun döngüsü ve ekonomi

```
Etkileşim / mini oyun seç → tamamla → ⭐ yıldız ve/veya 💗 hatıra kazan
      → ⭐ ile oda eşyası aç   → 💗 ile etkinlik ya da anı aç
      → yeni anı / etkinlik yeni şeyler açar → tekrar
```

| Kaynak | Kazanım | Harcama |
|---|---|---|
| ⭐ Yıldız | Mini oyunlar (1–3), günlük ilk bakım | Oda eşyaları |
| 💗 Hatıra | Birlikte etkinlikleri, mini oyunda 3 yıldız, bakım serisi | Anılar, yeni etkinlikler |

**İhtiyaç değerleri** (0–100): saatte ~4 puan azalır, en düşük **15**'te durur
(karakter hiçbir zaman "kötü" duruma düşmez). Zaman, son kayıt zamanına göre hesaplanır.

**Hedef ilerleme hızı:** tüm v1 içeriği ~1–2 haftada, günde birkaç kısa oturumla açılsın.
İlk gün mutlaka 1 anı + 1 eşya açılsın (ilk izlenim). Sayılar tek bir `balance.ts`
dosyasında; oynadıktan sonra kolayca ayarlanır.

---

## 4. İlk sürüm (v1) kapsamı

**Var:**
- Doğum günü girişi + kutlama mesajı (+ doğum günü tarihinde özel konfeti/afiş)
- Arkadaşımın karakteri, 4 ifade
- Oda: besle / dinlen / neşelendir, 7 dekor slotu, ~10 açılabilir eşya
- ~~2 mini oyun: Anatomi Eşleştirme, Nöbet Çantası~~ → 2026-11-08: kaldırıldı; Kampüs’te “Bizi Giydir” var, yeni oyunlar src/ui/games.tsx üzerinden eklenir
- 2026-11-09: Kampüs oyun listesi yerine yolculuk haritası (content/journey.ts); görevler src/games/ üzerinden bağlanır. Anılar haritada açılır, kişisel not harita bitince açılır. Bu belgedeki eski dosya/kayıt şemaları tarihseldir; güncel yapı README.md’de.
- Birlikte: iki avatar, Kahve molası, Film/dizi gecesi (gerçek video yok)
- Anı albümü (fotoğraf + başlık + tarih + not + kilit koşulu), final mektubu
- Yerel kayıt, çevrimdışı çalışma, ana ekrana eklenebilir (PWA)
- Ses efektleri + sessize alma

**Yok (v1 dışı):** çok oyunculu, gerçek video, bildirimler, serbest eşya yerleştirme,
kıyafet sistemi, hesap/bulut kayıt.

---

## 5. Teknik mimari

### Yığın
- **Vite + TypeScript + Preact** — küçük paket (~10 KB), bileşen tabanlı ekranlar,
  hızlı geliştirme. Oyun motoru (Phaser vb.) gereksiz: tüm etkileşimler dokunma/kaydırma
  tabanlı, DOM + CSS animasyonlarıyla yapılır. Piksel art seçilirse
  `image-rendering: pixelated` ile aynı yapı çalışır.
- **vite-plugin-pwa** — service worker, tüm dosyaları önbelleğe alır → çevrimdışı.
- **Netlify** — `npm run build` → `dist/` statik yayın, `netlify.toml` ile.

### Katmanlar

```
src/
  core/            ← saf oyun mantığı, UI'dan bağımsız, test edilebilir
    state.ts       oyun durumu tipi + başlangıç durumu
    store.ts       durum + eylemler (feed, sleep, earn, unlock…), abonelik
    needs.ts       zamana bağlı ihtiyaç azalması
    unlocks.ts     kilit koşullarını değerlendirme
    save.ts        localStorage kayıt/yükleme, sürüm + geçiş (migration)
    balance.ts     tüm sayısal ayarlar
  content/         ← kişisel içerik: KOD DEĞİL, VERİ
    foods.ts  items.ts  activities.ts  movies.ts  notes.ts
    memories.ts  messages.ts  minigames/anatomy.ts  minigames/bag.ts
  theme/           ← görsel tarz: değiştirilebilir "skin"
    theme.ts       aktif tema manifestosu
    placeholder/   geçici vektör/emoji görseller
  ui/
    shell/         üst çubuk, alt gezinti, modal, toast
    screens/       Intro, Room, Campus, Together, Album, Settings
    minigames/     AnatomyMatch, ShiftBag
    components/    Character, NeedBar, Card…
  assets/album/    fotoğraflar (Vite dosya adlarını hash'ler)
```

### Görsellerin değiştirilebilir olması
Oyun mantığı hiçbir zaman dosya yolu bilmez; sadece **anahtar** bilir.
Tema manifestosu anahtarları görsellere eşler:

```ts
// theme/theme.ts
export const theme: Theme = {
  pixelArt: false,
  characters: {
    pelin: { idle: img('pelin_idle.png'), hungry: …, sleepy: …, bored: …, happy: …, sleeping: … },
    partner: { idle: …, sitting: … },
  },
  roomSlots: { wall: { default: …, pink: … }, bed: { … }, … },
  foods: { simit: …, … },
  ui: { star: …, heart: … },
};
```

`<Character who="pelin" mood="sleepy" />` bileşeni görseli temadan alır.
Asset tarzı seçilince **sadece `theme/` klasörü** değişir; animasyon kareleri gerekiyorsa
manifestoya `frames`/`fps` alanı eklenir, oyun mantığı aynı kalır.

### Veri modelleri

```ts
interface Memory {
  id: string;
  photo: string;          // import edilmiş görsel (hash'li yol)
  title: string;
  date?: string;          // "2023-06-14" ya da "Yaz 2023"
  note: string;
  unlock: UnlockRule;     // açılma koşulu
}

type UnlockRule =
  | { type: 'start' }                          // baştan açık
  | { type: 'hearts'; cost: number }           // hatıra puanıyla
  | { type: 'event'; event: string }           // ör. 'movie_night_first'
  | { type: 'allMemories' };                   // final mektubu

interface RoomItem { id: string; slot: SlotId; name: string; price: number; }
interface Movie   { id: string; title: string; poster?: string; message: string; unlock: UnlockRule; }

// Kayıtta içerik değil sadece durum tutulur:
interface SaveState {
  version: number;
  needs: { food: number; energy: number; joy: number };
  lastTick: number;
  stars: number; hearts: number;
  unlocked: { items: string[]; memories: string[]; activities: string[]; movies: string[] };
  room: Record<SlotId, string>;
  bestScores: Record<string, number>;
  events: Record<string, number>;   // 'movie_night_first' → zaman
  seenIntro: boolean;
  settings: { sound: boolean };
}
```

Açılma durumu **içerikte değil kayıtta** tutulur → yeni anı eklemek eski kaydı bozmaz.

### Kayıt ve çevrimdışı
- Her eylemden sonra `localStorage`'a yazılır; `version` alanı ile ileride geçiş.
- `navigator.storage.persist()` istenir (tarayıcının kaydı silme ihtimalini azaltır).
- Ayarlar'da gizli **"ilerlemeyi sıfırla"** (sadece test için, onaylı).
- Uyarı: iOS Safari'de site uzun süre açılmazsa veri silinebilir; ana ekrana eklemek
  bunu büyük ölçüde önler → girişte "ana ekrana ekle" ipucu gösterilir.

### Fotoğraflar ve gizlilik
- Bağlantıyı bilen **herkes** fotoğrafları görebilir; ayrıca dosyalar JS paketinde
  listelendiği için kilitli anıların fotoğrafları da teknik olarak indirilebilir.
  Kilit bir oyun mekaniğidir, güvenlik değildir.
- Önlemler:
  - Sadece paylaşılmasında sakınca olmayan fotoğraflar.
  - **EXIF/konum bilgisi silinerek** ve küçültülerek (~1200px, WebP) eklenir —
    bunu yapan bir `npm run photos` betiği olacak.
  - `noindex` meta + `X-Robots-Tag: noindex` başlığı → arama motorlarında çıkmaz.
  - Netlify alt alan adı tahmin edilemez bir isim olur (ör. `dogum-gunu-7k3q`).
- İsteğe bağlı: açılışta basit bir "gizli kelime" ekranı (ilk tarihiniz vb.). Bu da
  gerçek koruma değildir, sadece rastgele ziyaretçiyi durdurur. Gerçek parola koruması
  Netlify'ın ücretli planlarında var.

---

## 6. Benim aldığım küçük kararlar
- Dil: Türkçe. Dikey ekran, 360–430px genişlik için tasarım; masaüstünde telefon
  çerçevesi içinde ortalanır.
- İki para birimi (⭐ eşya, 💗 anı/etkinlik).
- Ceza yok; ihtiyaçlar %15'in altına inmez.
- Oda özelleştirmesi slot tabanlı.
- Mini oyunlar: kart eşleştirme ve sağa/sola kaydırma (tek elle en rahat iki mekanik).
- Görsel tarz seçilene kadar sade vektör/emoji yer tutucular.
- Ses efektleri var, müzik yok; tek dokunuşla sessiz.
- Oyun motoru yok; Preact + DOM.

## 7. Hâlâ açık kararlar
1. Görsel tarz / asset paketi (sadece `src/theme/` etkilenir).
2. Doğum günü tarihi, giriş mesajı, final mektubu metni (`content/config.ts`, `content/memories.ts`).
3. Albüm fotoğrafları ve her birinin başlık/tarih/notu, hangilerinin baştan açık olacağı.
4. Kişisel içerik: favori yemek, içecekler, film/dizi kartları, sürpriz notlar, iç şakalar.
5. Metinlerin tonu ve senin avatarının adı.
6. Gizlilik: tahmin edilemez bağlantı yeterli mi, yoksa basit "gizli kelime" ekranı da olsun mu?

## 8. Durum (v0.1 iskelet)
Tüm ekranlar, iki mini oyun, ekonomi, kilit sistemi, kayıt ve PWA yer tutucu görsellerle çalışıyor.
Doldurulacak yerler için `TODO` ara. Ayrıntılar: [README.md](../README.md).
