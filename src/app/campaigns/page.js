'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICONS = {
  plus: 'M12 5v14M5 12h14',
  spark: 'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z M19 15l.75 2.25L22 18l-2.25.75L19 22l-.75-2.25L16 18l2.25-.75L19 15z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
};

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
  { id: 'sms', label: 'SMS', color: '#4A90E2' },
  { id: 'email', label: 'Email', color: '#D44638' },
];

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list, create, details
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  
  // Create state
  const [name, setName] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [content, setContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (view === 'list') {
      setLoading(true);
      Promise.all([
        api.getCampaigns().catch(() => ({ campaigns: [] })),
        api.getSegments().catch(() => [])
      ]).then(([cData, sData]) => {
        setCampaigns(cData.campaigns || []);
        setSegments(Array.isArray(sData) ? sData : (sData.segments || []));
        setLoading(false);
      });
    } else if (view === 'create' && segments.length === 0) {
      api.getSegments().then(data => setSegments(Array.isArray(data) ? data : (data.segments || [])));
    }
  }, [view]);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Draft a ${channel} message for: ${aiPrompt}`, intent: 'campaign' })
      });
      const data = await res.json();
      if (data.action?.type === 'draft_campaign') {
        if (data.action.payload.content) setContent(data.action.payload.content);
        if (data.action.payload.name) setName(data.action.payload.name);
      } else if (data.reply) {
        setContent(data.reply);
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const handleSave = async (status = 'draft') => {
    if (!name || !segmentId || !content) return;
    try {
      await api.createCampaign({ name, segmentId: parseInt(segmentId), channel, content, status });
      setView('list');
      setName(''); setContent(''); setAiPrompt('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewCampaign = async (id) => {
    setLoading(true);
    setView('details');
    try {
      const data = await api.getCampaign(id);
      setSelectedCampaign(data);
    } catch (e) {
      console.error(e);
      setView('list');
    }
    setLoading(false);
  };

  if (view === 'details' && loading) {
    return (
      <div className="animate-fadeIn">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <button className="btn btn-ghost btn-sm mb-4" onClick={() => setView('list')}>{String.fromCharCode(8592)} Back to campaigns</button>
              <div className="skeleton" style={{ width: 240, height: 28, borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 320, height: 14, borderRadius: 4 }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius)' }} />)}
        </div>
      </div>
    );
  }

  if (view === 'details' && selectedCampaign) {
    const c = selectedCampaign;
    const sent = c.totalSent || c._count?.communications || 0;
    const delivered = c.totalDelivered || 0;
    const failed = c.totalFailed || 0;
    const pending = c.totalPending || 0;
    const deliveryRate = sent > 0 ? ((delivered / sent) * 100).toFixed(1) : '0';

    return (
      <div className="animate-fadeIn">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <button className="btn btn-ghost btn-sm mb-4" onClick={() => setView('list')}>{String.fromCharCode(8592)} Back to campaigns</button>
              <h1>{c.name}</h1>
              <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusBadge status={c.status} />
                <span style={{ color: 'var(--text-muted)' }}>{String.fromCharCode(183)} {c.channel?.toUpperCase()}</span>
                <span style={{ color: 'var(--text-muted)' }}>{String.fromCharCode(183)} {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 16 }}>
          {[
            { label: 'Total Sent', value: sent, accent: '#4A90E2' },
            { label: 'Delivered', value: delivered, accent: '#34C759' },
            { label: 'Failed', value: failed, accent: '#FF3B30' },
            { label: 'Delivery Rate', value: `${deliveryRate}%`, accent: '#ffffff' },
          ].map(s => (
            <div key={s.label} className="panel" style={{ padding: 20, borderLeft: `3px solid ${s.accent}` }}>
              <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#fff' }}>{typeof s.value === 'number' ? s.value.toLocaleString('en-IN') : s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          {/* Message Content */}
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ fontSize: '.82rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Message Content</div>
            <div style={{ fontSize: '.9rem', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {c.messageTemplate || c.content || 'No message content.'}
            </div>
            {c.segment && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>TARGET SEGMENT</div>
                <div style={{ fontSize: '.9rem', fontWeight: 600 }}>{c.segment.name}</div>
              </div>
            )}
          </div>

          {/* Communications Log */}
          <div className="panel" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Delivery Log ({c._count?.communications || 0})</div>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Contact</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {c.communications?.length > 0 ? c.communications.map(comm => (
                    <tr key={comm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px' }}>{comm.customer?.name || 'Unknown'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{comm.customer?.email || comm.customer?.phone || '-'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}><StatusBadge status={comm.status} /></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No delivery logs yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="animate-fadeIn">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <button className="btn btn-ghost btn-sm mb-4" onClick={() => setView('list')}>← Back to list</button>
              <h1>Create campaign</h1>
            </div>
            <div className="flex gap-8">
              <button className="btn btn-secondary" onClick={() => handleSave('draft')}>Save draft</button>
              <button className="btn btn-primary" onClick={() => handleSave('sending')} disabled={!name || !content || !segmentId}>
                <Icon d={ICONS.send} /> Send now
              </button>
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Settings Panel */}
          <div className="card">
            <h3 className="text-lg mb-24">Campaign settings</h3>
            
            <div className="mb-24">
              <label>Campaign Name</label>
              <input placeholder="e.g., Summer VIP Sale" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="mb-24">
              <label>Target Segment</label>
              <select value={segmentId} onChange={e => setSegmentId(e.target.value)}>
                <option value="">Select a segment...</option>
                {segments.map(s => <option key={s.id} value={s.id}>{s.name} ({s.customerCount} users)</option>)}
              </select>
            </div>

            <div>
              <label>Channel</label>
              <div className="campaign-channel-grid">
                {CHANNELS.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => setChannel(c.id)}
                    style={{
                      padding: '14px',
                      border: `1px solid ${channel === c.id ? c.color : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: channel === c.id ? `${c.color}15` : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: 500,
                      color: channel === c.id ? c.color : 'var(--text-secondary)',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Panel */}
          <div className="flex-col gap-16">
            <div className="card" style={{ background: '#ffffff', borderColor: '#ffffff', color: '#000000', boxShadow: '0 8px 32px rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-8 mb-12" style={{ color: '#000000', fontWeight: 600, fontSize: '.88rem' }}>
                <Icon d={ICONS.spark} /> AI Copywriter
              </div>
              <div className="flex gap-8">
                <input 
                  placeholder="What's this campaign about?" 
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
                  style={{ background: 'rgba(0,0,0,0.05)', color: '#000000', border: '1px solid rgba(0,0,0,0.1)' }}
                />
                <button className="btn" onClick={handleAiGenerate} disabled={generating} style={{ whiteSpace: 'nowrap', background: '#000000', color: '#ffffff' }}>
                  {generating ? 'Drafting...' : 'Draft copy'}
                </button>
              </div>
            </div>

            <div className="card flex-1 flex-col">
              <label>Message Content</label>
              <textarea 
                className="flex-1"
                style={{ minHeight: '200px', resize: 'none' }}
                placeholder={`Type your ${channel} message here...`}
                value={content}
                onChange={e => setContent(e.target.value)}
              />
              <div className="text-xs text-muted mt-8 text-right">
                {content.length} characters
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Campaigns</h1>
            <p>Manage and track your marketing campaigns.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setView('create')}>
            <Icon d={ICONS.plus} /> Create campaign
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Status</th>
              <th>Segment</th>
              <th>Channel</th>
              <th style={{ textAlign: 'right' }}>Sent</th>
              <th style={{ textAlign: 'right' }}>Delivered</th>
              <th style={{ textAlign: 'right' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}><div className="skeleton" style={{ height: 200 }} /></td></tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-24" style={{ opacity: 0.6 }}>
                  <Icon d={ICONS.send} size={32} />
                  <p className="mt-8 text-muted">No campaigns found.</p>
                </td>
              </tr>
            ) : (
              campaigns.map((c, i) => (
                <tr key={c.id} onClick={() => handleViewCampaign(c.id)} style={{ animation: `fadeIn 0.4s ease ${i * 0.05}s forwards`, opacity: 0, cursor: 'pointer' }}>
                  <td className="font-semibold">{c.name}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="text-secondary">{c.segment?.name || '—'}</td>
                  <td><span style={{ textTransform: 'capitalize', fontSize: '.8rem' }}>{c.channel}</span></td>
                  <td className="text-right tabular-nums">{c.totalSent?.toLocaleString('en-IN') || 0}</td>
                  <td className="text-right tabular-nums text-success font-medium">{c.totalDelivered?.toLocaleString('en-IN') || 0}</td>
                  <td className="text-right text-muted text-xs">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
