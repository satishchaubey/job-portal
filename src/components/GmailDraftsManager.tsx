import React, { useState, useEffect, useMemo } from 'react';
import { Mail, RefreshCw, Send, Loader2, FileText, Calendar, User, Search, ExternalLink, CheckCircle2, Copy, CheckSquare, Square, Share2, Trash2, Clock, CalendarDays, Inbox } from 'lucide-react';
import { toast } from '../toast';
import { getApiBase } from '../config';

export interface GmailDraft {
  id: number;
  to: string;
  subject: string;
  body: string;
  date: string;
}

interface GmailDraftsManagerProps {
  initialFolder?: 'drafts' | 'sent';
}

export const GmailDraftsManager: React.FC<GmailDraftsManagerProps> = ({ initialFolder = 'drafts' }) => {
  const [smtpUser, setSmtpUser] = useState(() => localStorage.getItem('sheetSync_smtpUser') || 'satishchaubey02@gmail.com');
  const [smtpPass, setSmtpPass] = useState(() => localStorage.getItem('sheetSync_smtpPass') || 'gngb uynz nssm mgkz');
  
  const [drafts, setDrafts] = useState<GmailDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<'drafts' | 'sent'>(initialFolder);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sentIds, setSentIds] = useState<Record<number, boolean>>({});
  const [selectedDraft, setSelectedDraft] = useState<GmailDraft | null>(null);

  // Date Category Filter: 'yesterday' (default for sent) | 'today' | 'older' | 'all' | 'custom'
  const [dateFilter, setDateFilter] = useState<'yesterday' | 'all' | 'today' | 'older' | 'custom'>(initialFolder === 'sent' ? 'yesterday' : 'all');
  
  // Custom Date Picker value YYYY-MM-DD (Default to yesterday's date)
  const [customDate, setCustomDate] = useState<string>(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Bulk selection & Email extraction state
  const [selectedDraftIds, setSelectedDraftIds] = useState<number[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailExportFormat, setEmailExportFormat] = useState<'newline' | 'csv'>('newline');

  // Fetch drafts or sent mails directly from backend IMAP endpoint
  const handleFetchDrafts = async (folderType: 'drafts' | 'sent' = currentFolder) => {
    if (!smtpUser.trim() || !smtpPass.trim()) {
      toast.error('Please enter your Gmail credentials first!');
      return;
    }

    setLoading(true);
    setCurrentFolder(folderType);
    localStorage.setItem('sheetSync_smtpUser', smtpUser.trim());
    localStorage.setItem('sheetSync_smtpPass', smtpPass.trim());

    try {
      const res = await fetch(`${getApiBase()}/api/fetch-drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim(),
          folderType: folderType
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDrafts(data.drafts || []);
        setSelectedDraftIds([]);
        const label = folderType === 'sent' ? 'already sent emails from Gmail Sent Box' : 'saved drafts';
        toast.success(`📥 Synced ${data.count} ${label} from IMAP history!`);
      } else {
        toast.error(`❌ Failed to fetch emails: ${data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`❌ Error connecting to backend: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Sync when initialFolder prop changes or on initial load
  useEffect(() => {
    setCurrentFolder(initialFolder);
    setDateFilter(initialFolder === 'sent' ? 'yesterday' : 'all');
    handleFetchDrafts(initialFolder);
  }, [initialFolder]);

  // Send a specific draft via SMTP
  const handleSendDraft = async (draft: GmailDraft) => {
    if (!draft.to || draft.to === '(no recipient)') {
      toast.error('Cannot send draft: No recipient email specified.');
      return;
    }

    setSendingId(draft.id);
    toast.info(`🚀 Sending email to ${draft.to}...`);

    try {
      const res = await fetch(`${getApiBase()}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim(),
          to: draft.to,
          subject: draft.subject,
          body: draft.body
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSentIds(prev => ({ ...prev, [draft.id]: true }));
        toast.success(`✅ Email successfully sent to ${draft.to}!`);
      } else {
        toast.error(`❌ Failed to send: ${data.message}`);
      }
    } catch (err: any) {
      toast.error(`❌ Error sending email: ${err.message}`);
    } finally {
      setSendingId(null);
    }
  };

  // Open in Gmail Web Compose Tab
  const handleOpenInGmail = (draft: GmailDraft) => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(draft.to !== '(no recipient)' ? draft.to : '')}&su=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
    window.open(gmailUrl, '_blank');
  };

  // Check if a date string corresponds to today's date
  const isTodayDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      return d.getDate() === now.getDate() &&
             d.getMonth() === now.getMonth() &&
             d.getFullYear() === now.getFullYear();
    } catch (_) {
      return false;
    }
  };

  // Check if a date string corresponds to yesterday's date (1 day ago)
  const isYesterdayDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      return d.getDate() === yesterday.getDate() &&
             d.getMonth() === yesterday.getMonth() &&
             d.getFullYear() === yesterday.getFullYear();
    } catch (_) {
      return false;
    }
  };

  // Check if a date string matches chosen YYYY-MM-DD
  const matchesSelectedDate = (isoString: string, targetDateYMD: string): boolean => {
    if (!isoString || !targetDateYMD) return false;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return false;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}` === targetDateYMD;
    } catch (_) {
      return false;
    }
  };

  // Draft counts by date category
  const todayCount = useMemo(() => drafts.filter(d => isTodayDate(d.date)).length, [drafts]);
  const yesterdayCount = useMemo(() => drafts.filter(d => isYesterdayDate(d.date)).length, [drafts]);
  const olderCount = useMemo(() => drafts.filter(d => !isTodayDate(d.date)).length, [drafts]);
  const customCount = useMemo(() => drafts.filter(d => matchesSelectedDate(d.date, customDate)).length, [drafts, customDate]);

  // Filter drafts by search term AND date category
  const filteredDrafts = useMemo(() => {
    return drafts.filter(d => {
      const matchesSearch =
        d.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.body.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (dateFilter === 'yesterday') return isYesterdayDate(d.date); // Exactly 1 day ago (Yesterday only)
      if (dateFilter === 'today') return isTodayDate(d.date);
      if (dateFilter === 'older') return !isTodayDate(d.date); // Exclude today's date (all previous days)
      if (dateFilter === 'custom') return matchesSelectedDate(d.date, customDate); // Particular date filter
      return true;
    });
  }, [drafts, searchTerm, dateFilter, customDate]);

  // Helper to extract clean email address using regex
  const extractCleanEmail = (raw: string): string | null => {
    if (!raw || raw === '(no recipient)') return null;
    const match = raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0].toLowerCase() : null;
  };

  // Target drafts: selected drafts if checked, else all filtered drafts
  const targetDrafts = useMemo(() => {
    if (selectedDraftIds.length > 0) {
      return drafts.filter(d => selectedDraftIds.includes(d.id));
    }
    return filteredDrafts;
  }, [drafts, filteredDrafts, selectedDraftIds]);

  // Extract clean unique email list
  const extractedEmails = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();
    targetDrafts.forEach(d => {
      const email = extractCleanEmail(d.to);
      if (email && !seen.has(email)) {
        seen.add(email);
        list.push(email);
      }
    });
    return list;
  }, [targetDrafts]);

  // Helper to remove copied target drafts from list
  const removeCopiedDrafts = (targetList: GmailDraft[]) => {
    const targetIds = new Set(targetList.map(d => d.id));
    setDrafts(prev => prev.filter(d => !targetIds.has(d.id)));
    setSelectedDraftIds(prev => prev.filter(id => !targetIds.has(id)));
  };

  // Helper to remove single draft from list
  const removeSingleDraft = (id: number) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
    setSelectedDraftIds(prev => prev.filter(i => i !== id));
  };

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectedDraftIds.length === filteredDrafts.length) {
      setSelectedDraftIds([]);
    } else {
      setSelectedDraftIds(filteredDrafts.map(d => d.id));
    }
  };

  // Handle individual checkbox toggle
  const handleToggleSelect = (id: number) => {
    setSelectedDraftIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Copy extracted email addresses and remove from drafts list
  const handleCopyExtractedEmails = (format: 'newline' | 'csv') => {
    if (extractedEmails.length === 0) {
      toast.warn('No valid recipient email addresses found.');
      return;
    }
    const text = format === 'csv' ? extractedEmails.join(', ') : extractedEmails.join('\n');
    navigator.clipboard.writeText(text);

    // Auto-remove copied drafts from view list
    const count = targetDrafts.length;
    removeCopiedDrafts(targetDrafts);

    toast.success(`📋 Copied ${extractedEmails.length} email addresses (${format === 'csv' ? 'Comma' : 'Line by line'}) & removed ${count} items from list!`);
  };

  // Export emails directly to Bulk Mailer with specified campaign type ('fresh' | 'followup')
  const handleSendToBulkMailer = (campaignType: 'fresh' | 'followup' = (currentFolder === 'sent' ? 'followup' : 'fresh')) => {
    if (extractedEmails.length === 0) {
      toast.warn('No valid recipient emails to export.');
      return;
    }
    const text = extractedEmails.join('\n');
    localStorage.setItem('sheetSync_bulkPastedEmails', text);
    localStorage.setItem('sheetSync_campaignType', campaignType);
    navigator.clipboard.writeText(text);

    // Auto-remove copied drafts from view list
    const count = targetDrafts.length;
    removeCopiedDrafts(targetDrafts);

    const modeName = campaignType === 'followup' ? 'Follow-Up' : 'Fresh Outreach';
    toast.success(`🚀 Exported ${extractedEmails.length} emails to ${modeName} Bulk Mailer & removed ${count} items!`);
    
    // Navigate to Bulk Mailer page
    const repoBase = window.location.pathname.startsWith('/job-portal') ? '/job-portal' : '';
    window.history.pushState({}, '', `${repoBase}/bulk-paste`);
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ background: currentFolder === 'sent' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)', borderColor: currentFolder === 'sent' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.65rem', borderRadius: '12px', background: currentFolder === 'sent' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)', color: currentFolder === 'sent' ? '#d97706' : '#6366f1' }}>
              {currentFolder === 'sent' ? <Send size={26} /> : <FileText size={26} />}
            </div>
            <div>
              <h2 className="upload-title" style={{ fontSize: '1.4rem', marginBottom: '0.15rem' }}>
                {currentFolder === 'sent' ? 'Gmail Sent Mail History' : 'Gmail Saved Drafts Manager'}
              </h2>
              <p className="upload-hint" style={{ marginBottom: 0 }}>
                {currentFolder === 'sent'
                  ? <>Fetch recruiter emails sent <b>1 day ago (Yesterday)</b> from <b>satishchaubey02@gmail.com</b> for Follow-Up outreach.</>
                  : <>Fetch and extract recipient email addresses from unsent drafts in <b>satishchaubey02@gmail.com</b>.</>}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.06)', padding: '0.3rem', borderRadius: '12px' }}>
            <button
              type="button"
              className={currentFolder === 'drafts' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => {
                setDateFilter('all');
                handleFetchDrafts('drafts');
              }}
              disabled={loading}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', border: 'none' }}
            >
              {loading && currentFolder === 'drafts' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Gmail Drafts
            </button>

            <button
              type="button"
              className={currentFolder === 'sent' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => {
                setDateFilter('yesterday');
                handleFetchDrafts('sent');
              }}
              disabled={loading}
              style={{
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
                border: 'none',
                background: currentFolder === 'sent' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : undefined,
                color: currentFolder === 'sent' ? '#ffffff' : undefined
              }}
            >
              {loading && currentFolder === 'sent' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Previous Sent Mails
            </button>
          </div>
        </div>
      </div>

      {/* Control & Date Category Filter Panel */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="modal-label" style={{ fontSize: '0.75rem' }}>Sender Gmail Address</label>
            <input
              type="email"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '0.75rem', fontSize: '0.82rem' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="modal-label" style={{ fontSize: '0.75rem' }}>Gmail App Password</label>
            <input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '0.75rem', fontSize: '0.82rem' }}
            />
          </div>

          <div style={{ flex: 1.5, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="modal-label" style={{ fontSize: '0.75rem' }}>Search Mails</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by recipient email or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '2.2rem', fontSize: '0.82rem' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        {/* Date Category Filter Switcher Tabs + Custom Date Picker */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={15} style={{ color: '#6366f1' }} /> Filter Mails By Date:
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Yesterday Only (1 Day Ago) - DEFAULT */}
            <button
              type="button"
              className={dateFilter === 'yesterday' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setDateFilter('yesterday')}
              style={{ 
                fontSize: '0.78rem', 
                padding: '0.35rem 0.85rem',
                background: dateFilter === 'yesterday' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : undefined,
                color: dateFilter === 'yesterday' ? '#ffffff' : undefined,
                fontWeight: dateFilter === 'yesterday' ? 700 : 500
              }}
            >
              ⏪ Yesterday Only (1 Day Ago: {yesterdayCount})
            </button>

            <button
              type="button"
              className={dateFilter === 'older' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setDateFilter('older')}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
            >
              📅 All Previous Days ({olderCount})
            </button>

            <button
              type="button"
              className={dateFilter === 'all' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setDateFilter('all')}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
            >
              🌟 All Mails ({drafts.length})
            </button>

            <button
              type="button"
              className={dateFilter === 'today' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setDateFilter('today')}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
            >
              ☀️ Today ({todayCount})
            </button>

            {/* Custom Particular Date Selector */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.35rem', 
                background: dateFilter === 'custom' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(0, 0, 0, 0.05)', 
                padding: '0.2rem 0.6rem', 
                borderRadius: '10px', 
                border: dateFilter === 'custom' ? '1px solid #6366f1' : '1px solid var(--border-color)',
                transition: 'all 0.2s ease'
              }}
            >
              <CalendarDays size={14} style={{ color: dateFilter === 'custom' ? '#6366f1' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: dateFilter === 'custom' ? '#6366f1' : 'var(--text-secondary)' }}>
                Pick Date:
              </span>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setDateFilter('custom');
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.78rem',
                  color: dateFilter === 'custom' ? '#6366f1' : 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              />
              {dateFilter === 'custom' && (
                <span style={{ fontSize: '0.72rem', background: '#6366f1', color: '#fff', padding: '0.1rem 0.45rem', borderRadius: '6px', fontWeight: 700 }}>
                  {customCount} Mails
                </span>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Bulk Email Extraction & Export Bar */}
      {drafts.length > 0 && (
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)', borderColor: 'rgba(16, 185, 129, 0.25)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <Mail size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Extracted Recipient Emails ({extractedEmails.length})
                  {selectedDraftIds.length > 0 && (
                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 600 }}>
                      {selectedDraftIds.length} Selected Items
                    </span>
                  )}
                  {dateFilter === 'yesterday' && (
                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontWeight: 700 }}>
                      Yesterday Only (1 Day Ago)
                    </span>
                  )}
                  {dateFilter === 'custom' && (
                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', fontWeight: 700 }}>
                      Particular Date: {customDate}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Extract recipient emails from {dateFilter === 'yesterday' ? 'yesterday\'s sent emails (1 day ago)' : currentFolder === 'sent' ? 'previous sent emails' : 'saved drafts'} and export to <b>Fresh</b> or <b>Follow-Up</b> bulk campaigns.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSelectAll}
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
              >
                {selectedDraftIds.length === filteredDrafts.length && filteredDrafts.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
                {selectedDraftIds.length === filteredDrafts.length && filteredDrafts.length > 0 ? 'Deselect All' : `Select All (${filteredDrafts.length})`}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleCopyExtractedEmails('newline')}
                disabled={extractedEmails.length === 0}
                title="Copy emails line by line and remove copied items"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
              >
                <Copy size={14} />
                Copy & Remove
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowEmailModal(true)}
                disabled={extractedEmails.length === 0}
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
              >
                <FileText size={14} />
                View Raw List
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => handleSendToBulkMailer('fresh')}
                disabled={extractedEmails.length === 0}
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem', background: '#10b981', borderColor: '#10b981' }}
              >
                <Send size={14} />
                Fresh Bulk Mail →
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => handleSendToBulkMailer('followup')}
                disabled={extractedEmails.length === 0}
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderColor: '#f59e0b' }}
              >
                <RefreshCw size={14} />
                Follow-Up Bulk Mail →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drafts Grid List */}
      {loading ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: '#6366f1' }} />
          <p style={{ fontWeight: 600, fontSize: '1rem' }}>Connecting to Gmail IMAP ({currentFolder === 'sent' ? '[Gmail]/Sent Mail' : '[Gmail]/Drafts'})...</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fetching up to 1000 emails from Gmail IMAP history.</p>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Mail size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.4, color: '#6366f1' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>No Matching Mails Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {drafts.length === 0 
              ? `Click 'Sync ${currentFolder === 'sent' ? 'Previous Sent Mails' : 'Gmail Drafts'}' above to load emails.` 
              : dateFilter === 'yesterday'
              ? "No emails found sent yesterday (1 day ago)."
              : dateFilter === 'custom'
              ? `No emails found for particular date: ${customDate}`
              : dateFilter === 'older' 
              ? "No emails found from previous days (older than today)." 
              : dateFilter === 'today'
              ? "No emails found saved today."
              : "No emails match your search term or all items were extracted."}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleFetchDrafts(currentFolder)}
            style={{ margin: '1rem auto 0 auto', fontSize: '0.85rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          >
            <RefreshCw size={14} />
            Re-Sync All Gmail History ({currentFolder === 'sent' ? 'Sent Box' : 'Drafts'})
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentFolder === 'sent' 
                ? (dateFilter === 'yesterday' ? '📤 Gmail Sent Box (Yesterday\'s Mails - 1 Day Ago)' : dateFilter === 'custom' ? `📤 Gmail Sent Mails for Particular Date: ${customDate}` : dateFilter === 'older' ? '📤 Gmail Sent Box (Previous Days Mails)' : '📤 Gmail Sent Box Mails') 
                : '📄 Active Gmail Drafts'} ({filteredDrafts.length})
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Sorted by date (Newest first)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredDrafts.map((draft) => {
              const isSending = sendingId === draft.id;
              const isSent = sentIds[draft.id];
              const isSelected = selectedDraftIds.includes(draft.id);
              const cleanEmail = extractCleanEmail(draft.to);

              return (
                <div 
                  key={draft.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: isSelected ? 'rgba(99, 102, 241, 0.06)' : isSent ? 'rgba(16, 185, 129, 0.03)' : 'var(--bg-card)',
                    borderColor: isSelected ? '#6366f1' : isSent ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {/* Header line with Checkbox and Email */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(draft.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#6366f1' }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#818cf8', fontSize: '0.85rem', fontWeight: 600 }}>
                          <User size={14} />
                          <span style={{ wordBreak: 'break-all' }}>{draft.to}</span>
                          {cleanEmail && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(cleanEmail);
                                removeSingleDraft(draft.id);
                                toast.success(`📋 Copied email: ${cleanEmail} (Removed from list)`);
                              }}
                              title="Copy email address and remove from list"
                              style={{ border: 'none', background: 'transparent', padding: '0.1rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex' }}
                            >
                              <Copy size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                        <Calendar size={12} />
                        {new Date(draft.date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Subject */}
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: '1.3' }}>
                      {draft.subject}
                    </div>

                    {/* Body snippet */}
                    <div 
                      onClick={() => setSelectedDraft(draft)}
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        background: 'rgba(0, 0, 0, 0.15)',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        maxHeight: '90px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                        lineHeight: '1.45',
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {draft.body ? draft.body : '(Empty mail body)'}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleOpenInGmail(draft)}
                      title="Open in Gmail Web"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', justifyContent: 'center' }}
                    >
                      <ExternalLink size={13} />
                      Gmail
                    </button>

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        if (cleanEmail) {
                          navigator.clipboard.writeText(cleanEmail);
                          removeSingleDraft(draft.id);
                          toast.success(`📋 Copied email address & removed from list!`);
                        } else {
                          navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
                          removeSingleDraft(draft.id);
                          toast.success('📋 Copied mail & removed from list!');
                        }
                      }}
                      title="Copy email address & remove from list"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', justifyContent: 'center' }}
                    >
                      <Copy size={13} />
                      Copy & Remove
                    </button>

                    <button
                      type="button"
                      className={isSent ? 'btn-secondary' : 'btn-primary'}
                      onClick={() => handleSendDraft(draft)}
                      disabled={isSending}
                      style={{
                        flex: 1.2,
                        padding: '0.45rem',
                        fontSize: '0.75rem',
                        justifyContent: 'center',
                        background: isSent ? 'rgba(16, 185, 129, 0.15)' : '#6366f1',
                        borderColor: isSent ? 'rgba(16, 185, 129, 0.3)' : '#6366f1',
                        color: isSent ? '#10b981' : '#ffffff'
                      }}
                    >
                      {isSending ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Sending...
                        </>
                      ) : isSent ? (
                        <>
                          <CheckCircle2 size={13} />
                          Sent
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          Send Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extracted Emails Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Extracted Email Addresses</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Total {extractedEmails.length} recipient email addresses extracted.
                </p>
              </div>
              <button type="button" className="btn-secondary" onClick={() => setShowEmailModal(false)}>Close</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={emailExportFormat === 'newline' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setEmailExportFormat('newline')}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                >
                  Line by Line (\n)
                </button>
                <button
                  type="button"
                  className={emailExportFormat === 'csv' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setEmailExportFormat('csv')}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                >
                  Comma Separated (CSV)
                </button>
              </div>

              <textarea
                readOnly
                rows={10}
                value={emailExportFormat === 'csv' ? extractedEmails.join(', ') : extractedEmails.join('\n')}
                className="search-input"
                style={{ padding: '0.75rem', fontSize: '0.85rem', fontFamily: 'monospace', lineHeight: '1.4', resize: 'vertical' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    handleCopyExtractedEmails(emailExportFormat);
                    setShowEmailModal(false);
                  }}
                  style={{ padding: '0.55rem 1.2rem' }}
                >
                  <Copy size={16} />
                  Copy & Remove {extractedEmails.length} Emails
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal Preview */}
      {selectedDraft && (
        <div className="modal-overlay" onClick={() => setSelectedDraft(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Mail Preview</h3>
              <button type="button" className="btn-secondary" onClick={() => setSelectedDraft(null)}>Close</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="modal-label" style={{ fontSize: '0.75rem' }}>To Recipient:</label>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedDraft.to}</div>
              </div>

              <div>
                <label className="modal-label" style={{ fontSize: '0.75rem' }}>Subject:</label>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedDraft.subject}</div>
              </div>

              <div>
                <label className="modal-label" style={{ fontSize: '0.75rem' }}>Email Content:</label>
                <textarea
                  readOnly
                  rows={10}
                  value={selectedDraft.body}
                  className="search-input"
                  style={{ padding: '0.75rem', fontSize: '0.85rem', lineHeight: '1.4', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    removeSingleDraft(selectedDraft.id);
                    setSelectedDraft(null);
                    toast.info('🗑️ Item removed from list!');
                  }}
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <Trash2 size={14} />
                  Remove From List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
