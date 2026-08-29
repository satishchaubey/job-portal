import React, { useState, useMemo, useEffect } from 'react';
import { Mail, CheckCircle2, Loader2, Paperclip, Send, Layers, Trash2, Play, FileText, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { toast } from '../toast';
import { getApiBase } from '../config';
import { ROLE_TEMPLATES, FRESH_TEMPLATE, FOLLOWUP_TEMPLATE, type RoleTemplate } from '../templates';
import { RoleSelector } from './RoleSelector';

export const BulkPasteMailer: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('frontend');
  const [campaignType, setCampaignType] = useState<'fresh' | 'followup'>(() => {
    const saved = localStorage.getItem('sheetSync_campaignType');
    return saved === 'followup' ? 'followup' : 'fresh';
  });

  const [rawText, setRawText] = useState(() => localStorage.getItem('sheetSync_bulkPastedEmails') || '');
  const [subject, setSubject] = useState(() => campaignType === 'followup' ? FOLLOWUP_TEMPLATE.subject : FRESH_TEMPLATE.subject);
  const [bodyTemplate, setBodyTemplate] = useState(() => campaignType === 'followup' ? FOLLOWUP_TEMPLATE.body : FRESH_TEMPLATE.body);

  const [smtpUser, setSmtpUser] = useState(() => localStorage.getItem('sheetSync_smtpUser') || 'satishchaubey02@gmail.com');
  const [smtpPass, setSmtpPass] = useState(() => localStorage.getItem('sheetSync_smtpPass') || 'gngb uynz nssm mgkz');
  
  const [processedBatches, setProcessedBatches] = useState<Record<number, boolean>>({});
  const [sendingBatchIndex, setSendingBatchIndex] = useState<number | null>(null);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [batchLogs, setBatchLogs] = useState<Record<number, string>>({});

  // Sync with campaignType saved in localStorage (e.g. set by GmailDraftsManager export)
  useEffect(() => {
    const saved = localStorage.getItem('sheetSync_campaignType');
    if (saved === 'followup') {
      setCampaignType('followup');
      setSubject(FOLLOWUP_TEMPLATE.subject);
      setBodyTemplate(FOLLOWUP_TEMPLATE.body);
    } else if (saved === 'fresh') {
      setCampaignType('fresh');
      setSubject(FRESH_TEMPLATE.subject);
      setBodyTemplate(FRESH_TEMPLATE.body);
    }
  }, []);

  const handleSwitchCampaignType = (type: 'fresh' | 'followup') => {
    setCampaignType(type);
    localStorage.setItem('sheetSync_campaignType', type);
    if (type === 'fresh') {
      setSubject(FRESH_TEMPLATE.subject);
      setBodyTemplate(FRESH_TEMPLATE.body);
      toast.info('✉️ Switched to Fresh Outreach Mail Template');
    } else {
      setSubject(FOLLOWUP_TEMPLATE.subject);
      setBodyTemplate(FOLLOWUP_TEMPLATE.body);
      toast.info('🔄 Switched to Follow-Up Reminder Mail Template');
    }
  };

  // Parse emails out of raw text input (handles newlines, commas, semicolons, spaces)
  const parsedEmails = useMemo(() => {
    if (!rawText.trim()) return [];
    
    // Regex matching valid emails
    const tokens = rawText.split(/[\s,;\n\r]+/);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const validEmails: string[] = [];
    const seen = new Set<string>();

    tokens.forEach(token => {
      const cleanToken = token.trim().toLowerCase().replace(/^["']|["']$/g, '');
      if (cleanToken && emailRegex.test(cleanToken) && !seen.has(cleanToken)) {
        seen.add(cleanToken);
        validEmails.push(cleanToken);
      }
    });

    return validEmails;
  }, [rawText]);

  // Group emails into batches of 10
  const batches = useMemo(() => {
    const chunkSize = 10;
    const result: string[][] = [];
    for (let i = 0; i < parsedEmails.length; i += chunkSize) {
      result.push(parsedEmails.slice(i, i + chunkSize));
    }
    return result;
  }, [parsedEmails]);

  // Toast when emails are pasted/extracted
  const [lastNotifiedCount, setLastNotifiedCount] = useState(0);
  useEffect(() => {
    if (parsedEmails.length > 0 && parsedEmails.length !== lastNotifiedCount) {
      setLastNotifiedCount(parsedEmails.length);
      toast.success(`📋 Loaded ${parsedEmails.length} email addresses into ${batches.length} bulk batches!`);
    }
  }, [parsedEmails.length, batches.length, lastNotifiedCount]);

  // Send a specific batch index
  const handleSendBatch = async (batchIdx: number) => {
    const targetEmails = batches[batchIdx];
    if (!targetEmails || targetEmails.length === 0) return;

    setSendingBatchIndex(batchIdx);
    setBatchLogs(prev => ({ ...prev, [batchIdx]: `Sending batch to ${targetEmails.length} recipients...` }));
    toast.info(`🚀 Starting batch ${batchIdx + 1} send (${targetEmails.length} recipients)...`);

    // Save SMTP credentials
    localStorage.setItem('sheetSync_smtpUser', smtpUser);
    localStorage.setItem('sheetSync_smtpPass', smtpPass);

    try {
      let successCount = 0;
      let failCount = 0;

      // Send to each email in the batch sequentially
      for (const email of targetEmails) {
        try {
          const res = await fetch(`${getApiBase()}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtpUser: smtpUser.trim(),
              smtpPass: smtpPass.trim(),
              to: email,
              subject: subject.trim(),
              body: bodyTemplate.trim()
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }

      setProcessedBatches(prev => ({ ...prev, [batchIdx]: true }));
      const logText = `Batch ${batchIdx + 1}: ${successCount} sent, ${failCount} failed.`;
      setBatchLogs(prev => ({ ...prev, [batchIdx]: logText }));

      if (successCount > 0) {
        toast.success(`✅ Batch ${batchIdx + 1} completed! ${successCount} sent, ${failCount} failed.`);
      } else {
        toast.error(`❌ Batch ${batchIdx + 1} failed for all recipients.`);
      }
    } catch (err: any) {
      setBatchLogs(prev => ({ ...prev, [batchIdx]: `Batch ${batchIdx + 1} error: ${err.message}` }));
      toast.error(`❌ Batch ${batchIdx + 1} error: ${err.message}`);
    } finally {
      setSendingBatchIndex(null);
    }
  };

  // Run all batches sequentially
  const handleSendAllBatches = async () => {
    if (batches.length === 0) return;
    setIsSendingAll(true);
    toast.info(`🚀 Processing all ${batches.length} bulk batches...`);

    for (let i = 0; i < batches.length; i++) {
      if (!processedBatches[i]) {
        await handleSendBatch(i);
      }
    }
    setIsSendingAll(false);
    toast.success(`🎉 All bulk batches processing completed!`);
  };

  // Open batch as Gmail web compose tabs
  const handleOpenBatchAsDrafts = (batchIdx: number) => {
    const targetEmails = batches[batchIdx];
    if (!targetEmails || targetEmails.length === 0) return;

    toast.info(`📝 Opening ${targetEmails.length} Gmail draft tabs for Batch ${batchIdx + 1}...`);
    targetEmails.forEach(email => {
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTemplate)}`;
      window.open(url, '_blank');
    });
  };

  // Open ALL parsed emails as Gmail web draft tabs
  const handleOpenAllAsDrafts = () => {
    if (parsedEmails.length === 0) return;
    toast.info(`📝 Opening ${parsedEmails.length} Gmail draft tabs...`);
    parsedEmails.forEach(email => {
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTemplate)}`;
      window.open(url, '_blank');
    });
  };

  // Clear raw input
  const handleClear = () => {
    setRawText('');
    localStorage.removeItem('sheetSync_bulkPastedEmails');
    setProcessedBatches({});
    setBatchLogs({});
    toast.info("Cleared raw text input.");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Layers size={24} />
          </div>
          <div>
            <h2 className="upload-title" style={{ fontSize: '1.4rem', marginBottom: '0.15rem' }}>Bulk Raw Email Batch Mailer</h2>
            <p className="upload-hint" style={{ marginBottom: 0 }}>
              Paste raw emails, choose <b>Fresh Outreach</b> or <b>Follow-Up</b> campaign mode, and send in automated batches of 10.
            </p>
          </div>
        </div>
      </div>

      {/* Campaign Mode Switcher (Fresh vs Follow-Up) */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: campaignType === 'followup' ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-card)', borderColor: campaignType === 'followup' ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)' }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {campaignType === 'fresh' ? '✉️ Mode: Fresh Outreach Email' : '🔄 Mode: Follow-Up Email Campaign'}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            {campaignType === 'fresh' 
              ? 'Sends initial introduction application & resume to new HR contacts.' 
              : 'Sends gentle follow-up reminder emails to previously contacted recruiters.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.05)', padding: '0.3rem', borderRadius: '12px' }}>
          <button
            type="button"
            className={campaignType === 'fresh' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handleSwitchCampaignType('fresh')}
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', border: 'none' }}
          >
            <Send size={14} style={{ marginRight: '0.3rem' }} />
            Fresh Mail
          </button>
          <button
            type="button"
            className={campaignType === 'followup' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handleSwitchCampaignType('followup')}
            style={{ 
              padding: '0.45rem 1rem', 
              fontSize: '0.8rem', 
              border: 'none',
              background: campaignType === 'followup' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              color: campaignType === 'followup' ? '#ffffff' : undefined
            }}
          >
            <RefreshCw size={14} style={{ marginRight: '0.3rem' }} />
            Follow-Up Mail
          </button>
        </div>
      </div>

      {/* Main Input Form */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Raw Textarea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: 0 }}>
              <Mail size={16} style={{ color: '#10b981' }} />
              Paste Raw HR Email Addresses (Separated by commas, newlines, or semicolons)
            </label>
            {parsedEmails.length > 0 && (
              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                Found {parsedEmails.length} valid emails ({batches.length} batches of 10)
              </span>
            )}
          </div>
          <textarea
            rows={6}
            placeholder="Paste your raw list here, for example:
hr@google.com, hr@razorpay.com, careers@paytm.com
hr@cred.club; jobs@phonepe.com"
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              localStorage.setItem('sheetSync_bulkPastedEmails', e.target.value);
            }}
            className="search-input"
            style={{ 
              padding: '0.85rem 1rem', 
              height: 'auto', 
              resize: 'vertical',
              fontFamily: 'var(--font-mono)',
              lineHeight: '1.5',
              fontSize: '0.85rem'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              💡 Duplicate emails are automatically removed.
            </span>
            {rawText.trim() && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClear}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f87171' }}
              >
                <Trash2 size={12} />
                Clear Input
              </button>
            )}
          </div>
        </div>

        {/* Credentials & Role Select */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="modal-label">Sender Gmail Address</label>
            <input
              type="email"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '0.75rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="modal-label">Gmail App Password</label>
            <input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '0.75rem' }}
            />
          </div>
        </div>

        {/* Email Subject & Message Customizer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid rgba(75, 85, 99, 0.15)', paddingTop: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="modal-label">Email Subject ({campaignType.toUpperCase()} MODE)</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '1rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="modal-label">Email Message Template ({campaignType.toUpperCase()} MODE)</label>
            <textarea
              rows={6}
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              className="search-input"
              style={{ padding: '0.75rem 1rem', height: 'auto', resize: 'vertical', fontSize: '0.85rem', lineHeight: '1.4' }}
            />
          </div>
        </div>

        {/* PDF Attachment Indicator */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0.75rem 1rem', 
          background: 'rgba(16, 185, 129, 0.08)', 
          border: '1px solid rgba(16, 185, 129, 0.25)', 
          borderRadius: '8px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Paperclip size={16} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981' }}>
              Satish_Kumar_Chaubey.pdf
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              (Attached automatically to all emails in every batch)
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', background: '#10b981', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
            PDF Attached
          </span>
        </div>
      </div>

      {/* Batches Overview & Controls */}
      {parsedEmails.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Bulk Execution Queue ({batches.length} Batches of 10)
            </span>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleOpenAllAsDrafts}
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
              >
                <ExternalLink size={14} />
                Open All {parsedEmails.length} as Gmail Tabs
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleSendAllBatches}
                disabled={isSendingAll || sendingBatchIndex !== null}
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.82rem', background: campaignType === 'followup' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#10b981', borderColor: campaignType === 'followup' ? '#f59e0b' : '#10b981' }}
              >
                {isSendingAll ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {isSendingAll ? 'Sending All Batches...' : `Send All ${batches.length} Batches`}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {batches.map((batchList, bIdx) => {
              const isSending = sendingBatchIndex === bIdx;
              const isDone = processedBatches[bIdx];

              return (
                <div 
                  key={bIdx}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    background: isDone ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-card)',
                    borderColor: isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Batch #{bIdx + 1} ({batchList.length} Emails)
                      </span>
                      {isDone && (
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      )}
                    </div>

                    {/* Email preview list */}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.05)', padding: '0.5rem', borderRadius: '6px', maxHeight: '80px', overflowY: 'auto' }}>
                      {batchList.map((em, idx) => (
                        <div key={idx} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          • {em}
                        </div>
                      ))}
                    </div>

                    {batchLogs[bIdx] && (
                      <div style={{ fontSize: '0.72rem', color: isDone ? '#10b981' : '#6366f1', fontWeight: 600 }}>
                        {batchLogs[bIdx]}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleOpenBatchAsDrafts(bIdx)}
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center' }}
                    >
                      <ExternalLink size={12} />
                      Gmail Tabs
                    </button>

                    <button
                      type="button"
                      className={isDone ? 'btn-secondary' : 'btn-primary'}
                      onClick={() => handleSendBatch(bIdx)}
                      disabled={isSending}
                      style={{ flex: 1.2, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center', background: isDone ? undefined : campaignType === 'followup' ? '#f59e0b' : '#10b981', borderColor: isDone ? undefined : campaignType === 'followup' ? '#f59e0b' : '#10b981' }}
                    >
                      {isSending ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Sending...
                        </>
                      ) : isDone ? (
                        'Resend Batch'
                      ) : (
                        <>
                          <Send size={12} />
                          Send Batch #{bIdx + 1}
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

    </div>
  );
};
