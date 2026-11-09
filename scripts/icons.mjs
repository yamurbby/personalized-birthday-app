// public/icon.svg'den PWA ve iOS ikonlarını üretir.
import sharp from 'sharp';

const src = 'public/icon.svg';
for (const [size, name] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']]) {
  await sharp(src, { density: 300 }).resize(size, size).png().toFile(`public/${name}`);
  console.log(`✓ public/${name}`);
}
