import type { TabId } from '../../core/types';
import { Icon } from './Bits';

const tabs: { id: TabId; label: string }[] = [
  { id: 'room', label: 'Oda' },
  { id: 'campus', label: 'Yolculuk' },
  { id: 'together', label: 'Birlikte' },
];

export function NavBar({ tab, onTab }: { tab: TabId; onTab: (t: TabId) => void }) {
  return (
    <nav class="navbar">
      {tabs.map((t) => (
        <button key={t.id} class={`nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => onTab(t.id)} aria-current={tab === t.id}>
          <Icon name={`tab_${t.id}`} size={26} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
