# Kişiselleştirilmiş Doğum Günü Oyunu

Arkadaşıma doğum günü hediyesi olarak yaptığım, telefonda tarayıcıdan oynanan küçük bir bakım/mola oyunu.
Tasarım ve mimari: [docs/TASARIM.md](docs/TASARIM.md)

## Bu depoda olmayanlar

Oyunun bütün kodu burada; ama bazı dosyalar kişisel olduğu ya da lisansı yeniden dağıtıma izin vermediği için depoya konmadı:

- **Fotoğraflar** (`images/pelo/`) ve **şarkı** (`images/muzik/`)
- **Mektup ve notlar:** `src/content/dogum-gunu-notu.txt`, `notes.ts`, `bottle-notes.ts`. Biçimleri için `*.ornek.*` dosyalarına bak.
- **Karakter görselleri** (`src/assets/avatars/`), **çiçek saksıları** (`src/assets/flowers/`) ve **free fish** sprite'ı (`src/assets/fish/free-fish.png`)
- Ham kaynak dosyalar (`art-src/`)

Bu yüzden depo tek başına derlenmez; eksik dosyalar yerine kendi içeriğini koyarak çalıştırabilirsin.

## Çalıştırma

```bash
npm install
npm run dev        # telefondan denemek için aynı Wi-Fi'da "Network" adresini aç
npm run build      # dist/ klasörüne yayın sürümü
npm run preview    # yayın sürümünü (çevrimdışı dahil) yerelde dene
```

## İçerik nereden değişir?

Kişisel her şey `src/content/` içinde, kod bilmeden düzenlenebilir:

| Dosya | Ne var |
|---|---|
| `journey.ts` | **Kampüs haritasının durakları**: başlık, tarih, yazı, 3–5 fotoğraf, görev (mini oyun) |
| `dogum-gunu-notu.txt` | **Arkadaşına kişisel notun** (harita bitince zarftan çıkar; düz metin, paragraf arasına boş satır) |
| `config.ts` | isimler, doğum günü tarihi, notun başlığı ve imzası |
| `notes.ts` | “Sürpriz not” havuzu |
| `foods.ts` | yemekler |
| `outfits.ts` | hazır kombinler, aksesuarlar, gardırop renk paleti |
| `credits.ts` | kullanılan dış asset'lerin atıfları (Ayarlar → Emeği geçenler) |
| `lines.ts` | karakterin ruh haline göre cümleleri |

Sayısal denge (azalma hızı, ödüller, bekleme süreleri): `src/core/balance.ts`.
`TODO` arayarak doldurulacak yerleri bulabilirsin.

## Fotoğraf ekleme

1. Her durak için `images/pelo/` içinde bir klasör: `1` … `8` (adına yazı eklenebilir: `6-makarayız` → başlık “Makarayız”).
   İçine o anının fotoğrafları; `yapboz.jpg` oyunda (yapboz/kazı kazan), `kapak.jpg` haritadaki yuvarlakta kullanılır.
   İsteğe bağlı `bilgi.txt`: `Başlık:`, `Tarih:`, `Yazı:` (çok satır olabilir), `Kırpma: 0.5, 0.2`. Ayrıntı: `images/pelo/BENIOKU.txt`.
   Yan duran fotoğraflar: `images/pelo/dondur.txt` → `4/dosya.jpeg: 90` (saat yönünde 90/180/270; orijinal değişmez).
2. `npm run dev` ya da `npm run build` çalıştır. Fotoğraflar kendiliğinden hazırlanır: önizleme (480px) ve
   tam boy (1600px) WebP, **EXIF/konum bilgisi silinir**, `src/assets/pelo/` içine yazılır.
   Sadece yeni/değişen fotoğraflar işlenir; klasörden sildiğin fotoğraf albümden de kalkar. Elle: `npm run photos`.
3. Hangi durağın hangi klasörü kullandığı `journey.ts` → `folder: 1` …; bilgi.txt yoksa başlık oradan gelir.
4. Harita tamamen bitince albümde “Tüm fotoğraflarımız” bölümü açılır; tüm klasörlerdeki fotoğraflar sırayla görünür.

