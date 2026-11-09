import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/** Sadece geliştirme: tools/render-room.html'in ürettiği PNG'leri art-src/renders/ içine yazar. */
function saveRenders(): Plugin {
  return {
    name: 'save-renders',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__save', (req, res) => {
        const name = new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? 'render.png';
        if (req.method !== 'POST' || !/^[\w-]+\.(png|jpg|webp)$/.test(name)) { res.statusCode = 400; res.end(); return; }
        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          // Proje köküne göre (sunucu başka bir klasörden başlatılsa da doğru yere yazsın)
          const dir = join(server.config.root, 'art-src', 'renders');
          mkdirSync(dir, { recursive: true });
          writeFileSync(join(dir, name), Buffer.concat(chunks));
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [
    saveRenders(),
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Oyun dosyaları ve albüm önizlemeleri (t_*) baştan önbelleğe alınır → çevrimdışı çalışır.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2,mp3}'],
        // Tam boy fotoğraflar (f_*) baştan indirilmez (50 foto ≈ 10+ MB); açıldıkça önbelleğe girer.
        globIgnores: ['**/assets/f_*'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/f_.*\.webp$/,
            handler: 'CacheFirst',
            options: { cacheName: 'album-tam-boy', expiration: { maxEntries: 200 } },
          },
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'Pelin’in Molası',
        short_name: 'Mola',
        description: 'Pelin için küçük molalar ve sürprizler',
        lang: 'tr',
        theme_color: '#ffb7c5',
        background_color: '#fff6f0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
