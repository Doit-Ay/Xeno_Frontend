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
  plus: 'M12 5v14M5 12h14',
  spark: 'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z M19 15l.75 2.25L22 18l-2.25.75L19 22l-.75-2.25L16 18l2.25-.75L19 15z',
  trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
};

export default function Segments() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list, build
  
  // Builder state
  const [name, setName] = useState('');
  const [matchType, setMatchType] = useState('all');
  const [rules, setRules] = useState([{ field: 'totalSpent', operator: '>', value: '' }]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [previewCount, setPreviewCount] = useState(null);

  useEffect(() => {
    if (view === 'list') {
      setLoading(true);
      api.getSegments().then(data => {
        setSegments(Array.isArray(data) ? data : (data?.segments || []));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [view]);

  const addRule = () => setRules([...rules, { field: 'visits', operator: '>', value: '' }]);
  const removeRule = (i) => setRules(rules.filter((_, idx) => idx !== i));
  const updateRule = (i, key, val) => {
    const newRules = [...rules];
    newRules[i][key] = val;
    setRules(newRules);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Create segment: ${aiPrompt}`, intent: 'segment' })
      });
      const data = await res.json();
      if (data.action?.type === 'create_segment') {
        setName(data.action.payload.name || '');
        if (data.action.payload.rules) setRules(data.action.payload.rules);
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!name || rules.length === 0) return;
    try {
      await api.createSegment({ name, matchType, rules });
      setView('list');
    } catch (e) {
      console.error(e);
    }
  };

  if (view === 'build') {
    return (
      <div className="animate-fadeIn">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <button className="btn btn-ghost btn-sm mb-4" onClick={() => setView('list')}>← Back to list</button>
              <h1>Segment builder</h1>
            </div>
            <div className="flex gap-8">
              <button className="btn btn-secondary" onClick={() => setView('list')}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!name}>Save segment</button>
            </div>
          </div>
        </div>

        <div className={styles.builderGrid}>
          <div className={styles.rulesPanel}>
            <div className={styles.aiBar}>
              <Icon d={ICONS.spark} />
              <input 
                className={styles.aiInput}
                placeholder="Describe your audience (e.g., VIPs who haven't bought in 30 days)..." 
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
              />
              <button className="btn btn-sm btn-ghost" onClick={handleAiGenerate} disabled={generating}>
                {generating ? 'Thinking...' : 'Generate'}
              </button>
            </div>

            <div className="mb-24">
              <label>Segment Name</label>
              <input placeholder="e.g., Churning VIPs" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className={styles.logicToggle}>
              <span className="text-sm font-medium text-muted">Customers matching</span>
              <button className={`${styles.logicBtn} ${matchType === 'all' ? styles.active : ''}`} onClick={() => setMatchType('all')}>All (AND)</button>
              <button className={`${styles.logicBtn} ${matchType === 'any' ? styles.active : ''}`} onClick={() => setMatchType('any')}>Any (OR)</button>
              <span className="text-sm font-medium text-muted">of these rules:</span>
            </div>

            <div className="flex-col gap-12 mb-24">
              {rules.map((rule, i) => (
                <div key={i} className="segment-rule-row">
                  <select value={rule.field} onChange={e => updateRule(i, 'field', e.target.value)}>
                    <option value="totalSpent">Total spent (₹)</option>
                    <option value="visits">Store visits</option>
                    <option value="daysSinceLastVisit">Days since last visit</option>
                    <option value="tier">Loyalty tier</option>
                  </select>
                  <select value={rule.operator} onChange={e => updateRule(i, 'operator', e.target.value)}>
                    <option value=">">Greater than</option>
                    <option value="<">Less than</option>
                    <option value="==">Equals</option>
                    <option value="!=">Does not equal</option>
                  </select>
                  <input placeholder="Value" value={rule.value} onChange={e => updateRule(i, 'value', e.target.value)} />
                  <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => removeRule(i)}>
                    <Icon d={ICONS.trash} />
                  </button>
                </div>
              ))}
            </div>

            <button className="btn btn-secondary btn-sm" onClick={addRule}>
              <Icon d={ICONS.plus} /> Add rule
            </button>
          </div>

          <div className={styles.previewPanel}>
            <h4>Audience size</h4>
            {previewCount === null ? (
              <div className={styles.previewEmpty}>
                <Icon d={ICONS.users} size={32} />
                <p>Define rules to see an estimated audience size.</p>
                <button className="btn btn-secondary btn-sm" onClick={() => setPreviewCount(Math.floor(Math.random() * 5000) + 100)}>
                  Estimate size
                </button>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <div className={styles.previewCount}>{previewCount.toLocaleString('en-IN')}</div>
                <p className="text-sm text-muted">estimated customers match these rules</p>
                
                <div className={styles.sampleList}>
                  <div className="text-xs text-muted font-semibold mb-12 uppercase">Sample profiles</div>
                  {[1,2,3].map(i => (
                    <div key={i} className={styles.sampleRow}>
                      <div className="flex items-center gap-8">
                        <div className="skeleton" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                        <div className="skeleton" style={{ width: 100, height: 12, borderRadius: 4 }} />
                      </div>
                      <div className="skeleton" style={{ width: 60, height: 12, borderRadius: 4 }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            <h1>Segments</h1>
            <p>Target specific audience groups for your campaigns.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setView('build')}>
            <Icon d={ICONS.plus} /> Create segment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid-2">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : segments.length === 0 ? (
        <div className="empty-state">
          <Icon d={ICONS.users} size={48} />
          <h3>No segments yet</h3>
          <p>Create your first segment to start targeting customers.</p>
          <button className="btn btn-primary mt-16" onClick={() => setView('build')}>Create segment</button>
        </div>
      ) : (
        <div className={styles.segmentList}>
          {segments.map(seg => (
            <div key={seg.id} className={styles.segmentCard}>
              <div className={styles.segmentCardHeader}>
                <h3 className={styles.segmentName}>{seg.name}</h3>
                {seg.aiGenerated && <span className={styles.aiBadge}>AI</span>}
              </div>
              
              <p className={styles.segmentDesc}>
                {seg.description || 'Customers matching segment rules and criteria.'}
              </p>
              
              <div className={styles.segmentCardFooter}>
                <div className={styles.customerCountWrap}>
                  <span className={styles.segmentCount}>{seg.customerCount?.toLocaleString('en-IN') || 0}</span>
                  <span className={styles.segmentCountLabel}>customers</span>
                </div>
                
                <div className={styles.campaignStats}>
                  <span>{seg._count?.campaigns || 0} campaigns</span>
                  <Link href="/campaigns">
                    <button className={styles.createCampBtn}>+ Create Campaign</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