Önizlemeler çevrimdışı kullanım için baştan indirilir; tam boy fotoğraflar açıldıkça önbelleğe girer.

> ⚠️ Bağlantıyı bilen herkes albümdeki fotoğrafları görebilir (kilitli olanlar dahil — kilit bir oyun
> mekaniği, güvenlik değil). Site arama motorlarına kapalıdır (`noindex`).

## Görsel tarzı değiştirme

Oyun mantığı görsellere sadece anahtar adıyla ulaşır. Yeni asset paketi için:

1. `src/theme/placeholder.ts` dosyasını örnek alarak yeni bir tema yaz (ör. `src/theme/pixel.ts`),
   görselleri `src/assets/theme/` gibi bir klasöre koy ve `import` ile bağla.
2. `src/theme/index.ts` içinde `theme` satırını yeni temaya çevir.
3. Piksel art ise `pixelArt: true` yap. Animasyonlu karakter için yatay sprite şeridi + `frames`/`fps`.

## Netlify'da yayınlama

- Netlify → “Add new site” → “Deploy manually” → `npm run build` sonrası `dist/` klasörünü sürükle, **ya da**
- Projeyi GitHub'a koyup Netlify'a bağla (`netlify.toml` hazır).
- Site adını tahmin edilemez bir şey yap (ör. `dogum-gunu-7k3q`).

## Test için

- Geliştirme modunda Ayarlar'da “+50 yıldız”, “haritada 1 durak ilerle” ve “haritayı başa al” düğmeleri var (yayında görünmez).
- İlerlemeyi sıfırlama: Ayarlar'da en alttaki sürüm yazısına 5 kez dokun.
- Giriş sahnesini bir adımda dondurmak: `?introStep=blow` (ready, wish, blow, yay, tips).

## Birlikte sekmesine yeni kart ekleme

Kartların tek listesi: [src/ui/together.tsx](src/ui/together.tsx) (sıra = ekrandaki sıra; şu an Anı albümü ve Doğum günü notu).
Ekranını `src/ui/screens/` içine yaz (`onClose` alır), `togetherCards` dizisine bir satır ekle:
`{ id, name, desc: (s) => '…', icon, action?, locked?: (s) => boolean, Screen }`.

## Kampüs: yolculuk haritası

Duraklar [src/content/journey.ts](src/content/journey.ts) içinde, sırayla (ilk durak haritanın en altında, son durak pasta ikonlu final).
Sıradaki durağa dokununca: `task` varsa önce o mini oyun açılır, kazanılınca anı açılır; `task: null` ise anı doğrudan açılır.
Anıdaki “Devam et” karakterleri yeni durağa yürütür. Final durağından sonra doğum günü notu açılır (Birlikte’de de durur).

### Mini oyunlar

Oyunların tek listesi: [src/games/index.ts](src/games/index.ts). Her oyunun zorluk ayarları kendi dosyasının başındaki `SETTINGS` nesnesinde.

| Durak | Oyun | Dosya | Not |
|---|---|---|---|
| 1 | Kazı kazan | `scratch.js` | durağın ilk fotoğrafı |
| 2 | Balon patlat | `balloons.js` | 30 sn, 25 puan |
| 3 | Zıplama | `runner.js` | 500 m; temalar `THEMES` (`kampus`, `tatil`); kalpler üst bardaki kalp sayacına eklenir |
| 4 | Fotoğraf yapbozu | `puzzle.js` | `grid: 3` → 4 yaparsan 4×4; fotoğraf `puzzlePhoto`, kırpma odağı `puzzleCrop` (journey.ts) |
| 5 | Balık tutma | `fishing.js` | 60 sn, 150 puan; mektuplu şişe notları: `src/content/bottle-notes.ts` |
| 6 | Hayvan kulesi | `tower.js` | 10 hayvan, 3 can |
| 7 | Büyük balık ol | `bigfish.js` | oyuncunun balığı `SETTINGS.player` |
| 8 | Mumları üfle | `candles.js` | mikrofon eşiği `threshold`, süre `blowTime`; mikrofon yoksa dokunarak |

