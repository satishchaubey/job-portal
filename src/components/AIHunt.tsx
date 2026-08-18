import React, { useState } from 'react';
import {
  Search, Send, Loader2, CheckCircle2, AlertCircle, ExternalLink,
  Building2, Zap, Mail, Edit3, RefreshCw, ChevronDown, ChevronUp,
  Sparkles, Globe, Play, Square
} from 'lucide-react';
import { API_BASE } from '../config';

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


// ─── Platform definitions ─────────────────────────────────────
const PLATFORMS = [
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
  container: { maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' } as React.CSSProperties,
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  } as React.CSSProperties,
  heroCard: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    borderRadius: '20px',
    padding: '2rem 2rem 1.5rem',
    color: 'white',
    boxShadow: '0 8px 32px rgba(99,102,241,0.25)',
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
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
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
    background: 'transparent', color: '#6366f1', border: '1.5px solid #6366f1',
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
  resultCard: (sent: boolean): React.CSSProperties => ({
    background: sent ? '#f0fdf4' : '#ffffff',
    borderRadius: '14px',
    border: `1.5px solid ${sent ? '#86efac' : '#e2e8f0'}`,
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
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['greenhouse', 'lever', 'ashby', 'workday', 'workable']);
  const [exaKey, setExaKey] = useState(() => localStorage.getItem('exaApiKey') || '');
  const [smtpUser] = useState('satishchaubey02@gmail.com');
  const [smtpPass] = useState('gngb uynz nssm mgkz');

  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<HuntResult[]>([]);
  const [error, setError] = useState('');
  const [searchMsg, setSearchMsg] = useState('');

  // Per-card state
  const [editEmails, setEditEmails] = useState<Record<string, string>>({});
  const [sendStatus, setSendStatus] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});
  const [sendLog, setSendLog] = useState<Record<string, string>>({});

  // Send-all state
  const [sendingAll, setSendingAll] = useState(false);
  const [sendAllIdx, setSendAllIdx] = useState(-1);
  const [stopRequested, setStopRequested] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const togglePlatform = (key: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const handleSearch = async () => {
    if (!position.trim()) { setError('Position name is required.'); return; }
    if (selectedPlatforms.length === 0) { setError('Select at least one platform.'); return; }
    setError('');
    setSearchMsg('');
    setResults([]);
    setSendStatus({});
    setSendLog({});
    setEditEmails({});
    setSearching(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai-hunt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position, platforms: selectedPlatforms, exaApiKey: exaKey }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Search failed.'); }
      else {
        setResults(data.results || []);
        if (data.message) setSearchMsg(data.message);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  };

  const getEmail = (r: HuntResult) => editEmails[r.id] ?? r.hrEmail;

  const sendOne = async (r: HuntResult): Promise<boolean> => {
    const email = getEmail(r);
    setSendStatus(p => ({ ...p, [r.id]: 'sending' }));
    setSendLog(p => ({ ...p, [r.id]: `Sending to ${email}...` }));
    try {
      const resp = await fetch(`${API_BASE}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpUser, smtpPass,
          to: email,
          subject: `Frontend Developer Application - Satish Kumar Chaubey`,
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

  const handleSendAll = async () => {
    setSendingAll(true);
    setStopRequested(false);
    const pending = results.filter(r => sendStatus[r.id] !== 'sent');
    for (let i = 0; i < pending.length; i++) {
      if (stopRequested) break;
      setSendAllIdx(i);
      await sendOne(pending[i]);
      await new Promise(r => setTimeout(r, 1200)); // 1.2s delay between emails
    }
    setSendingAll(false);
    setSendAllIdx(-1);
  };

  const resultPlatformColor = (platform: string) =>
    PLATFORMS.find(p => p.label === platform)?.color || '#6366f1';

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
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>AI Job Hunter</h1>
              <p style={{ fontSize: '0.85rem', opacity: 0.85, margin: '0.1rem 0 0' }}>
                Powered by Exa.ai — searches Greenhouse, Lever, Ashby &amp; 9 more ATS platforms live
              </p>
            </div>
          </div>
          {results.length > 0 && (
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Found', val: results.length, color: 'rgba(255,255,255,0.9)' },
                { label: 'Sent', val: sentCount, color: '#86efac' },
                { label: 'Pending', val: results.length - sentCount, color: '#fde68a' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Search Config ── */}
        <div style={S.card}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} style={{ color: '#6366f1' }} /> Search Configuration
          </h2>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={S.label}>Job Position</label>
              <input
                type="text"
                value={position}
                onChange={e => setPosition(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. React Developer, Frontend Engineer..."
                style={{ ...S.input, fontSize: '1rem', fontWeight: 600 }}
              />
            </div>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={S.label}>Exa.ai API Key</label>
              <input
                type="password"
                value={exaKey}
                onChange={e => { setExaKey(e.target.value); localStorage.setItem('exaApiKey', e.target.value); }}
                placeholder="AQ.xxxxx — get free key at exa.ai"
                style={{ ...S.input, fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>
            <button
              style={{ ...S.btnPrimary, height: '44px', padding: '0 2rem', opacity: searching ? 0.7 : 1 }}
              onClick={handleSearch}
              disabled={searching}
            >
              {searching ? <><Loader2 size={16} className="animate-spin" /> Searching...</> : <><Search size={16} /> Search Live</>}
            </button>
          </div>

          {/* Platform Toggles */}
          <label style={S.label}>Platforms to Search</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              style={{ ...S.platformPill(selectedPlatforms.length === PLATFORMS.length, '#6366f1') }}
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

        {/* ── Results + Actions ── */}
        {results.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  {results.length} Job Listings Found
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                  Edit email if needed → Send individually or send all at once
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {sendingAll ? (
                  <button
                    style={{ ...S.btnOutline, borderColor: '#ef4444', color: '#ef4444' }}
                    onClick={() => setStopRequested(true)}
                  >
                    <Square size={14} /> Stop
                  </button>
                ) : (
                  <button
                    style={{ ...S.btnPrimary, background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    onClick={handleSendAll}
                    disabled={sentCount === results.length}
                  >
                    <Play size={15} /> Send All ({results.length - sentCount} pending)
                  </button>
                )}
                <button
                  style={{ ...S.btnOutline }}
                  onClick={handleSearch}
                >
                  <RefreshCw size={14} /> Re-search
                </button>
              </div>
            </div>

            {/* ── Progress bar ── */}
            {sendingAll && (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  <span>Sending {sendAllIdx + 1} of {results.filter(r => sendStatus[r.id] !== 'sent').length}...</span>
                  <span>{sentCount} sent total</span>
                </div>
                <div style={{ background: '#f1f5f9', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: '999px', width: `${(sentCount / results.length) * 100}%`, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )}

            {/* ── Result Cards ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.map((r) => {
                const status = sendStatus[r.id] || 'idle';
                const isSent = status === 'sent';
                const isSending = status === 'sending';
                const color = resultPlatformColor(r.platform);
                const email = getEmail(r);
                const isExpanded = expandedId === r.id;

                return (
                  <div key={r.id} style={S.resultCard(isSent)}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                      {/* Left: Company icon */}
                      <div style={{ width: 44, height: 44, borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={20} style={{ color }} />
                      </div>

                      {/* Center: Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                          <span style={S.platformBadge(color)}>{r.platform}</span>
                          {r.isGuessed && (
                            <span style={{ fontSize: '0.65rem', background: '#fef9c3', color: '#854d0e', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 600 }}>
                              ⚡ Guessed email
                            </span>
                          )}
                          {isSent && <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#15803d', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 600 }}>✅ Sent</span>}
                        </div>

                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.15rem' }}>
                          {r.company}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.5rem' }}>
                          {r.title}
                        </div>

                        {/* Editable email */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                  background: email === cEmail ? '#6366f1' : '#ffffff',
                                  color: email === cEmail ? '#ffffff' : '#6366f1',
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

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end', flexShrink: 0 }}>
                        <button
                          style={{
                            ...S.btnGreen,
                            background: isSent ? '#86efac' : isSending ? '#6ee7b7' : '#10b981',
                            opacity: isSending || sendingAll ? 0.7 : 1,
                            minWidth: '100px', justifyContent: 'center'
                          }}
                          onClick={() => sendOne(r)}
                          disabled={isSending || sendingAll}
                        >
                          {isSending ? <><Loader2 size={13} className="animate-spin" /> Sending</> :
                           isSent ? <><CheckCircle2 size={13} /> Resend</> :
                           <><Send size={13} /> Send</>}
                        </button>

                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}
                        >
                          <ExternalLink size={11} /> View Job
                        </a>

                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? 'Less' : 'Preview'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded: Cover letter preview */}
                    {isExpanded && (
                      <div style={{ marginTop: '1rem', background: '#f8fafc', borderRadius: '10px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Email Preview</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '0.35rem' }}>
                          To: {email} · Subject: Frontend Developer Application - Satish Kumar Chaubey
                        </div>
                        <pre style={{ fontSize: '0.78rem', color: '#334155', whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, maxHeight: '200px', overflowY: 'auto', lineHeight: 1.6 }}>
                          {COVER_LETTER}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Empty searching state ── */}
        {searching && (
          <div style={{ ...S.card, textAlign: 'center', padding: '3rem' }}>
            <Zap size={40} style={{ color: '#6366f1', marginBottom: '1rem' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>
              Searching live on {selectedPlatforms.length} platforms...
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Exa.ai is finding {position} openings on Greenhouse, Lever, Ashby &amp; more
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', animation: `bounce 0.8s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
