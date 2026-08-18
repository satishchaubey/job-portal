import React, { useState } from 'react';
import {
  Search, Send, Loader2, CheckCircle2, AlertCircle, ExternalLink,
  Building2, Zap, Mail, Edit3,
  Sparkles, Globe, Play, Layers, CheckSquare, Square as SquareIcon, Filter
} from 'lucide-react';
import { getApiBase } from '../config';

// ─── Types ────────────────────────────────────────────────────
interface HuntResult {
  id: string;
  title: string;
  company: string;
  platform: string;
  url: string;
  hrEmail: string;
  candidateEmails?: string[];
  isGuessed: boolean;
  publishedDate?: string;
}

interface EmailBatch {
  batchNum: number;
  items: HuntResult[];
}

// ─── Platform definitions ─────────────────────────────────────
const PLATFORMS = [
  { key: 'linkedin',        label: 'LinkedIn',         color: '#0a66c2' },
  { key: 'indeed',          label: 'Indeed',           color: '#2557a7' },
  { key: 'greenhouse',      label: 'Greenhouse',       color: '#22c55e' },
  { key: 'lever',           label: 'Lever',            color: '#3b82f6' },
  { key: 'ashby',           label: 'Ashby',            color: '#8b5cf6' },
  { key: 'workday',         label: 'Workday',          color: '#f59e0b' },
  { key: 'smartrecruiters', label: 'SmartRecruiters',  color: '#ef4444' },
  { key: 'workable',        label: 'Workable',         color: '#06b6d4' },
  { key: 'icims',           label: 'iCIMS',            color: '#6366f1' },
  { key: 'jobvite',         label: 'Jobvite',          color: '#f97316' },
  { key: 'bamboohr',        label: 'BambooHR',         color: '#10b981' },
  { key: 'rippling',        label: 'Rippling',         color: '#ec4899' },
  { key: 'dover',           label: 'Dover',            color: '#64748b' },
  { key: 'pinpoint',        label: 'Pinpoint',         color: '#0ea5e9' },
];

const COVER_LETTER = `Dear Hiring Manager,

I am writing to express my interest in the Frontend Developer position at your organization.

I have 3+ years of experience in frontend development, working extensively with React.js, Next.js, TypeScript, JavaScript, and Redux Toolkit. In my current role at Plutos One, I lead frontend development for SaaS and banking platforms, where I have developed 30+ enterprise application pages and dashboards and worked extensively on REST API integrations, payment gateway integrations, and frontend performance optimization.

I also have hands-on experience with Tailwind CSS, ShadCN UI, MUI, responsive UI development, and working with Node.js/Express backend teams in a microservices environment.

I have attached my updated resume for your consideration. I would appreciate the opportunity to discuss how my experience can contribute to your team.

Looking forward to hearing from you.

Best Regards,
Satish Kumar Chaubey
Frontend Engineer
+91 8299805407
satishchaubey02@gmail.com
Ghaziabad, Uttar Pradesh`;

// ─── Styles ───────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: '#1e293b',
    padding: '2rem 1.5rem',
  } as React.CSSProperties,
  container: { maxWidth: '1150px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' } as React.CSSProperties,
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  } as React.CSSProperties,
  heroCard: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    borderRadius: '20px',
    padding: '2rem 2rem 1.5rem',
    color: 'white',
    boxShadow: '0 8px 32px rgba(79, 70, 229, 0.25)',
  } as React.CSSProperties,
  label: { fontSize: '0.78rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' } as React.CSSProperties,
  input: {
    width: '100%', padding: '0.65rem 1rem', borderRadius: '10px',
    border: '1.5px solid #e2e8f0', fontSize: '0.95rem', color: '#1e293b',
    background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: 'white', border: 'none', borderRadius: '10px',
    padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '0.9rem',
    cursor: 'pointer', transition: 'opacity 0.2s, transform 0.15s',
  } as React.CSSProperties,
  btnGreen: {
    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
    background: '#10b981', color: 'white', border: 'none', borderRadius: '8px',
    padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.8rem',
    cursor: 'pointer', transition: 'opacity 0.2s',
  } as React.CSSProperties,
  btnOutline: {
    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
    background: 'transparent', color: '#4f46e5', border: '1.5px solid #4f46e5',
    borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600,
    fontSize: '0.8rem', cursor: 'pointer',
  } as React.CSSProperties,
  platformPill: (active: boolean, color: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem',
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
    border: `1.5px solid ${active ? color : '#e2e8f0'}`,
    background: active ? `${color}15` : '#f8fafc',
    color: active ? color : '#64748b',
    userSelect: 'none',
  }),
  resultCard: (selected: boolean, sent: boolean): React.CSSProperties => ({
    background: sent ? '#f0fdf4' : selected ? '#f5f3ff' : '#ffffff',
    borderRadius: '14px',
    border: `1.5px solid ${sent ? '#86efac' : selected ? '#c7d2fe' : '#e2e8f0'}`,
    padding: '1.25rem',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  }),
  platformBadge: (color: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
    fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem',
    borderRadius: '999px', background: `${color}18`, color: color,
    letterSpacing: '0.03em', textTransform: 'uppercase',
  }),
};

