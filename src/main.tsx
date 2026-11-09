import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import './styles.css';

render(<App />, document.getElementById('app')!);

// Çevrimdışı çalışma için service worker; yeni sürüm yayınlanınca kendiliğinden güncellenir.
registerSW({ immediate: true });
