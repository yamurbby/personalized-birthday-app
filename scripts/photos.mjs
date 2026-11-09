// images/pelo/ içindeki fotoğrafları albüm için hazırlar (npm run dev / build öncesi kendiliğinden çalışır).
//  - t_<ad>.webp : önizleme (en uzun kenar 900px)  → albüm, harita, anı galerisi
//  - f_<ad>.webp : tam boy (en uzun kenar 2400px)  → dokununca açılan görünüm, yapboz, kazı kazan
//  - EXIF / GPS konumu / cihaz bilgisi SİLİNİR, telefon döndürmesi uygulanır
//  - Sadece yeni ya da değişen fotoğraflar işlenir; silinen fotoğrafların çıktıları da silinir
//
// Durak klasörleri: images/pelo/1, images/pelo/2 … (ya da "6-makarayız" gibi; sayıdan sonraki kısım başlık olur)
//   - klasördeki fotoğraflar o durağın anısında görünür
//   - "yapboz.jpg" → o durağın oyununda (yapboz / kazı kazan) kullanılır;  "kapak.jpg" → haritadaki yuvarlakta
//   - isteğe bağlı bilgi.txt:   Başlık: …   Tarih: …   Yazı: …   (Yazı birden çok satır olabilir)
//     ayrıca  Yapboz: dosya.jpg   Kapak: dosya.jpg   Kırpma: 0.5, 0.2  (yapboz kare kırpma odağı x, y)
// Yan duran fotoğraflar: images/pelo/dondur.txt → "klasör/dosya: 90" (saat yönünde 90/180/270)
// Klasör bilgisi src/assets/pelo/folders.json dosyasına yazılır (src/content/photos.ts okur).
import { existsSync, statSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const SRC = 'images/pelo';
const OUT = 'src/assets/pelo';
const MANIFEST = join(OUT, 'folders.json');
const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif']);
const sizes = [
  { prefix: 't_', max: 900, quality: 82 }, // önizleme: albüm, harita, anı galerisi (telefonda net görünsün)
  { prefix: 'f_', max: 2400, quality: 88 }, // tam boy: büyütünce, yapboz, kazı kazan
];

/** Dosya adını web'e uygun hale getirir: "Tatil 2023 (1).JPG" → "tatil-2023-1" */
const slug = (name) =>
  name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'foto';
const isImage = (f) => exts.has(parse(f).ext.toLowerCase());
const natural = (a, b) => a.localeCompare(b, 'tr', { numeric: true });

await mkdir(SRC, { recursive: true });
await mkdir(OUT, { recursive: true });

/** { file: kaynak yol, name: çıktı adı } listesi + klasör bilgileri */
const items = [];
const folders = [];
const entries = (await readdir(SRC, { withFileTypes: true })).sort((a, b) => natural(a.name, b.name));
for (const e of entries) {
  if (e.isFile() && isImage(e.name)) items.push({ file: join(SRC, e.name), rel: e.name, name: slug(parse(e.name).name) });
  if (!e.isDirectory()) continue;
  const m = e.name.match(/^(\d+)\s*[-_. ]?\s*(.*)$/);
  if (!m) continue; // sayıyla başlamayan klasörler durak değildir
  const dir = join(SRC, e.name);
  const files = (await readdir(dir)).filter(isImage).sort(natural);
  const prefix = `d${m[1]}-`;
  const photos = files.map((f) => {
    const name = prefix + slug(parse(f).name);
    items.push({ file: join(dir, f), rel: `${e.name}/${f}`, name });
    return { file: f, name };
  });
  const info = await readInfo(join(dir, 'bilgi.txt'));
  const byFile = (f) => f && photos.find((p) => p.file.toLowerCase() === f.toLowerCase() || slug(parse(p.file).name) === slug(parse(f).name))?.name;
  const named = (base) => photos.find((p) => slug(parse(p.file).name) === base)?.name;
  folders.push({
    stop: Number(m[1]),
    label: m[2].trim(),
    title: info.title ?? '',
    date: info.date ?? '',
    text: info.text ?? '',
    photos: photos.map((p) => p.name),
    puzzle: byFile(info.puzzle) ?? named('yapboz') ?? null,
    cover: byFile(info.cover) ?? named('kapak') ?? null,
    crop: info.crop ?? null,
  });
}

/** bilgi.txt: "Anahtar: değer" satırları; "Yazı:" sonrası satırlar (yeni anahtara kadar) yazıya eklenir */
async function readInfo(path) {
  if (!existsSync(path)) return {};
  const raw = (await readFile(path, 'utf8')).replace(/^﻿/, '');
  const keys = { 'başlık': 'title', 'baslik': 'title', 'tarih': 'date', 'yazı': 'text', 'yazi': 'text', 'yapboz': 'puzzle', 'kapak': 'cover', 'kırpma': 'crop', 'kirpma': 'crop' };
  const out = {};
  let cur = null;
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-zÇĞİÖŞÜçğıöşü]+)\s*:\s*(.*)$/);
    const key = m && keys[m[1].toLocaleLowerCase('tr')];
    if (key) { cur = key; out[key] = m[2].trim(); continue; }
    if (cur === 'text') out.text = `${out.text ?? ''}\n${line}`;
  }
  if (out.text) out.text = out.text.trim();
  if (out.crop) {
    const [x, y] = out.crop.split(/[,; ]+/).map(Number);
    out.crop = Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined;
  }
  return out;
}

