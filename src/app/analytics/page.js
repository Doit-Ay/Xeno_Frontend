'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICONS = {
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z',
  click: 'M15 3h6v6M9 21v-9a1.5 1.5 0 013 0v4M21 3l-7 7M21 15v.01M21 19v.01M3 15v.01M3 19v.01M3 11v.01M3 7v.01M7 3h.01M11 3h.01',
  alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01',
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOverview().then(res => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <AnalyticsSkeleton />;

  const perf = data?.performance || {};
  const totalSent = perf.totalSent || 1; // avoid div by 0

  const metrics = [
    { label: 'Total sent', value: perf.totalSent || 0, icon: ICONS.send, color: 'var(--accent)', bg: 'rgba(var(--accent-rgb), 0.1)' },
    { label: 'Opened', value: perf.totalOpened || 0, icon: ICONS.eye, color: 'var(--info)', bg: 'rgba(49, 130, 206, 0.1)' },
    { label: 'Clicked', value: perf.totalClicked || 0, icon: ICONS.click, color: 'var(--warning)', bg: 'rgba(221, 107, 32, 0.1)' },
    { label: 'Failed', value: perf.totalFailed || 0, icon: ICONS.alert, color: 'var(--danger)', bg: 'rgba(229, 62, 62, 0.1)' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Analytics</h1>
            <p>Performance metrics across all campaigns</p>
          </div>
          <select className="btn btn-secondary" style={{ width: 'auto' }}>
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>All time</option>
          </select>
        </div>
      </div>

      <div className="stats-grid">
        {metrics.map((m, i) => (
          <div 
            key={m.label} 
            className="card"
            style={{ 
              borderLeft: `4px solid ${m.color}`,
              animationDelay: `${i * 60}ms`,
              animation: 'fadeIn 0.4s cubic-bezier(0.4,0,0.2,1) forwards',
              opacity: 0,
            }}
          >
            <div className="flex items-center gap-12 mb-16">
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: m.bg, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon d={m.icon} />
              </div>
              <div className="text-muted text-xs uppercase font-semibold tracking-wider">{m.label}</div>
            </div>
            <div className="flex items-end justify-between">
              <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: '2.4rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {m.value.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600, paddingBottom: '4px' }}>
                +12% ↑
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mt-24">
        <div className="card">
          <h3 className="mb-24 text-lg">Conversion funnel</h3>
          <div className="flex-col gap-24">
            <FunnelBar label="Sent" count={perf.totalSent || 0} total={totalSent} color="var(--accent)" />
            <FunnelBar label="Delivered" count={perf.totalDelivered || 0} total={totalSent} color="var(--success)" />
            <FunnelBar label="Opened" count={perf.totalOpened || 0} total={totalSent} color="var(--info)" />
            <FunnelBar label="Read" count={perf.totalRead || 0} total={totalSent} color="var(--warning)" />
            <FunnelBar label="Clicked" count={perf.totalClicked || 0} total={totalSent} color="#a064f0" />
          </div>
        </div>

        <div className="flex-col gap-14">
          <div className="card h-full">
            <h3 className="mb-16 text-lg font-bold">Delivery rates</h3>
            <div className="flex-col">
              <RateRow label="Delivery rate" value={perf.deliveryRate} />
              <RateRow label="Open rate" value={Math.round(((perf.totalOpened||0)/totalSent)*100)||0} />
              <RateRow label="Click rate" value={Math.round(((perf.totalClicked||0)/totalSent)*100)||0} isLast={true} />
            </div>
          </div>
          
          <div className="card" style={{ background: '#ffffff', borderColor: '#ffffff', color: '#000000', boxShadow: '0 8px 32px rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-8 mb-12">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <h3 className="text-lg font-bold" style={{ color: '#000000' }}>AI Insight</h3>
            </div>
            <p className="text-sm font-medium" style={{ color: '#333333', lineHeight: 1.6 }}>
              Your recent WhatsApp campaigns have a <strong>24% higher engagement rate</strong> than your SMS campaigns. Consider shifting budget to WhatsApp for the upcoming Summer Sale.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FunnelBar({ label, count, total, color }) {
  const pct = Math.round((count / total) * 100) || 0;
  return (
    <div>
      <div className="flex justify-between mb-8 text-sm">
        <span className="text-secondary font-medium">{label}</span>
        <span className="font-semibold tabular-nums text-primary" style={{ color: '#fff' }}>{count.toLocaleString('en-IN')} <span className="text-muted ml-4">({pct}%)</span></span>
      </div>
      <div style={{ height: 12, background: 'var(--bg-secondary)', borderRadius: 100, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 100, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  );
}

function RateRow({ label, value, isLast }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '16px 0', borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <span className="text-secondary font-medium">{label}</span>
      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>{value}%</span>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div>
      <div className="skeleton skeleton-title" />
      <div className="stats-grid">
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius)' }} />)}
      </div>
      <div className="grid-2 mt-24">
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius)' }} />
        <div className="flex-col gap-14">
          <div className="skeleton" style={{ height: 260, borderRadius: 'var(--radius)' }} />
          <div className="skeleton" style={{ height: 126, borderRadius: 'var(--radius)' }} />
        </div>
      </div>
    </div>
  );
}
