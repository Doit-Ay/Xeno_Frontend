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

/* ── Circular progress ring for rate cards ── */
function CircleIndicator({ value, color, size = 52 }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1a1a1a" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="butt"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

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

  const deliveryRate = perf.deliveryRate || 0;
  const openRate = Math.round(((perf.totalOpened || 0) / totalSent) * 100) || 0;
  const clickRate = Math.round(((perf.totalClicked || 0) / totalSent) * 100) || 0;

  const metrics = [
    { label: 'Total sent', value: perf.totalSent || 0, icon: ICONS.send, color: '#ffffff' },
    { label: 'Opened', value: perf.totalOpened || 0, icon: ICONS.eye, color: '#3b82f6' },
    { label: 'Clicked', value: perf.totalClicked || 0, icon: ICONS.click, color: '#f59e0b' },
    { label: 'Failed', value: perf.totalFailed || 0, icon: ICONS.alert, color: '#ef4444' },
  ];

  const summaryStats = [
    { label: 'Delivery Rate', value: deliveryRate, borderColor: '#22c55e' },
    { label: 'Open Rate', value: openRate, borderColor: '#3b82f6' },
    { label: 'Click Rate', value: clickRate, borderColor: '#f59e0b' },
  ];

  const rateCards = [
    { label: 'Delivery rate', value: deliveryRate, color: '#22c55e' },
    { label: 'Open rate', value: openRate, color: '#3b82f6' },
    { label: 'Click rate', value: clickRate, color: '#f59e0b' },
  ];

  const channels = [
    { label: 'WhatsApp', value: 65, color: '#22c55e' },
    { label: 'SMS', value: 20, color: '#3b82f6' },
    { label: 'Email', value: 15, color: '#a855f7' },
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


      {/* ── Metric cards row ── */}
      <div className="stats-grid">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className="card"
            style={{
              borderLeft: `3px solid ${m.color}`,
              border: '1px solid #333',
              borderLeftWidth: 3,
              borderLeftColor: m.color,
              background: '#0d0d0d',
              animationDelay: `${i * 60}ms`,
              animation: 'fadeIn 0.4s cubic-bezier(0.4,0,0.2,1) forwards',
              opacity: 0,
            }}
          >
            <div className="flex items-center gap-12 mb-16">
              <div style={{ width: 32, height: 32, background: '#1a1a1a', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                <Icon d={m.icon} />
              </div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', fontWeight: 600 }}>{m.label}</div>
            </div>
            <div className="flex items-end justify-between">
              <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: '2.4rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {m.value.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mt-24">
        {/* ── 2. Conversion Funnel (improved bars) ── */}
        <div className="card" style={{ background: '#0d0d0d', border: '1px solid #333' }}>
          <h3 className="mb-24 text-lg" style={{ color: '#fff', fontWeight: 700 }}>Conversion funnel</h3>
          <div className="flex-col gap-24">
            <FunnelBar label="Sent" count={perf.totalSent || 0} total={totalSent} color="#ffffff" />
            <FunnelBar label="Delivered" count={perf.totalDelivered || 0} total={totalSent} color="#22c55e" />
            <FunnelBar label="Opened" count={perf.totalOpened || 0} total={totalSent} color="#3b82f6" />
            <FunnelBar label="Read" count={perf.totalRead || 0} total={totalSent} color="#f59e0b" />
            <FunnelBar label="Clicked" count={perf.totalClicked || 0} total={totalSent} color="#a855f7" />
          </div>

          {/* ── 5. Channel Breakdown ── */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #333' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Channel breakdown</h4>
            <div style={{ display: 'flex', height: 28, overflow: 'hidden', border: '1px solid #333' }}>
              {channels.map((ch) => (
                <div key={ch.label} style={{
                  width: `${ch.value}%`, background: ch.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: '#000', letterSpacing: '0.02em',
                  transition: 'width 0.8s ease',
                }}>
                  {ch.value >= 15 ? `${ch.label} ${ch.value}%` : ''}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              {channels.map((ch) => (
                <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, background: ch.color }} />
                  <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>{ch.label} — {ch.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-col gap-14">
          {/* ── 3. Delivery Rates as cards with circular indicator ── */}
          <div className="card h-full" style={{ background: '#0d0d0d', border: '1px solid #333', padding: 0 }}>
            <h3 style={{ padding: '20px 24px 0', marginBottom: 4, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Delivery rates</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {rateCards.map((r, i) => (
                <div key={r.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderBottom: i < rateCards.length - 1 ? '1px solid #222' : 'none',
                  borderLeft: `3px solid ${r.color}`,
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', fontWeight: 600, marginBottom: 4 }}>{r.label}</div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', color: '#fff', fontWeight: 700, lineHeight: 1 }}>{r.value}%</div>
                  </div>
                  <CircleIndicator value={r.value} color={r.color} />
                </div>
              ))}
            </div>
          </div>

          {/* ── 4. AI Insight card (more padding, breathable text) ── */}
          <div className="card" style={{
            background: '#ffffff', border: '1px solid #ffffff', color: '#000000',
            padding: 24,
          }}>
            <div className="flex items-center gap-8 mb-12">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#000000' }}>AI Insight</h3>
            </div>
            <p style={{ color: '#333333', lineHeight: 1.7, fontSize: '0.875rem', fontWeight: 500 }}>
              Your recent WhatsApp campaigns have a <strong>24% higher engagement rate</strong> than your SMS campaigns. Consider shifting budget to WhatsApp for the upcoming Summer Sale.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Improved Funnel Bar (16px, inline label) ── */
function FunnelBar({ label, count, total, color }) {
  const pct = Math.round((count / total) * 100) || 0;
  return (
    <div>
      <div className="flex justify-between mb-8 text-sm">
        <span style={{ color: '#aaa', fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 600, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          {count.toLocaleString('en-IN')} <span style={{ color: '#666', marginLeft: 4 }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ height: 16, background: '#1a1a1a', overflow: 'hidden', border: '1px solid #333', position: 'relative' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color,
          transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6,
        }}>
          {pct >= 20 && (
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#000', lineHeight: 1 }}>{pct}%</span>
          )}
        </div>
      </div>
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
