import React, { useState, useMemo } from 'react';
import { Mail, Copy, Check, ExternalLink, Send, AlertTriangle, Layers, CheckCircle2, Loader2, Settings, Lock, HelpCircle } from 'lucide-react';
import { API_BASE } from '../config';

interface BatchMailerProps {
  data: any[];
}

export const BatchMailer: React.FC<BatchMailerProps> = ({ data }) => {
  // Find email column key dynamically
  const emailKey = useMemo(() => {
    if (!data || data.length === 0) return '';
    const firstRowKeys = Object.keys(data[0]);
    return firstRowKeys.find(key => 
      key.toLowerCase().includes('email') || 
      key.toLowerCase().includes('mail')
    ) || '';
  }, [data]);

  // Find candidate name key dynamically
  const nameKey = useMemo(() => {
    if (!data || data.length === 0) return '';
    const firstRowKeys = Object.keys(data[0]);
    return firstRowKeys.find(key => 
      key.toLowerCase() === 'name' || 
      key.toLowerCase().includes('contact name') ||
      key.toLowerCase().includes('candidate')
    ) || '';
  }, [data]);

  // Email template states
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

  const [separator, setSeparator] = useState<',' | ';'>(',');
  const [processedBatches, setProcessedBatches] = useState<Record<number, boolean>>({});
  const [sentEmails, setSentEmails] = useState<Record<string, boolean>>({});
  const [copiedBatchIndex, setCopiedBatchIndex] = useState<number | null>(null);
  const [copiedTextIndex, setCopiedTextIndex] = useState<number | null>(null);

  // SMTP Credentials state (Prefilled with user details)
  const [gmailAddress, setGmailAddress] = useState(() => localStorage.getItem('sheetSync_gmailAddress') || 'satishchaubey02@gmail.com');
  const [appPassword, setAppPassword] = useState(() => localStorage.getItem('sheetSync_gmailAppPassword') || 'gngb uynz nssm mgkz');
  const [sendingEmails, setSendingEmails] = useState<Record<string, boolean>>({});
  const [mailError, setMailError] = useState<string | null>(null);

  const handleSaveCredentials = (email: string, pass: string) => {
    setGmailAddress(email);
    setAppPassword(pass);
    localStorage.setItem('sheetSync_gmailAddress', email);
    localStorage.setItem('sheetSync_gmailAppPassword', pass);
  };

  // Extract valid emails
  const contactsWithEmails = useMemo(() => {
    if (!emailKey || !data) return [];
    return data.map(item => {
      const email = String(item[emailKey] || '').trim();
      const name = nameKey ? String(item[nameKey] || '').trim() : '';
      return { name, email };
    }).filter(contact => {
      return contact.email && contact.email.includes('@');
    });
  }, [data, emailKey, nameKey]);

  // Group contacts into batches of 10
  const batches = useMemo(() => {
    const batchList: Array<typeof contactsWithEmails> = [];
    for (let i = 0; i < contactsWithEmails.length; i += 10) {
      batchList.push(contactsWithEmails.slice(i, i + 10));
    }
    return batchList;
  }, [contactsWithEmails]);

  // Clipboard copy helpers
  const copyEmailsToClipboard = (emailList: string[], index: number) => {
    const emailsString = emailList.join(separator);
    navigator.clipboard.writeText(emailsString);
    setCopiedBatchIndex(index);
    setTimeout(() => setCopiedBatchIndex(null), 2000);
    setProcessedBatches(prev => ({ ...prev, [index]: true }));
  };

  const copyTemplateToClipboard = (index: number) => {
    const fullText = `Subject: ${subject}\n\n${bodyTemplate}`;
    navigator.clipboard.writeText(fullText);
    setCopiedTextIndex(index);
    setTimeout(() => setCopiedTextIndex(null), 2000);
  };

  // Helper function to send email via backend API
  const sendEmailViaBackend = async (email: string) => {
    const response = await fetch(`${API_BASE}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        smtpUser: gmailAddress,
        smtpPass: appPassword,
        to: email,
        subject: subject,
        body: bodyTemplate
      })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'SMTP Server failed to deliver message.');
    }
    return result;
  };

  // Open Gmail specifically for a single recruiter (No name replacement, always Dear Hiring Manager)
  const triggerSingleMail = async (email: string, batchIdx: number) => {
    if (gmailAddress.trim() && appPassword.trim()) {
      setSendingEmails(prev => ({ ...prev, [email]: true }));
      setMailError(null);
      try {
        await sendEmailViaBackend(email);
        setSentEmails(prev => ({ ...prev, [email]: true }));
        setProcessedBatches(prev => ({ ...prev, [batchIdx]: true }));
      } catch (err: any) {
        console.error("Backend send failed, opening Gmail fallback:", err);
        setMailError(`Nodemailer server failed: ${err.message}. Opened Gmail web tab instead.`);
        
        // Fallback manual open
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTemplate)}`;
        window.open(gmailUrl, '_blank');
        
        setSentEmails(prev => ({ ...prev, [email]: true }));
        setProcessedBatches(prev => ({ ...prev, [batchIdx]: true }));
      } finally {
        setSendingEmails(prev => ({ ...prev, [email]: false }));
      }
    } else {
      // Manual click compose fallback
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTemplate)}`;
      window.open(gmailUrl, '_blank');
      setSentEmails(prev => ({ ...prev, [email]: true }));
      setProcessedBatches(prev => ({ ...prev, [batchIdx]: true }));
    }
  };

  // Launch 10 Gmail tabs at once for the entire batch (Always Dear Hiring Manager)
  const triggerBatchMails = async (batchContacts: typeof contactsWithEmails, batchIdx: number) => {
    if (gmailAddress.trim() && appPassword.trim()) {
      setMailError(null);
      for (const contact of batchContacts) {
        if (sentEmails[contact.email]) continue; // Skip sent ones
        
        setSendingEmails(prev => ({ ...prev, [contact.email]: true }));
        try {
          await sendEmailViaBackend(contact.email);
          setSentEmails(prev => ({ ...prev, [contact.email]: true }));
        } catch (err: any) {
          console.error(`Backend send failed for ${contact.email}, opening tab fallback:`, err);
          setMailError(`Batch sending interrupted: ${err.message}. Opening remaining emails in Gmail tabs.`);
          
          // Fallback manual open tab
          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTemplate)}`;
          window.open(gmailUrl, '_blank');
          setSentEmails(prev => ({ ...prev, [contact.email]: true }));
        } finally {
          setSendingEmails(prev => ({ ...prev, [contact.email]: false }));
        }
      } 
      setProcessedBatches(prev => ({ ...prev, [batchIdx]: true }));
    } else {
      // Regular multi-tab launcher fallback
      batchContacts.forEach((contact) => {
        if (sentEmails[contact.email]) return;
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTemplate)}`;
        window.open(gmailUrl, '_blank');
        setSentEmails(prev => ({ ...prev, [contact.email]: true }));
      });
      setProcessedBatches(prev => ({ ...prev, [batchIdx]: true }));
    }
  };

  if (!emailKey) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: '#f59e0b', margin: '0 auto 1rem auto' }} />
        <h3 className="upload-title">No Email Column Detected</h3>
        <p className="upload-hint" style={{ maxWidth: '400px', margin: '0 auto' }}>
          Please make sure your uploaded spreadsheet contains an "Email" or "Email Address" column so we can setup your mailing batches.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Informative Alert for PDF Attachment */}
      <div className="glass-card" style={{ 
        borderLeft: '4px solid #f59e0b',
        background: 'rgba(245, 158, 11, 0.05)',
        display: 'flex',
        gap: '1rem',
        padding: '1.25rem'
      }}>
        <AlertTriangle size={24} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '0.15rem' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h4 style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.95rem' }}>Important: Resume Attachment</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Browser security rules restrict web applications from attaching files to Gmail automatically.
            When your Gmail compose tab opens, please <strong>manually attach</strong> the resume file: 
            <code style={{ marginLeft: '0.35rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', fontSize: '0.8rem' }}>
              Satish_Kumar_Chaubey.pdf
            </code>.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resume Link:</span>
            <a 
              href="/Satish_Kumar_Chaubey.pdf" 
              target="_blank" 
              rel="noreferrer" 
              className="filter-badge"
              style={{ padding: '0.15rem 0.5rem', textDecoration: 'none', background: 'rgba(99, 102, 241, 0.2)' }}
            >
              Open/View Resume PDF
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      {/* SMTP Configuration Card */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--accent-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={20} style={{ color: '#818cf8' }} />
          <h3 className="upload-title" style={{ fontSize: '1.15rem', marginBottom: 0 }}>Gmail Automation SMTP Setup (Optional)</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Enter your Gmail address and 16-character <strong>Gmail App Password</strong> below to fully automate sending emails with your resume attached. 
          If left blank, clicking send will fall back to opening a manual Gmail composer tab.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '220px' }}>
            <label className="modal-label">Gmail Address</label>
            <input 
              type="email" 
              placeholder="e.g. satishchaubey02@gmail.com" 
              value={gmailAddress}
              onChange={(e) => handleSaveCredentials(e.target.value, appPassword)}
              className="search-input"
              style={{ paddingLeft: '1rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '220px' }}>
            <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Lock size={10} />
              Gmail App Password
            </label>
            <input 
              type="password" 
              placeholder="16-character code (e.g. abcd efgh ijkl mnop)" 
              value={appPassword}
              onChange={(e) => handleSaveCredentials(gmailAddress, e.target.value)}
              className="search-input"
              style={{ paddingLeft: '1rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
          <a 
            href="https://support.google.com/accounts/answer/185833" 
            target="_blank" 
            rel="noreferrer" 
            style={{ fontSize: '0.8rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
          >
            <HelpCircle size={12} />
            How to generate a Gmail App Password?
          </a>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            🔒 Credentials are saved in localStorage (your browser only).
          </span>
        </div>

        {mailError && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.75rem 1rem', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.85rem'
          }}>
            ⚠️ {mailError}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Side: Template Editor */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 className="upload-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', marginBottom: 0 }}>
            <Layers size={18} style={{ color: '#818cf8' }} />
            AI Cover Letter Template
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="modal-label">Email Subject</label>
            <input 
              type="text" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              className="search-input"
              style={{ paddingLeft: '1rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="modal-label">Email Body (Markdown/Text)</label>
            <textarea 
              value={bodyTemplate} 
              onChange={(e) => setBodyTemplate(e.target.value)} 
              className="search-input"
              style={{ 
                paddingLeft: '1rem', 
                height: '350px', 
                resize: 'vertical',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                lineHeight: '1.4'
              }}
            />
          </div>
        </div>

        {/* Right Side: Batch Campaign Listing */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 className="upload-title" style={{ fontSize: '1.2rem', marginBottom: 0 }}>Mailing Batches</h3>
              <p className="upload-hint" style={{ marginBottom: 0 }}>
                Total: <strong>{contactsWithEmails.length}</strong> contacts with valid emails
              </p>
            </div>
            
            {/* Email Separator Settings */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-glass)', padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Separator:</span>
              <button 
                type="button" 
                className={`pagination-btn ${separator === ';' ? 'pagination-active' : ''}`}
                style={{ width: '1.75rem', height: '1.75rem', fontSize: '0.75rem' }}
                onClick={() => setSeparator(';')}
                title="Semicolon (for Outlook/Windows Mail)"
              >
                ;
              </button>
              <button 
                type="button" 
                className={`pagination-btn ${separator === ',' ? 'pagination-active' : ''}`}
                style={{ width: '1.75rem', height: '1.75rem', fontSize: '0.75rem' }}
                onClick={() => setSeparator(',')}
                title="Comma (for Gmail/Apple Mail)"
              >
                ,
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {batches.length === 0 ? (
              <div className="empty-state">
                <Mail size={32} className="empty-state-icon" />
                <p className="empty-state-title">No contacts available to batch</p>
              </div>
            ) : (
              batches.map((batchContacts, idx) => {
                const batchNum = idx + 1;
                const isProcessed = processedBatches[idx];
                const emails = batchContacts.map(c => c.email);

                return (
                  <div 
                    key={idx} 
                    className="glass-card" 
                    style={{ 
                      padding: '1rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.75rem',
                      background: isProcessed ? 'rgba(16, 185, 129, 0.03)' : 'rgba(17, 24, 39, 0.4)',
                      borderColor: isProcessed ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          Batch {batchNum}
                        </span>
                        <span className="filter-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: 'none' }}>
                          {batchContacts.length} recipients
                        </span>
                      </div>
                      
                      {isProcessed ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#10b981', fontWeight: 500 }}>
                          <CheckCircle2 size={14} />
                          Processed
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Recipient individual list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {batchContacts.map((contact, contactIdx) => {
                        const isSent = sentEmails[contact.email];
                        const isSending = sendingEmails[contact.email];
                        return (
                          <div 
                            key={contactIdx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.5rem 0.75rem',
                              background: 'rgba(3, 7, 18, 0.25)',
                              borderRadius: '8px',
                              border: '1px solid rgba(75, 85, 99, 0.15)',
                              opacity: isSent ? 0.6 : 1,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', marginRight: '0.5rem' }}>
                              <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {contact.name || 'Hiring Manager'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {contact.email}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                              <button
                                type="button"
                                className={isSent ? 'btn-secondary' : 'btn-primary'}
                                style={{ 
                                  padding: '0.35rem 0.65rem', 
                                  fontSize: '0.75rem', 
                                  gap: '0.25rem',
                                  background: isSent ? 'rgba(16, 185, 129, 0.1)' : undefined,
                                  borderColor: isSent ? 'rgba(16, 185, 129, 0.3)' : undefined,
                                  color: isSent ? '#10b981' : undefined
                                }}
                                onClick={() => triggerSingleMail(contact.email, idx)}
                                disabled={isSending}
                                title={`Send email to ${contact.name || contact.email}`}
                              >
                                {isSending ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin" />
                                    Sending
                                  </>
                                ) : isSent ? (
                                  <>
                                    <Check size={12} />
                                    Sent
                                  </>
                                ) : (
                                  <>
                                    <Send size={12} />
                                    Send
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Batch Actions: Copy Batch Info */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid rgba(75, 85, 99, 0.15)', paddingTop: '0.75rem', flexWrap: 'wrap' }}>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', gap: '0.35rem', flexGrow: 2, justifyContent: 'center' }}
                        onClick={() => triggerBatchMails(batchContacts, idx)}
                        title="Open 10 separate Gmail compose tabs at once"
                      >
                        <Send size={12} />
                        Launch 10 Tabs
                      </button>

                      <button 
                        type="button" 
                        className="btn-secondary" 
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', gap: '0.35rem', flexGrow: 1, justifyContent: 'center' }}
                        onClick={() => copyEmailsToClipboard(emails, idx)}
                        title={`Copy all ${emails.length} email addresses to clipboard`}
                      >
                        {copiedBatchIndex === idx ? (
                          <>
                            <Check size={12} style={{ color: '#10b981' }} />
                            Copied List
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Copy {emails.length} Emails
                          </>
                        )}
                      </button>

                      <button 
                        type="button" 
                        className="btn-secondary" 
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', gap: '0.35rem', flexGrow: 1, justifyContent: 'center' }}
                        onClick={() => copyTemplateToClipboard(idx)}
                        title="Copy Subject and Email Body template to clipboard"
                      >
                        {copiedTextIndex === idx ? (
                          <>
                            <Check size={12} style={{ color: '#10b981' }} />
                            Copied Template
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Copy Template
                          </>
                        )}
                      </button>
                    </div>

                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: '1.3' }}>
                      💡 <strong>Pop-up block warning</strong>: Clicking "Launch 10 Tabs" tries to open multiple pages. If your browser blocks them, please click the <strong>Pop-up Blocked icon</strong> in your browser address bar and choose <strong>"Always allow redirects from this site"</strong>.
                    </p>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
