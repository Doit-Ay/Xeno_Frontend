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
  const [view, setView] = useState('list'); // list, create
  
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
                <tr key={c.id} style={{ animation: `fadeIn 0.4s ease ${i * 0.05}s forwards`, opacity: 0 }}>
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
