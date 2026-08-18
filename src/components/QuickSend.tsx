import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2, Paperclip, Mail, User, Building, FileText, Sparkles } from 'lucide-react';
import { API_BASE } from '../config';

interface QuickSendProps {
  onNavigateToCampaign?: () => void;
}

export const QuickSend: React.FC<QuickSendProps> = () => {
  const [toEmail, setToEmail] = useState('');
  const [recruiterName, setRecruiterName] = useState('Hiring Manager');
  const [companyName, setCompanyName] = useState('');
  const [subject, setSubject] = useState('Frontend Developer Application - Satish Kumar Chaubey');
  const [message, setMessage] = useState(
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
  
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sentHistory, setSentHistory] = useState<Array<{ email: string; company: string; timestamp: string }>>([]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim()) return;

    setIsLoading(true);
    setStatusMessage(null);

    // Save SMTP credentials locally
    localStorage.setItem('sheetSync_smtpUser', smtpUser);
    localStorage.setItem('sheetSync_smtpPass', smtpPass);

    try {
      const response = await fetch(`${API_BASE}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim(),
          to: toEmail.trim(),
          subject: subject.trim(),
          body: message.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Resume & email successfully sent to ${toEmail.trim()}!`
        });

        // Add to local sent history
        setSentHistory(prev => [
          {
            email: toEmail.trim(),
            company: companyName.trim() || 'Direct Lead',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          ...prev
        ]);

        // Reset target email after sending
        setToEmail('');
      } else {
        throw new Error(data.message || 'Failed to send email.');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to send email. Make sure your local server is running.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Send size={24} />
          </div>
          <div>
            <h2 className="upload-title" style={{ fontSize: '1.4rem', marginBottom: '0.15rem' }}>Quick Direct Mail Sender</h2>
            <p className="upload-hint" style={{ marginBottom: 0 }}>
              Enter any recruiter or HR email address below to send your customized message and resume automatically in one click.
            </p>
          </div>
        </div>
      </div>

      {/* Main Mailer Form */}
      <div className="glass-card">
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Row: Target Email & Company */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 2, minWidth: '260px' }}>
              <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={14} style={{ color: '#818cf8' }} />
                Target HR Email Address *
              </label>
              <input
                type="email"
                placeholder="e.g. hr@company.com or recruiter@google.com"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '1rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '180px' }}>
              <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building size={14} style={{ color: '#818cf8' }} />
                Company Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Razorpay, Paytm"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '1rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '180px' }}>
              <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={14} style={{ color: '#818cf8' }} />
                Recruiter Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Hiring Manager"
                value={recruiterName}
                onChange={(e) => setRecruiterName(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '1rem' }}
              />
            </div>
          </div>

          {/* Subject Line */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileText size={14} style={{ color: '#818cf8' }} />
              Email Subject Line *
            </label>
            <input
              type="text"
              placeholder="Email subject line..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '1rem' }}
              required
            />
          </div>

          {/* Message Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={14} style={{ color: '#818cf8' }} />
              Cover Letter / Email Message *
            </label>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="search-input"
              style={{ 
                padding: '0.85rem 1rem', 
                height: 'auto', 
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: '1.5',
                fontSize: '0.88rem'
              }}
              required
            />
          </div>

          {/* Attached Resume Badge */}
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
                (Attached automatically by server mailer)
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#10b981', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
              PDF Attached
            </span>
          </div>

          {/* Status Message Alert */}
          {statusMessage && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem',
              backgroundColor: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: statusMessage.type === 'success' ? '#10b981' : '#f87171'
            }}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* SMTP Credentials Footer Bar */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            flexWrap: 'wrap', 
            paddingTop: '1rem', 
            borderTop: '1px solid rgba(75, 85, 99, 0.15)',
            alignItems: 'flex-end'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '200px' }}>
              <label className="modal-label" style={{ fontSize: '0.75rem' }}>Sender Gmail Address</label>
              <input
                type="email"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '0.75rem', fontSize: '0.8rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '200px' }}>
              <label className="modal-label" style={{ fontSize: '0.75rem' }}>Sender Gmail App Password</label>
              <input
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '0.75rem', fontSize: '0.8rem' }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ padding: '0.75rem 1.75rem', minWidth: '180px', height: '42px' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending Mail...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Direct Email
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* Local History List */}
      {sentHistory.length > 0 && (
        <div className="glass-card">
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Recently Sent Quick Emails ({sentHistory.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sentHistory.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '0.75rem 1rem', 
                  background: 'rgba(16, 185, 129, 0.05)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)', 
                  borderRadius: '8px' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {item.email}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.company}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Sent at {item.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
