import React, { useState, useMemo } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2, Paperclip, Send, Layers, Sparkles, Trash2, Play } from 'lucide-react';
import { API_BASE } from '../config';

export const BulkPasteMailer: React.FC = () => {
  const [rawText, setRawText] = useState('');
  const [subject, setSubject] = useState('Frontend Developer Application - Satish Kumar Chaubey');
  const [bodyTemplate, setBodyTemplate] = useState(
`Dear Hiring Manager,

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
Ghaziabad, Uttar Pradesh`
  );

  const [smtpUser, setSmtpUser] = useState(() => localStorage.getItem('sheetSync_smtpUser') || 'satishchaubey02@gmail.com');
  const [smtpPass, setSmtpPass] = useState(() => localStorage.getItem('sheetSync_smtpPass') || 'gngb uynz nssm mgkz');
  
  const [processedBatches, setProcessedBatches] = useState<Record<number, boolean>>({});
  const [sendingBatchIndex, setSendingBatchIndex] = useState<number | null>(null);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [batchLogs, setBatchLogs] = useState<Record<number, string>>({});

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

  // Send a specific batch index
  const handleSendBatch = async (batchIdx: number) => {
    const targetEmails = batches[batchIdx];
    if (!targetEmails || targetEmails.length === 0) return;

    setSendingBatchIndex(batchIdx);
    setBatchLogs(prev => ({ ...prev, [batchIdx]: `Sending batch to ${targetEmails.length} recipients...` }));

    // Save SMTP credentials
    localStorage.setItem('sheetSync_smtpUser', smtpUser);
    localStorage.setItem('sheetSync_smtpPass', smtpPass);

    try {
      let successCount = 0;
      let failCount = 0;

      // Send to each email in the batch sequentially
      for (const email of targetEmails) {
        try {
          const res = await fetch(`${API_BASE}/api/send-email`, {
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
      setBatchLogs(prev => ({ 
        ...prev, 
        [batchIdx]: `✅ Sent ${successCount} emails successfully! ${failCount > 0 ? `(${failCount} failed)` : ''}` 
      }));
    } catch (err: any) {
      console.error(err);
      setBatchLogs(prev => ({ ...prev, [batchIdx]: `❌ Batch failed: ${err.message}` }));
    } finally {
      setSendingBatchIndex(null);
    }
  };

  // Send all batches sequentially
  const handleSendAllBatches = async () => {
    setIsSendingAll(true);
    for (let i = 0; i < batches.length; i++) {
      if (!processedBatches[i]) {
        await handleSendBatch(i);
      }
    }
    setIsSendingAll(false);
  };

  const handleClear = () => {
    setRawText('');
    setProcessedBatches({});
    setBatchLogs({});
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Layers size={24} />
          </div>
          <div>
            <h2 className="upload-title" style={{ fontSize: '1.4rem', marginBottom: '0.15rem' }}>Bulk Raw Email Batch Mailer</h2>
            <p className="upload-hint" style={{ marginBottom: 0 }}>
              Paste any block of raw email addresses below. We automatically extract valid emails, organize them into batches of 10, and send your cover letter with your resume attached.
            </p>
          </div>
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
hr@cred.club; jobs@phonepe.com
recruiter@techdome.in"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
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

        {/* Email Subject & Message Customizer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid rgba(75, 85, 99, 0.15)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="modal-label">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '1rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="modal-label">Email Message Template</label>
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
            PDF Ready
          </span>
        </div>

        {/* Sender Credentials & Send All Bar */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', borderTop: '1px solid rgba(75, 85, 99, 0.15)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '180px' }}>
            <label className="modal-label" style={{ fontSize: '0.75rem' }}>Sender Gmail Address</label>
            <input
              type="email"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '0.75rem', fontSize: '0.8rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '180px' }}>
            <label className="modal-label" style={{ fontSize: '0.75rem' }}>Gmail App Password</label>
            <input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '0.75rem', fontSize: '0.8rem' }}
            />
          </div>

          {batches.length > 0 && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleSendAllBatches}
              disabled={isSendingAll || sendingBatchIndex !== null || batches.every((_, idx) => processedBatches[idx])}
              style={{ padding: '0.75rem 1.5rem', height: '42px', minWidth: '200px', background: '#10b981', borderColor: '#10b981' }}
            >
              {isSendingAll ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending All Batches...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Send All {batches.length} Batches ({parsedEmails.length} Mails)
                </>
              )}
            </button>
          )}
        </div>

      </div>

      {/* Batches Preview & Dispatch List */}
      {batches.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Batches of 10 ({batches.length} Total Batches)
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {Object.keys(processedBatches).length} / {batches.length} Batches Sent
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {batches.map((batchEmails, batchIdx) => {
              const isProcessed = processedBatches[batchIdx];
              const isSending = sendingBatchIndex === batchIdx;
              const logText = batchLogs[batchIdx];

              return (
                <div 
                  key={batchIdx}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    gap: '1rem',
                    background: isProcessed ? 'rgba(16, 185, 129, 0.03)' : 'var(--bg-card)',
                    borderColor: isProcessed ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-color)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                          Batch {batchIdx + 1}
                        </span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                          {batchEmails.length} recipients
                        </span>
                      </div>
                      {isProcessed && (
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={14} /> Processed
                        </span>
                      )}
                    </div>

                    {/* Email pills preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {batchEmails.map((email, idx) => (
                        <div 
                          key={idx}
                          style={{
                            fontSize: '0.78rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-secondary)',
                            background: 'rgba(0, 0, 0, 0.2)',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '4px',
                            wordBreak: 'break-all'
                          }}
                        >
                          {idx + 1}. {email}
                        </div>
                      ))}
                    </div>
                  </div>

                  {logText && (
                    <div style={{ fontSize: '0.75rem', color: isProcessed ? '#10b981' : '#818cf8', fontWeight: 500 }}>
                      {logText}
                    </div>
                  )}

                  <button
                    type="button"
                    className={isProcessed ? 'btn-secondary' : 'btn-primary'}
                    onClick={() => handleSendBatch(batchIdx)}
                    disabled={isSending || isSendingAll}
                    style={{
                      padding: '0.5rem',
                      fontSize: '0.8rem',
                      justifyContent: 'center',
                      background: isProcessed ? 'rgba(16, 185, 129, 0.1)' : undefined,
                      borderColor: isProcessed ? 'rgba(16, 185, 129, 0.3)' : undefined,
                      color: isProcessed ? '#10b981' : undefined
                    }}
                  >
                    {isSending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Sending Batch {batchIdx + 1}...
                      </>
                    ) : isProcessed ? (
                      <>
                        <CheckCircle2 size={14} />
                        Resend Batch {batchIdx + 1}
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Send Batch {batchIdx + 1}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
