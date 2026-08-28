import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2, Paperclip, Mail, User, Building, FileText, Sparkles, Server, Settings, RefreshCw, Wifi, Info } from 'lucide-react';
import { getApiBase, setApiBase } from '../config';
import { ROLE_TEMPLATES, type RoleTemplate } from '../templates';
import { RoleSelector } from './RoleSelector';

interface QuickSendProps {
  onNavigateToCampaign?: () => void;
}

export const QuickSend: React.FC<QuickSendProps> = () => {
  const [selectedRole, setSelectedRole] = useState<string>('frontend');
  const [toEmail, setToEmail] = useState('');
  const [recruiterName, setRecruiterName] = useState('Hiring Manager');
  const [companyName, setCompanyName] = useState('');
  const [subject, setSubject] = useState(ROLE_TEMPLATES[0].subject);
  const [message, setMessage] = useState(ROLE_TEMPLATES[0].body);

  const [smtpUser, setSmtpUser] = useState(() => localStorage.getItem('sheetSync_smtpUser') || 'satishchaubey02@gmail.com');
  const [smtpPass, setSmtpPass] = useState(() => localStorage.getItem('sheetSync_smtpPass') || 'gngb uynz nssm mgkz');
  
  // API Server Configuration & Diagnostics
  const [serverUrlInput, setServerUrlInput] = useState(() => getApiBase());
  const [activeApiBase, setActiveApiBase] = useState(() => getApiBase());
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverHealth, setServerHealth] = useState<'idle' | 'testing' | 'online' | 'offline'>('idle');
  const [serverHealthMsg, setServerHealthMsg] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; details?: string[] } | null>(null);
  const [sentHistory, setSentHistory] = useState<Array<{ email: string; company: string; timestamp: string }>>([]);

  // Auto test connection on mount
  useEffect(() => {
    testConnection(getApiBase());
  }, []);

  const testConnection = async (targetUrl?: string) => {
    const urlToTest = targetUrl || activeApiBase;
    setServerHealth('testing');
    setServerHealthMsg('Checking backend server health...');
    try {
      const res = await fetch(`${urlToTest}/api/health`, { method: 'GET' });
      if (res.ok) {
        setServerHealth('online');
        setServerHealthMsg(`Server connected successfully at ${urlToTest}`);
      } else {
        setServerHealth('offline');
        setServerHealthMsg(`Server responded with status ${res.status}`);
      }
    } catch (err) {
      setServerHealth('offline');
      setServerHealthMsg(`Failed to connect to ${urlToTest}`);
    }
  };

  const handleSaveServerUrl = () => {
    let formatted = serverUrlInput.trim().replace(/\/$/, '');
    if (!formatted) {
      formatted = 'http://localhost:3001';
      setServerUrlInput(formatted);
    }
    setApiBase(formatted);
    setActiveApiBase(formatted);
    testConnection(formatted);
    setShowServerConfig(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim()) return;

    setIsLoading(true);
    setStatusMessage(null);

    // Save SMTP credentials locally
    localStorage.setItem('sheetSync_smtpUser', smtpUser);
    localStorage.setItem('sheetSync_smtpPass', smtpPass);

    const currentApiBase = getApiBase();

    try {
      const response = await fetch(`${currentApiBase}/api/send-email`, {
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
      console.error('Email send error:', err);
      
      const isFetchError = err.name === 'TypeError' || err.message?.toLowerCase().includes('failed to fetch');
      
      if (isFetchError) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isHttps = window.location.protocol === 'https:';

        setStatusMessage({
          type: 'error',
          text: 'Failed to fetch (Backend Server Unreachable)',
          details: [
            `Current API Endpoint: ${currentApiBase}`,
            ...(isMobile ? [
              '📱 Mobile Device Warning: Mobile browser cannot reach "localhost:3001". Change API Server URL above to your PC\'s Wi-Fi IP address (e.g. http://192.168.x.x:3001) or your deployed HTTPS Render backend URL.'
            ] : []),
            ...(isHttps && currentApiBase.startsWith('http://') ? [
              '🔒 Mixed Content Error: You are opening this app on HTTPS (e.g. GitHub Pages), but your API URL is HTTP. Web browsers block HTTP requests from HTTPS pages. Use an HTTPS deployed server (e.g. Render).'
            ] : []),
            '⚡ Local Server: Ensure "node server.js" is actively running on your terminal.'
          ]
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: err.message || 'Failed to send email. Please check your SMTP settings or server logs.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

          {/* Server Connection Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowServerConfig(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: '1px solid var(--border-color)',
                background: '#ffffff',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <Server size={14} style={{ color: serverHealth === 'online' ? '#10b981' : serverHealth === 'offline' ? '#ef4444' : '#6366f1' }} />
              <span>{serverHealth === 'online' ? 'Server Online' : serverHealth === 'offline' ? 'Server Offline' : 'Checking Server...'}</span>
              <Settings size={13} style={{ color: 'var(--text-muted)', marginLeft: '0.2rem' }} />
            </button>
          </div>
        </div>

        {/* Expandable Server Config Panel */}
        {showServerConfig && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <label className="modal-label" style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Wifi size={14} style={{ color: '#6366f1' }} />
                Backend API Server URL (Mobile / Web Endpoint)
              </label>
              {serverHealthMsg && (
                <span style={{ fontSize: '0.75rem', color: serverHealth === 'online' ? '#10b981' : '#ef4444' }}>
                  {serverHealthMsg}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={serverUrlInput}
                onChange={(e) => setServerUrlInput(e.target.value)}
                placeholder="e.g. http://192.168.1.15:3001 or https://sheetsync-backend.onrender.com"
                className="search-input"
                style={{ flex: 1, minWidth: '240px', fontSize: '0.82rem', paddingLeft: '0.85rem' }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveServerUrl}
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              >
                Save & Connect
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => testConnection(serverUrlInput)}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RefreshCw size={13} className={serverHealth === 'testing' ? 'animate-spin' : ''} />
                Test
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              💡 <strong>Mobile Setup Tip:</strong> If using on mobile connected to same Wi-Fi as your PC, replace <code>localhost</code> with your PC's IP address (e.g. <code>http://192.168.x.x:3001</code>). If hosted on HTTPS (like GitHub Pages), enter your deployed Render backend HTTPS URL.
            </div>
          </div>
        )}
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

          {/* Role Selector Presets */}
          <RoleSelector 
            selectedRole={selectedRole}
            onSelectRole={(tmpl: RoleTemplate) => {
              setSelectedRole(tmpl.id);
              let s = tmpl.subject;
              let b = tmpl.body;
              if (companyName.trim()) {
                s = s.replace(/\[Company Name\]/g, companyName.trim());
                b = b.replace(/\[Company Name\]/g, companyName.trim());
              }
              setSubject(s);
              setMessage(b);
            }}
          />

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
              padding: '1rem',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.88rem',
              backgroundColor: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: statusMessage.type === 'success' ? '#10b981' : '#dc2626'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{statusMessage.text}</span>
              </div>

              {statusMessage.details && statusMessage.details.length > 0 && (
                <div style={{ marginTop: '0.35rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  {statusMessage.details.map((detail, dIdx) => (
                    <div key={dIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', lineHeight: '1.4' }}>
                      <Info size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                      <span>{detail}</span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowServerConfig(true)}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: '0.25rem',
                      fontSize: '0.78rem',
                      color: '#6366f1',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontWeight: 600,
                      padding: 0
                    }}
                  >
                    ⚙️ Open Server Settings to Fix API Endpoint URL
                  </button>
                </div>
              )}
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
