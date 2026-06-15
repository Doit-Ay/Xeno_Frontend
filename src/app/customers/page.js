'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import styles from './page.module.css';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICONS = {
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  calendar: 'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  close: 'M18 6L6 18M6 6l12 12',
};

const TIER_BADGES = { gold: 'badge-gold', silver: 'badge-silver', bronze: 'badge-bronze' };

function timeAgo(date) {
  if (!date) return '—';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const debounceRef = useRef(null);
  const limit = 25;

  const fetchCustomers = (searchTerm = search, pageNum = page) => {
    setLoading(true);
    api.getCustomers({ search: searchTerm, page: pageNum, limit }).then(data => {
      setCustomers(data?.customers || []);
      setTotal(data?.total || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers('', 1); }, []);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCustomers(val, 1), 350);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>Customers</h1><p>{total.toLocaleString('en-IN')} total contacts</p></div>
        </div>
      </div>

      <div className={styles.searchBar}>
        <Icon d={ICONS.search} />
        <input placeholder="Search by name, email, or phone…" value={search} onChange={e => handleSearch(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedCustomer ? '1fr 380px' : '1fr', gap: 16 }}>
        <div className="table-container">
          <table>
            <thead><tr>
              <th>Name</th><th>Email</th><th>Phone</th>
              <th style={{ textAlign: 'right' }}>Total spent</th>
              <th style={{ textAlign: 'right' }}>Visits</th>
              <th>Tier</th><th>Last active</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="skeleton" style={{ height: 180 }} /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-24"><p className="text-muted">No customers found.</p></td></tr>
              ) : customers.map(c => (
                <tr key={c.id} onClick={() => setSelectedCustomer(c)} style={{ cursor: 'pointer' }} className={selectedCustomer?.id === c.id ? styles.activeRow : ''}>
                  <td className="font-semibold">{c.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>{c.phone || '—'}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>₹{(c.totalSpent || 0).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right' }}>{c.visits || 0}</td>
                  <td><span className={`badge ${TIER_BADGES[c.tier] || 'badge-neutral'}`}>{c.tier || '—'}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '.78rem' }}>{timeAgo(c.lastActive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedCustomer && (
          <div className={styles.detailPanel}>
            <button className={styles.closeBtn} onClick={() => setSelectedCustomer(null)}>
              <Icon d={ICONS.close} size={14} />
            </button>
            <div className={styles.detailHeader}>
              <div className={styles.avatar}>{selectedCustomer.name?.charAt(0)?.toUpperCase()}</div>
              <h3>{selectedCustomer.name}</h3>
              <span className={`badge ${TIER_BADGES[selectedCustomer.tier] || 'badge-neutral'}`} style={{ marginTop: 8 }}>{selectedCustomer.tier || 'no tier'}</span>
            </div>
            <div className={styles.detailGrid}>
              <DetailRow icon={ICONS.mail} label="Email" value={selectedCustomer.email} />
              <DetailRow icon={ICONS.phone} label="Phone" value={selectedCustomer.phone || '—'} />
              <DetailRow icon={ICONS.dollar} label="Total spent" value={`₹${(selectedCustomer.totalSpent || 0).toLocaleString('en-IN')}`} />
              <DetailRow icon={ICONS.star} label="Visits" value={selectedCustomer.visits || 0} />
              <DetailRow icon={ICONS.calendar} label="Last active" value={timeAgo(selectedCustomer.lastActive)} />
            </div>
          </div>
        )}
      </div>

      <div className={styles.pagination}>
        <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => { setPage(p => p - 1); fetchCustomers(search, page - 1); }}>← Prev</button>
        <span className="text-sm text-muted font-medium">Page {page} of {totalPages}</span>
        <button className="btn btn-sm btn-ghost" disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); fetchCustomers(search, page + 1); }}>Next →</button>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className={styles.detailRow}>
      <Icon d={icon} size={14} />
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}
