'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  copilot: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  customers: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  segments: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3',
  campaigns: 'M22 2L11 13 M22 2l-7 20-4-9-9-4z',
  analytics: 'M18 20V10 M12 20V4 M6 20v-6',
  collapse: 'M11 19l-7-7 7-7',
  expand: 'M13 5l7 7-7 7',
};

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/chat', label: 'AI Copilot', icon: 'copilot' },
  { href: '/customers', label: 'Customers', icon: 'customers' },
  { href: '/segments', label: 'Segments', icon: 'segments' },
  { href: '/campaigns', label: 'Campaigns', icon: 'campaigns' },
  { href: '/analytics', label: 'Analytics', icon: 'analytics' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Dynamically adjust main-content margin when sidebar collapses
  useEffect(() => {
    const main = document.querySelector('.main-content');
    if (main) {
      main.style.marginLeft = collapsed ? '72px' : '240px';
      main.style.transition = 'margin-left 0.25s ease';
    }
  }, [collapsed]);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.brand}>
        <div className={styles.logoMark}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div className={styles.brandInfo}>
          <div className={styles.brandName}>Luxe & Co.</div>
          <div className={styles.brandSub}>AI Native CRM</div>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Main navigation">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`${styles.navItem} ${isActive ? styles.active : ''}`} title={collapsed ? item.label : undefined}>
              <span className={styles.navIcon}><Icon d={ICONS[item.icon]} /></span>
              <span className={styles.navText}>{item.label}</span>
              {item.href === '/chat' && <span className={styles.aiBadge}>AI</span>}
            </Link>
          );
        })}
      </nav>

      <button 
        className={styles.collapseBtn}
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Icon d={collapsed ? ICONS.expand : ICONS.collapse} size={16} />
      </button>
    </aside>
  );
}
