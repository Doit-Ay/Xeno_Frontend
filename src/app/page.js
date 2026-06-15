'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from './page.module.css';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICONS = {
  spark: 'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z M19 15l.75 2.25L22 18l-2.25.75L19 22l-.75-2.25L16 18l2.25-.75L19 15z',
  plus: 'M12 5v14M5 12h14',
  segment: 'M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3',
  arrow: 'M7 17l9.2-9.2M17 17V7H7',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function Sparkline({ data, color, id }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const gradientId = `spark-grad-${id}`;

  return (
    <div className={styles.sparklineContainer}>
      <svg className={styles.sparklineSvg} viewBox="0 -10 100 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,100 ${points} 100,100`} fill={`url(#${gradientId})`} opacity="0.5" />
        <polyline points={points} className={styles.sparklinePath} stroke={color} />
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.getOverview().catch(() => null),
      api.getCampaigns({ limit: 6 }).catch(() => ({ campaigns: [] })),
    ]).then(([overview, campaignData]) => {
      if (cancelled) return;
      setData(overview);
      setCampaigns(campaignData?.campaigns || []);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  if (loading) return <DashboardSkeleton />;

  const perf = data?.performance || {};
  const metrics = [
    { label: 'Customers', value: data?.totalCustomers || 0, note: `${data?.recentCustomers || 0} added in 30 days`, accent: 'var(--accent)', spark: [20, 25, 22, 30, 45, 50, 70] },
    { label: 'Active segments', value: data?.totalSegments || 0, note: 'Ready for targeting', accent: 'var(--info)', spark: [5, 5, 8, 8, 12, 10, 15] },
    { label: 'Messages sent', value: perf.totalSent || 0, note: `Across ${data?.totalCampaigns || 0} campaigns`, accent: 'var(--warning)', spark: [100, 150, 120, 300, 450, 400, 600] },
    { label: 'Delivery rate', value: `${perf.deliveryRate || 0}%`, note: `${perf.totalFailed || 0} failed deliveries`, accent: 'var(--success)', spark: [95, 96, 95, 97, 98, 98, 99] },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Header with greeting */}
      <header className="dashboard-header">
        <div>
          <h1>{getGreeting()}</h1>
          <div className="dashboard-date">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="quick-actions">
          <Link href="/segments" className="btn btn-secondary">
            <Icon d={ICONS.segment} /> Build segment
          </Link>
          <Link href="/campaigns" className="btn btn-secondary">
            <Icon d={ICONS.plus} /> New campaign
          </Link>
          <Link href="/chat" className="btn btn-primary">
            <Icon d={ICONS.spark} /> Ask copilot
          </Link>
        </div>
      </header>

      {/* Summary Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', marginBottom: 4, fontSize: '.85rem', color: 'var(--text-muted)' }}>
        <span>You have <strong style={{ color: '#fff' }}>{(data?.totalCustomers || 0).toLocaleString('en-IN')}</strong> customers across <strong style={{ color: '#fff' }}>{data?.totalSegments || 0}</strong> segments with <strong style={{ color: '#fff' }}>{data?.totalCampaigns || 0}</strong> campaigns.</span>
      </div>


      {/* Advanced Bento Grid */}
      <div className={styles.bentoGrid}>
        
        {/* Top Row: Metrics */}
        {metrics.map((metric, i) => (
          <div
            className={`dashboard-metric ${styles.metricPanel}`}
            key={metric.label}
            style={{
              '--metric-accent': metric.accent,
              animationDelay: `${i * 60}ms`,
              animation: 'fadeIn 0.4s cubic-bezier(0.4,0,0.2,1) forwards',
              opacity: 0,
            }}
          >
            <div>
              <div className="dashboard-metric-label">{metric.label}</div>
              <div className="dashboard-metric-value" style={{ color: metric.accent }}>
                {typeof metric.value === 'number' ? metric.value.toLocaleString('en-IN') : metric.value}
              </div>
              <div className="dashboard-metric-note">{metric.note}</div>
            </div>
            <Sparkline data={metric.spark} color={metric.accent} id={metric.label.toLowerCase().replace(/\s+/g, '-')} />
          </div>
        ))}

        {/* Middle Row: AI Insight (span 2) + Funnel (span 2) */}
        <div className={`panel ${styles.insightPanel} animate-slideUp delay-2`}>
          <div className={styles.insightHeader}>
            <div className={styles.insightIcon}><Icon d={ICONS.spark} size={16} /></div>
            <div className={styles.insightTitle}>AI Copilot Insight</div>
          </div>
          <div className={styles.insightBody}>
            <strong style={{ color: '#ffffff', fontWeight: 700 }}>High churn risk detected.</strong> You have 142 VIP customers who haven{String.fromCharCode(8217)}t made a purchase in over 45 days. Historically, a targeted intervention now yields a 28% recovery rate.
          </div>
          <div>
            <Link href="/campaigns" className="btn" style={{ background: '#ffffff', color: '#000000', border: 'none', padding: '10px 20px', borderRadius: '100px', fontWeight: 600 }}>
              <Icon d={ICONS.spark} /> Draft Win-back Campaign
            </Link>
          </div>
        </div>

        <section className={`panel ${styles.funnelPanel} animate-slideUp delay-2`}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Communication funnel</div>
              <div className="panel-subtitle">Aggregate performance across all campaigns</div>
            </div>
            <Link href="/analytics" className="panel-link">
              Full analytics <Icon d={ICONS.arrow} size={12} />
            </Link>
          </div>
          <div className="panel-body">
            <FunnelRow label="Sent" value={perf.totalSent || 0} max={perf.totalSent || 1} />
            <FunnelRow label="Delivered" value={perf.totalDelivered || 0} max={perf.totalSent || 1} />
            <FunnelRow label="Opened" value={perf.totalOpened || 0} max={perf.totalSent || 1} />
            <FunnelRow label="Read" value={perf.totalRead || 0} max={perf.totalSent || 1} />
            <FunnelRow label="Clicked" value={perf.totalClicked || 0} max={perf.totalSent || 1} />
          </div>
        </section>

        {/* Bottom Row: Recent campaigns (span 4) */}
        <section className={`panel ${styles.campaignsPanel} animate-slideUp delay-3`}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Recent campaigns</div>
              <div className="panel-subtitle">Latest delivery activity</div>
            </div>
            <Link href="/campaigns" className="panel-link">View all</Link>
          </div>
          {campaigns.length === 0 ? (
            <div className="empty-state">
              <h3>No campaigns yet</h3>
              <p>Create a campaign to start reaching customers.</p>
            </div>
          ) : (
            <div className="campaign-list">
              {campaigns.map((campaign, idx) => (
                <div className="campaign-list-row" key={campaign.id} style={{ cursor: 'pointer' }}>
                  <div style={{ width: 28, fontSize: '.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{idx + 1}</div>
                  <div className="campaign-list-main" style={{ flex: 1 }}>
                    <div className="campaign-list-name">{campaign.name}</div>
                    <div className="campaign-list-meta">
                      <span style={{ textTransform: 'capitalize' }}>{campaign.channel}</span>
                      <span>{campaign.segment?.name}</span>
                    </div>
                  </div>
                  <div className="campaign-list-result">
                    <StatusBadge status={campaign.status} />
                    <strong>{campaign.totalDelivered?.toLocaleString('en-IN') || 0}</strong>
                    <span>/ {campaign.totalSent?.toLocaleString('en-IN') || 0}</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '.8rem' }}>
                      {campaign.totalSent > 0 ? `${Math.round((campaign.totalDelivered / campaign.totalSent) * 100)}%` : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes = {
    draft: 'badge-neutral',
    sending: 'badge-warning',
    sent: 'badge-info',
    completed: 'badge-success',
    failed: 'badge-danger',
    stopped: 'badge-warning',
  };
  return <span className={`badge ${classes[status] || 'badge-neutral'}`}>{status}</span>;
}

function FunnelRow({ label, value, max }) {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const pctText = `${Math.round(percentage)}%`;
  return (
    <div className="funnel-row">
      <span className="funnel-label">{label}</span>
      <div className="funnel-track" style={{ height: 16 }}>
        <div className="funnel-fill" style={{ width: `${percentage}%`, position: 'relative' }}>
          {percentage >= 20 && (
            <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: '.65rem', fontWeight: 700, color: '#000' }}>{pctText}</span>
          )}
        </div>
      </div>
      <span className="funnel-value">{value.toLocaleString('en-IN')}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="skeleton skeleton-title" />
      <div className={styles.bentoGrid}>
        {[0, 1, 2, 3].map(item => (
          <div key={item} className={`dashboard-metric ${styles.metricPanel}`} style={{ padding: 0 }}>
            <div className="skeleton" style={{ height: '100%', minHeight: 110, borderRadius: 'var(--radius)' }} />
          </div>
        ))}
        <div className={`skeleton ${styles.insightPanel}`} style={{ height: '320px', borderRadius: 'var(--radius)' }} />
        <div className={`skeleton ${styles.funnelPanel}`} style={{ height: '320px', borderRadius: 'var(--radius)' }} />
      </div>
    </div>
  );
}
