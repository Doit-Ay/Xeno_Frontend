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
              boxShadow: `inset 0 2px 0 ${m.bg}, var(--glass-glow), var(--glass-shadow)`,
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
            <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {m.value.toLocaleString('en-IN')}
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
            <h3 className="mb-16 text-lg">Delivery rates</h3>
            <div className="flex-col gap-12">
              <RateRow label="Delivery rate" value={perf.deliveryRate} />
              <RateRow label="Open rate" value={Math.round(((perf.totalOpened||0)/totalSent)*100)||0} />
              <RateRow label="Click rate" value={Math.round(((perf.totalClicked||0)/totalSent)*100)||0} />
            </div>
          </div>
          
          <div className="card" style={{ background: 'rgba(var(--accent-rgb), 0.05)', borderColor: 'rgba(var(--accent-rgb), 0.1)' }}>
            <h3 className="mb-8 text-lg" style={{ color: 'var(--accent)' }}>AI Insight</h3>
            <p className="text-sm text-secondary">
              Your recent WhatsApp campaigns have a 24% higher engagement rate than your SMS campaigns. Consider shifting budget to WhatsApp for the upcoming Summer Sale.
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
        <span className="text-secondary">{label}</span>
        <span className="font-semibold tabular-nums">{count.toLocaleString('en-IN')} <span className="text-muted ml-4">({pct}%)</span></span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 12px ${color}` }} />
      </div>
    </div>
  );
}

function RateRow({ label, value }) {
  return (
    <div className="flex items-center justify-between p-16 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="text-secondary">{label}</span>
      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 600 }}>{value}%</span>
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