// ─── Component ────────────────────────────────────────────────
export const AIHunt: React.FC = () => {
  const [position, setPosition] = useState('Frontend Developer');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin', 'indeed', 'greenhouse', 'lever', 'ashby', 'workday', 'workable']);
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [exaKey, setExaKey] = useState(() => localStorage.getItem('exaApiKey') || '');
  const [smtpUser] = useState('satishchaubey02@gmail.com');
  const [smtpPass] = useState('gngb uynz nssm mgkz');

  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<HuntResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [searchMsg, setSearchMsg] = useState('');

  // Per-card state
  const [editEmails, setEditEmails] = useState<Record<string, string>>({});
  const [sendStatus, setSendStatus] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});
  const [sendLog, setSendLog] = useState<Record<string, string>>({});

  // Batching state
  const [batches, setBatches] = useState<EmailBatch[]>([]);
  const [sendingBatchNum, setSendingBatchNum] = useState<number | null>(null);
  const [batchLogs, setBatchLogs] = useState<Record<number, string>>({});
  const [processedBatches, setProcessedBatches] = useState<Record<number, boolean>>({});
  const [sendingAllBatches, setSendingAllBatches] = useState(false);


  const togglePlatform = (key: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(r => r.id)));
    }
  };

  const handleSearch = async () => {
    if (!position.trim()) { setError('Position name is required.'); return; }
    if (selectedPlatforms.length === 0) { setError('Select at least one platform.'); return; }
    setError('');
    setSearchMsg('');
    setResults([]);
    setSelectedIds(new Set());
    setBatches([]);
    setSendStatus({});
    setSendLog({});
    setBatchLogs({});
    setProcessedBatches({});
    setEditEmails({});
    setSearching(true);

    try {
      const res = await fetch(`${getApiBase()}/api/ai-hunt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position,
          platforms: selectedPlatforms,
          exaApiKey: exaKey,
          geminiApiKey: geminiKey
        }),
      });

      const data = await res.json();
      if (!data.success) { setError(data.message || 'Search failed.'); }
      else {
        const resList: HuntResult[] = data.results || [];
        setResults(resList);
        // Auto select all results
        setSelectedIds(new Set(resList.map(r => r.id)));
        if (data.message) setSearchMsg(data.message);

        // Auto create 10-email batches
        createBatches(resList, new Set(resList.map(r => r.id)));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  };

  const createBatches = (resList: HuntResult[], selectedSet: Set<string>) => {
    const activeResults = resList.filter(r => selectedSet.has(r.id));
    const newBatches: EmailBatch[] = [];
    const chunkSize = 10;
    for (let i = 0; i < activeResults.length; i += chunkSize) {
      newBatches.push({
        batchNum: newBatches.length + 1,
        items: activeResults.slice(i, i + chunkSize)
      });
    }
    setBatches(newBatches);
    setProcessedBatches({});
    setBatchLogs({});
  };

  const handleGenerateBatchesClick = () => {
    createBatches(results, selectedIds);
  };

  const getEmail = (r: HuntResult) => editEmails[r.id] ?? r.hrEmail;

  const sendOne = async (r: HuntResult): Promise<boolean> => {
    const email = getEmail(r);
    setSendStatus(p => ({ ...p, [r.id]: 'sending' }));
    setSendLog(p => ({ ...p, [r.id]: `Sending to ${email}...` }));
    try {
      const resp = await fetch(`${getApiBase()}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpUser, smtpPass,
          to: email,
          subject: `${position} Application - Satish Kumar Chaubey`,
          body: COVER_LETTER,
        }),
      });
      const d = await resp.json();
      if (d.success) {
        setSendStatus(p => ({ ...p, [r.id]: 'sent' }));
        setSendLog(p => ({ ...p, [r.id]: `✅ Sent to ${email}` }));
        return true;
      } else {
        setSendStatus(p => ({ ...p, [r.id]: 'error' }));
        setSendLog(p => ({ ...p, [r.id]: `❌ Failed: ${d.message}` }));
        return false;
      }
    } catch (e: any) {
      setSendStatus(p => ({ ...p, [r.id]: 'error' }));
      setSendLog(p => ({ ...p, [r.id]: `❌ Error: ${e.message}` }));
      return false;
    }
  };

  const handleSendBatch = async (batchIdx: number) => {
    const batch = batches[batchIdx];
    if (!batch || batch.items.length === 0) return;

    setSendingBatchNum(batch.batchNum);
    setBatchLogs(p => ({ ...p, [batch.batchNum]: `Sending batch ${batch.batchNum} (${batch.items.length} emails)...` }));

    let successCount = 0;
    let failCount = 0;

    for (const item of batch.items) {
      const ok = await sendOne(item);
      if (ok) successCount++;
      else failCount++;
      await new Promise(r => setTimeout(r, 600)); // 0.6s delay
    }

    setProcessedBatches(p => ({ ...p, [batch.batchNum]: true }));
    setBatchLogs(p => ({
      ...p,
      [batch.batchNum]: `✅ Batch ${batch.batchNum} completed! ${successCount} sent ${failCount > 0 ? `(${failCount} failed)` : ''}`
    }));
    setSendingBatchNum(null);
  };

  const handleSendAllBatches = async () => {
    setSendingAllBatches(true);
    for (let i = 0; i < batches.length; i++) {
      if (!processedBatches[batches[i].batchNum]) {
        await handleSendBatch(i);
      }
    }
    setSendingAllBatches(false);
  };

  const resultPlatformColor = (platform: string) =>
    PLATFORMS.find(p => p.label === platform)?.color || '#4f46e5';

  const sentCount = Object.values(sendStatus).filter(s => s === 'sent').length;

  return (
    <div style={S.page}>
      <div style={S.container}>

        {/* ── Hero Header ── */}
        <div style={S.heroCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '10px' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>AI Multi-Platform Job &amp; Recruiter Hunter</h1>
              <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: '0.1rem 0 0' }}>
                Search position across LinkedIn, Indeed, Greenhouse, Lever &amp; Ashby → Auto-extract HR emails → Create 10-email Batches → One-click Send!
              </p>
            </div>
          </div>
          {results.length > 0 && (
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Found Leads', val: results.length, color: 'rgba(255,255,255,0.9)' },
                { label: 'Selected', val: selectedIds.size, color: '#c7d2fe' },
                { label: '10-Email Batches', val: batches.length, color: '#fde68a' },
                { label: 'Mails Sent', val: sentCount, color: '#86efac' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.85, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Search Config Panel ── */}
        <div style={S.card}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} style={{ color: '#4f46e5' }} /> Search Position &amp; Target Platforms
          </h2>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
            <div style={{ flex: 2, minWidth: '220px' }}>
              <label style={S.label}>Job Position / Designation</label>
              <input
                type="text"
                value={position}
                onChange={e => setPosition(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. Frontend Developer, React Engineer..."
                style={{ ...S.input, fontSize: '1rem', fontWeight: 600 }}
              />
            </div>

            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={S.label}>Gemini API Key (Recommended)</label>
              <input
                type="password"
                value={geminiKey}
                onChange={e => { setGeminiKey(e.target.value); localStorage.setItem('geminiApiKey', e.target.value); }}
                placeholder="AIzaSy... — Google Gemini API Key"
                style={{ ...S.input, fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={S.label}>Exa.ai API Key (Optional)</label>
              <input
                type="password"
                value={exaKey}
                onChange={e => { setExaKey(e.target.value); localStorage.setItem('exaApiKey', e.target.value); }}
                placeholder="AQ.xxxxx — free key at exa.ai"
                style={{ ...S.input, fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>


            <button
              style={{ ...S.btnPrimary, height: '44px', padding: '0 2rem', opacity: searching ? 0.7 : 1, minWidth: '160px' }}
              onClick={handleSearch}
              disabled={searching}
            >
              {searching ? <><Loader2 size={16} className="animate-spin" /> Fetching...</> : <><Search size={16} /> Search Position</>}
            </button>
          </div>

          {/* Platform Toggles */}
          <label style={S.label}>Select Job &amp; ATS Platforms</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              style={{ ...S.platformPill(selectedPlatforms.length === PLATFORMS.length, '#4f46e5') }}
              onClick={() => setSelectedPlatforms(
                selectedPlatforms.length === PLATFORMS.length ? [] : PLATFORMS.map(p => p.key)
              )}
            >
              All Platforms
            </button>
            {PLATFORMS.map(p => (
              <button
                key={p.key}
                style={S.platformPill(selectedPlatforms.includes(p.key), p.color)}
                onClick={() => togglePlatform(p.key)}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                {p.label}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', color: '#dc2626', fontSize: '0.85rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {searchMsg && !error && (
            <div style={{ marginTop: '1rem', background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '0.75rem 1rem', color: '#854d0e', fontSize: '0.85rem' }}>
              {searchMsg}
            </div>
          )}
        </div>

        {/* ── Discovered Leads Section ── */}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: '#fff', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  📋 Discovered Job Leads ({results.length})
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                  {selectedIds.size} selected · Click email pills or edit directly below
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={{ ...S.btnOutline }}
                  onClick={toggleSelectAll}
                >
                  <Filter size={14} />
                  {selectedIds.size === results.length ? 'Deselect All' : 'Select All'}
                </button>

                <button
                  type="button"
                  style={{ ...S.btnPrimary, background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  onClick={handleGenerateBatchesClick}
                  disabled={selectedIds.size === 0}
                >
                  <Layers size={15} /> Create 10-Email Batches ({Math.ceil(selectedIds.size / 10)})
                </button>
              </div>
            </div>

            {/* Leads List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {results.map((r) => {
                const status = sendStatus[r.id] || 'idle';
                const isSent = status === 'sent';
                const isSending = status === 'sending';
                const isSelected = selectedIds.has(r.id);
                const color = resultPlatformColor(r.platform);
                const email = getEmail(r);


                return (
                  <div key={r.id} style={S.resultCard(isSelected, isSent)}>
                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>

                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(r.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: isSelected ? '#4f46e5' : '#94a3b8', flexShrink: 0, marginTop: '0.2rem' }}
                      >
                        {isSelected ? <CheckSquare size={20} /> : <SquareIcon size={20} />}
                      </button>

                      {/* Company Icon */}
                      <div style={{ width: 42, height: 42, borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={20} style={{ color }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                          <span style={S.platformBadge(color)}>{r.platform}</span>
                          {r.isGuessed && (
                            <span style={{ fontSize: '0.65rem', background: '#fef9c3', color: '#854d0e', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 600 }}>
                              ⚡ Verified Domain Pattern
                            </span>
                          )}
                          {isSent && <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#15803d', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 600 }}>✅ Sent</span>}
                        </div>

                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.15rem' }}>
                          {r.company}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.4rem' }}>
                          {r.title}
                        </div>

                        {/* Editable Email Input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '450px' }}>
                          <Mail size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                          <input
                            type="email"
                            value={email}
                            onChange={e => setEditEmails(p => ({ ...p, [r.id]: e.target.value }))}
                            style={{ ...S.input, padding: '0.3rem 0.6rem', fontSize: '0.8rem', fontFamily: 'monospace', color: '#4f46e5', background: '#f8f5ff', border: '1px solid #e0e7ff', flex: 1 }}
                          />
                          <Edit3 size={12} style={{ color: '#c7d2fe', flexShrink: 0 }} />
                        </div>

                        {/* Candidate Email Suggestions */}
                        {r.candidateEmails && r.candidateEmails.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                            {r.candidateEmails.map(cEmail => (
                              <button
                                key={cEmail}
                                type="button"
                                onClick={() => setEditEmails(p => ({ ...p, [r.id]: cEmail }))}
                                style={{
                                  fontSize: '0.68rem',
                                  fontFamily: 'monospace',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                  border: '1px solid #e0e7ff',
                                  background: email === cEmail ? '#4f46e5' : '#ffffff',
                                  color: email === cEmail ? '#ffffff' : '#4f46e5',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {cEmail}
                              </button>
                            ))}
                          </div>
                        )}

                        {sendLog[r.id] && (
                          <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: isSent ? '#15803d' : '#dc2626', fontWeight: 500 }}>
                            {sendLog[r.id]}
                          </div>
                        )}
                      </div>

                      {/* Right Action buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end', flexShrink: 0 }}>
                        <button
                          type="button"
                          style={{
                            ...S.btnGreen,
                            background: isSent ? '#86efac' : isSending ? '#6ee7b7' : '#10b981',
                            opacity: isSending || sendingAllBatches ? 0.7 : 1,
                            minWidth: '90px', justifyContent: 'center'
                          }}
                          onClick={() => sendOne(r)}
                          disabled={isSending || sendingAllBatches}
                        >
                          {isSending ? <><Loader2 size={13} className="animate-spin" /> Sending</> :
                           isSent ? <><CheckCircle2 size={13} /> Resend</> :
                           <><Send size={13} /> Send</>}
                        </button>

                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#4f46e5', textDecoration: 'none', fontWeight: 500 }}
                        >
                          <ExternalLink size={11} /> View Job
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 10-Email Batches Panel ── */}
        {batches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                  🚀 Batches Created — {batches.length} Batches (10 Emails / Batch)
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                  {batches.reduce((sum, b) => sum + b.items.length, 0)} total leads ready · Auto-attaches your resume PDF
                </p>
              </div>

              <button
                type="button"
                style={{ ...S.btnPrimary, background: 'linear-gradient(135deg, #10b981, #059669)', padding: '0.75rem 1.75rem' }}
                onClick={handleSendAllBatches}
                disabled={sendingAllBatches || sendingBatchNum !== null}
              >
                {sendingAllBatches ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending All Batches...</>
                ) : (
                  <><Play size={16} /> Send All {batches.length} Batches (Auto-Pilot)</>
                )}
              </button>
            </div>

            {/* Batch Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {batches.map((batch, idx) => {
                const isProcessed = processedBatches[batch.batchNum];
                const isSending = sendingBatchNum === batch.batchNum;

                return (
                  <div
                    key={batch.batchNum}
                    style={{
                      background: isProcessed ? '#f0fdf4' : '#ffffff',
                      borderRadius: '14px',
                      border: `1.5px solid ${isProcessed ? '#86efac' : '#e2e8f0'}`,
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>Batch {batch.batchNum}</span>
                        <span style={{ fontSize: '0.72rem', background: '#e0e7ff', color: '#4f46e5', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                          {batch.items.length} Mails
                        </span>
                      </div>

                      {isProcessed && (
                        <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <CheckCircle2 size={14} /> Completed
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '160px', overflowY: 'auto' }}>
                      {batch.items.map((item) => {
                        const itemEmail = getEmail(item);
                        return (
                          <div key={item.id} style={{ fontSize: '0.76rem', fontFamily: 'monospace', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                              {itemEmail}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                              {item.company.substring(0, 15)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {batchLogs[batch.batchNum] && (
                      <div style={{ fontSize: '0.75rem', color: isProcessed ? '#15803d' : '#4f46e5', fontWeight: 600 }}>
                        {batchLogs[batch.batchNum]}
                      </div>
                    )}

                    <button
                      type="button"
                      style={{
                        ...S.btnPrimary,
                        justifyContent: 'center',
                        background: isProcessed ? '#10b981' : undefined,
                        opacity: isSending || sendingAllBatches ? 0.7 : 1
                      }}
                      onClick={() => handleSendBatch(idx)}
                      disabled={isSending || sendingAllBatches}
                    >
                      {isSending ? (
                        <><Loader2 size={14} className="animate-spin" /> Sending Batch {batch.batchNum}...</>
                      ) : isProcessed ? (
                        <><CheckCircle2 size={14} /> Resend Batch {batch.batchNum}</>
                      ) : (
                        <><Send size={14} /> Send Batch {batch.batchNum}</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty searching state ── */}
        {searching && (
          <div style={{ ...S.card, textAlign: 'center', padding: '3rem' }}>
            <Zap size={40} style={{ color: '#4f46e5', marginBottom: '1rem' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
              Hunting live for "{position}" openings...
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Searching LinkedIn, Indeed, Greenhouse, Lever, Ashby, Workday &amp; extracting HR emails
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5', animation: `bounce 0.8s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
