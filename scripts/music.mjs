// Odadaki şarkıyı hazırlar (npm run dev / build öncesi kendiliğinden çalışır).
// images/muzik/<file>.(mp3|m4a|ogg|wav) → src/assets/music/<file>.mp3
// src/content/music.ts içindeki start/length kadar kesilir, başına/sonuna yumuşak geçiş eklenir.
// ffmpeg gerekir; yoksa ya da şarkı yoksa sessizce geçer (oyun kendi melodisini çalar).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, parse } from 'node:path';

const SRC = 'images/muzik';
const OUT = 'src/assets/music';
mkdirSync(SRC, { recursive: true });
mkdirSync(OUT, { recursive: true });

const cfg = readFileSync('src/content/music.ts', 'utf8');
const val = (k, d) => { const m = cfg.match(new RegExp(`\\b${k}:\\s*'?([^',\\n]+)'?`)); return m ? m[1].trim() : d; };
const file = val('file', 'cingenem');
const start = Number(val('start', 0)) || 0;
const length = Number(val('length', 45)) || 45;

const src = readdirSync(SRC).find((f) => parse(f).name.toLowerCase() === file.toLowerCase() && /\.(mp3|m4a|ogg|wav|aac)$/i.test(f));
const out = join(OUT, `${file}.mp3`);
// Eski çıktıları temizle (şarkı değişti ya da silindi)
for (const f of readdirSync(OUT)) {
  const mine = join(OUT, f) === out || f.startsWith(`.${file}.`);
  if (!src || !mine) rmSync(join(OUT, f));
}

if (!src) {
  console.log(`Müzik: images/muzik/${file}.mp3 yok → oyunun kendi melodisi çalar.`);
  process.exit(0);
}
const input = join(SRC, src);
const stamp = `${start}-${length}`;
const sig = join(OUT, `.${file}.${stamp}`);
if (existsSync(out) && existsSync(sig) && statSync(out).mtimeMs >= statSync(input).mtimeMs) {
  console.log('Müzik: güncel.');
  process.exit(0);
}
const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  console.warn('Müzik: ffmpeg bulunamadı, şarkı kesilemedi. (winget install Gyan.FFmpeg)');
  process.exit(0);
}
const fade = Math.min(2, length / 4);
execFileSync(ffmpeg, [
  '-y', '-loglevel', 'error', '-ss', String(start), '-t', String(length), '-i', input,
  '-af', `afade=t=in:st=0:d=${fade},afade=t=out:st=${length - fade}:d=${fade}`,
  '-ac', '2', '-b:a', '128k', out,
]);
for (const f of readdirSync(OUT)) if (f.startsWith(`.${file}.`)) rmSync(join(OUT, f));
writeFileSync(sig, ''); // hangi kesitle üretildiğini hatırlar
console.log(`Müzik: ${src} → ${out} (${start}. saniyeden ${length} sn)`);

function findFfmpeg() {
  for (const cmd of ['ffmpeg', 'ffmpeg.exe']) {
    try { execFileSync(cmd, ['-version'], { stdio: 'ignore' }); return cmd; } catch { /* yok */ }
  }
  // Windows winget kurulumu PATH'te olmayabilir
  const base = join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Packages');
  if (!existsSync(base)) return null;
  for (const d of readdirSync(base).filter((d) => /ffmpeg/i.test(d))) {
    const pkg = join(base, d);
    for (const sub of readdirSync(pkg)) {
      const exe = join(pkg, sub, 'bin', 'ffmpeg.exe');
      if (existsSync(exe)) return exe;
    }
  }
  return null;
}