Ortak parçalar: `kit.js` (tuval/DPR, döngü, temizlik, puan yazısı, parıltı, konfeti, “Durak açıldı!” ve “Tekrar dene” ekranları),
`character.js` (chibi karakteri tuvale çizer), `fish-config.js` (balık listesi).

**Yeni oyun:** `src/games/` içine `startGame(container, stopData, onComplete)` dışa aktaran bir dosya yaz
(`stopData`: `title`, `date`, `text`, `index`, `photos` [`thumb`/`full`], `runnerTheme`), kazanınca `kit.js` → `showWin(...)`,
istersen temizlik fonksiyonu döndür → `games` listesine ekle → `journey.ts` içinde bir durağa `task: 'ad'` yaz.
Oyuncu “Geri” ile çıkarsa durak kilitli kalır. Listede olmayan bir oyun adı yazılırsa ekranda “Anıya geç” çıkar.

**Mikrofon (mumlar):** sadece ses seviyesi ölçülür, kayıt yok. Telefonda çalışması için site **https** olmalı
(Netlify'da öyle). Bilgisayardaki geliştirme sunucusuna telefondan `http://192.168…` ile girersen tarayıcı mikrofona izin vermez;
oyun o zaman “Mumlara dokunarak söndür” moduna geçer.

### Görseller

- **Harita arka planı (Van Gogh):** tabloları `images/vangogh/` içine koy (`almond-blossom`, `wheatfield-cypresses`, `wheatfield-crows`, `starry-night`; jpg/png/webp).
  Sıra, kapladığı oran, yüklenene kadar görünen renk ve açık perdenin opaklığı: [src/content/vangogh.ts](src/content/vangogh.ts).
  `npm run dev`/`build` onları kenar çerçevesini kırpıp 2000px WebP yapar (`npm run vangogh`).

- **Balıklar:** `src/assets/fish/` → `free-fish.png` (moranovo.itch.io paketi, 9 sprite; atıf zorunlu, dosya herkese açık bir depoda paylaşılmamalı) ve `extra.png` (paketle gelmeyen denizatı,
  ahtapot, deniz anası, palyaço balığı, efsanevi pembe balık, şişe, kutu, mektuplu şişe; `node scripts/fish-extra.mjs` ile çizildi).
  Liste: [src/games/fish-config.js](src/games/fish-config.js) (ad, sheet, sütun/satır, tür, nadirlik, puan, sıklık).
  Daha büyük bir paket alırsan PNG'yi bu klasöre koy, `sheets`'e ekle ve satırların `sheet/col/row` değerlerini değiştir.
  Sprite'lar 16×16 ve **sola bakıyor** olmalı.
- **Hayvan kulesi:** `src/assets/animals/*.png`, liste `tower.js` → `ANIMALS` (`seat`: oturma yüzeyi, `left/right`: kanat/kol
  boşluğu, `bottom`: alttaki boşluk; hepsi için ek pay: `SETTINGS.seatOffset`). Yeni render: `npm run dev` →
  http://localhost:5173/tools/render-pets.html → `npm run animals` → yazdırılan satırları `ANIMALS`'a yapıştır.
- **Zıplama temaları:** `runner.js` → `THEMES`. Görsel eklemek için `src/assets/runner/` içine koy, dosyanın başında import et,
  engel olarak `{ img: kitap, w: 0.5, h: 0.45 }`, arka plan olarak `background: arkaPlan` yaz.

## İkonlar

Arayüz ikonları Phosphor Icons (“light” ağırlık, MIT), pakete gömülü. Bilerek renkli emoji kalan yerler:
üst çubuk etiketleri (🍓 ⚡ ❤️) ve Birlikte’deki kalp (💗) — `src/theme/placeholder.ts` → `emoji(...)`.
Renkleri CSS'teki `--icon` değişkeninden gelir. Yeni ikon: phosphoricons.com'da adını bul →
`src/theme/icons.ts`'e import edip listeye ekle → `icon('ad')` ile kullan.

## Konum

Projeyi OneDrive içine (Masaüstü, Belgeler) koyma:
OneDrive dosyaları “isteğe bağlı” yapınca Vite `node_modules` paketlerini bulamıyor ve oyun açılmıyor.