/** dondur.txt: "klasör/dosya: derece" satırları (# ile başlayanlar yorum) */
const rotations = {};
const rotFile = join(SRC, 'dondur.txt');
if (existsSync(rotFile)) {
  for (const line of (await readFile(rotFile, 'utf8')).replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const m = line.match(/^\s*([^#].*?)\s*:\s*(-?\d+)\s*$/);
    if (m) rotations[m[1].replace(/\\/g, '/').normalize('NFC').toLowerCase()] = ((Number(m[2]) % 360) + 360) % 360;
  }
}
const rotationOf = (rel) => rotations[rel.normalize('NFC').toLowerCase()] ?? 0;

const wanted = new Set([MANIFEST]);
// Boyut/kalite ayarı değişirse (imza farklıysa) tüm çıktılar yeniden üretilir
const SIG = join(OUT, '.ayar');
const sig = JSON.stringify({ sizes, rotations });
const force = !existsSync(SIG) || (await readFile(SIG, 'utf8')) !== sig;
wanted.add(SIG);
let made = 0;
const failed = [];
for (const it of items) {
  const srcTime = statSync(it.file).mtimeMs;
  for (const s of sizes) {
    const out = join(OUT, `${s.prefix}${it.name}.webp`);
    wanted.add(out);
    if (!force && existsSync(out) && statSync(out).mtimeMs >= srcTime) continue; // güncel, atla
    try {
      // Önce telefonun EXIF yönü, sonra dondur.txt'teki ek çevirme
      const turn = rotationOf(it.rel);
      const input = turn ? await sharp(it.file).rotate().toBuffer() : it.file;
      await sharp(input)
        .rotate(turn || undefined)
        .resize({ width: s.max, height: s.max, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: s.quality, smartSubsample: true, effort: 5 })
        .toFile(out);
      made++;
    } catch {
      failed.push(it.file);
      break;
    }
  }
}

await writeFile(MANIFEST, JSON.stringify(folders, null, 2) + '\n');

// Orijinali silinmiş fotoğrafların çıktılarını temizle
for (const f of await readdir(OUT)) {
  const p = join(OUT, f);
  if (!wanted.has(p)) await rm(p);
}

console.log(`Fotoğraflar: ${items.length} orijinal (${folders.length} durak klasörü), ${made} dosya üretildi (diğerleri güncel).`);
if (failed.length) {
  console.warn(`Açılamayan ${failed.length} dosya (HEIC ise telefondan JPG olarak aktar):\n  ${[...new Set(failed)].join('\n  ')}`);
}
