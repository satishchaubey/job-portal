import { useState, useEffect } from 'react';
import { FileSpreadsheet, Sparkles, RefreshCw, Layers, Table, ChevronRight, Send, Menu, X, FileText, Clock } from 'lucide-react';
import { ToastContainer, toast } from './toast';
import { UploadZone } from './components/UploadZone';
import { StatsDashboard } from './components/StatsDashboard';
import { TableView } from './components/TableView';
import { DetailModal } from './components/DetailModal';
import { BatchMailer } from './components/BatchMailer';
import { QuickSend } from './components/QuickSend';
import { BulkPasteMailer } from './components/BulkPasteMailer';
import { GmailDraftsManager } from './components/GmailDraftsManager';

function App() {
  const [sheetData, setSheetData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'campaign'>('table');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to parse clean current route (supports GitHub Pages subpath /job-portal, 404 ?p= redirect, & hash routes)
  const getCleanRoute = (): string => {
    if (typeof window === 'undefined') return '/';

    // 1. Check URL query param ?p= (from 404.html redirect on GitHub Pages refresh)
    const urlParams = new URLSearchParams(window.location.search);
    const pParam = urlParams.get('p');
    if (pParam) {
      const cleanP = decodeURIComponent(pParam);
      const repoBase = window.location.pathname.startsWith('/job-portal') ? '/job-portal' : '';
      const cleanUrl = `${repoBase}${cleanP.startsWith('/') ? '' : '/'}${cleanP}`;
      window.history.replaceState(null, '', cleanUrl);
      return cleanP.startsWith('/') ? cleanP : `/${cleanP}`;
    }

    // 2. Check hash route e.g. #/gmail-drafts or #/gmail-sent
    if (window.location.hash) {
      const hashRoute = window.location.hash.replace(/^#\/?/, '/');
      if (hashRoute) return hashRoute.startsWith('/') ? hashRoute : `/${hashRoute}`;
    }

    // 3. Check pathname
    let path = window.location.pathname;
    if (path.startsWith('/job-portal')) {
      path = path.slice('/job-portal'.length);
    }
    return path.startsWith('/') ? path : `/${path}`;
  };

  // Client-side router state
  const [route, setRoute] = useState(getCleanRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(getCleanRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = (targetPath: string) => {
    const repoBase = window.location.pathname.startsWith('/job-portal') ? '/job-portal' : '';
    const formattedPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
    const fullUrl = `${repoBase}${formattedPath === '/' ? '/' : formattedPath}`;

    window.history.pushState({}, '', fullUrl);
    setRoute(formattedPath);
    setMobileMenuOpen(false);
  };

  const handleDataLoaded = (data: any[], colHeaders: string[], name: string) => {
    // Find the email column key dynamically
    const emailColKey = colHeaders.find(key => 
      key.toLowerCase().includes('email') || 
      key.toLowerCase().includes('mail')
    );

    let filteredData = data;
    if (emailColKey) {
      // Exclude deepashree.v@skience.com
      const cleanedData = data.filter(row => {
        const email = String(row[emailColKey] || '').trim().toLowerCase();
        return email !== 'deepashree.v@skience.com';
      });

      // Skip the starting 20 valid email contacts
      let skippedEmailCount = 0;
      filteredData = cleanedData.filter(row => {
        const email = String(row[emailColKey] || '').trim();
        const isValid = email && email.includes('@');
        if (isValid) {
          skippedEmailCount++;
          if (skippedEmailCount <= 20) {
            return false; // Skip the first 20 valid email contacts
          }
        }
        return true;
      });
    }

    setSheetData(filteredData);
    setHeaders(colHeaders);
    setFileName(name);
    setActiveTab('table'); // Default to table view when data is loaded

    toast.success(`📁 File uploaded successfully! Loaded ${filteredData.length} HR contacts from ${name}`);
  };

  const handleReset = () => {
    setSheetData(null);
    setHeaders([]);
    setFileName('');
    setSelectedContact(null);
    toast.info("Upload zone reset. You can load a new sheet now.");
  };

  const cleanRoute = route.replace(/\/+$/, '') || '/';

  return (
    <div className="container">
      <ToastContainer />
      {/* Brand Header & Main Routes Navigation */}
      <header className="app-header">
        <div className="brand-section" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div className="brand-icon-wrapper">
            <FileSpreadsheet size={24} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 className="brand-title">SheetSync</h1>
            <p className="brand-subtitle desktop-only">Interactive Lead & Bulk Mailer Suite</p>
          </div>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className="mobile-hamburger-btn"
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            padding: '0.5rem',
            borderRadius: '10px',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Desktop Navigation */}
        <nav className="desktop-nav-bar" style={{ display: 'flex', gap: '0.35rem', background: '#ffffff', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className={cleanRoute === '/' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', border: 'none', background: cleanRoute === '/' ? undefined : 'transparent' }}
          >
            <Table size={14} style={{ marginRight: '0.25rem' }} />
            Contacts Manager
          </button>
          
          <button
            type="button"
            className={cleanRoute === '/direct-send' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/direct-send')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', border: 'none', background: cleanRoute === '/direct-send' ? undefined : 'transparent' }}
          >
            <Send size={14} style={{ marginRight: '0.25rem' }} />
            Quick Direct Mail
          </button>

          <button
            type="button"
            className={cleanRoute === '/bulk-paste' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/bulk-paste')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', border: 'none', background: cleanRoute === '/bulk-paste' ? undefined : 'transparent' }}
          >
            <Layers size={14} style={{ marginRight: '0.25rem' }} />
            Bulk Paste Mailer
          </button>

          <button
            type="button"
            className={cleanRoute === '/gmail-drafts' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/gmail-drafts')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', border: 'none', background: cleanRoute === '/gmail-drafts' ? undefined : 'transparent' }}
          >
            <FileText size={14} style={{ marginRight: '0.25rem' }} />
            My Gmail Drafts
          </button>

          <button
            type="button"
            className={cleanRoute === '/gmail-sent' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/gmail-sent')}
            style={{ 
              padding: '0.45rem 0.85rem', 
              fontSize: '0.8rem', 
              border: 'none', 
              background: cleanRoute === '/gmail-sent' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              color: cleanRoute === '/gmail-sent' ? '#ffffff' : '#d97706'
            }}
          >
            <Clock size={14} style={{ marginRight: '0.25rem' }} />
            Previous Sent Mails
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }} className="desktop-only">
          <Sparkles size={16} style={{ color: '#4f46e5' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Active Mode: SMTP Enabled
          </span>
        </div>
      </header>

      {/* Mobile Hamburger Expandable Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-menu"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '0.75rem',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-lg)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.5rem' }}>
            Navigation Sections
          </div>

          <button
            type="button"
            onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none',
              background: cleanRoute === '/' ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
              color: cleanRoute === '/' ? '#4f46e5' : '#0f172a', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <Table size={18} style={{ color: '#4f46e5' }} /> Contacts Manager
          </button>

          <button
            type="button"
            onClick={() => { navigate('/direct-send'); setMobileMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none',
              background: cleanRoute === '/direct-send' ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
              color: cleanRoute === '/direct-send' ? '#4f46e5' : '#0f172a', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <Send size={18} style={{ color: '#4f46e5' }} /> Quick Direct Mail
          </button>

          <button
            type="button"
            onClick={() => { navigate('/bulk-paste'); setMobileMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none',
              background: cleanRoute === '/bulk-paste' ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
              color: cleanRoute === '/bulk-paste' ? '#4f46e5' : '#0f172a', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <Layers size={18} style={{ color: '#4f46e5' }} /> Bulk Paste Mailer
          </button>

          <button
            type="button"
            onClick={() => { navigate('/gmail-drafts'); setMobileMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none',
              background: cleanRoute === '/gmail-drafts' ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
              color: cleanRoute === '/gmail-drafts' ? '#4f46e5' : '#0f172a', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <FileText size={18} style={{ color: '#4f46e5' }} /> My Gmail Drafts
          </button>

          <button
            type="button"
            onClick={() => { navigate('/gmail-sent'); setMobileMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none',
              background: cleanRoute === '/gmail-sent' ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
              color: cleanRoute === '/gmail-sent' ? '#d97706' : '#0f172a', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <Clock size={18} style={{ color: '#f59e0b' }} /> Previous Sent Mails
          </button>
        </div>
      )}

      {/* Route Switcher Render */}
      {cleanRoute === '/gmail-sent' ? (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Previous Sent Mails History</span>
          </div>
          <GmailDraftsManager initialFolder="sent" />
        </div>
      ) : cleanRoute === '/gmail-drafts' ? (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>My Gmail Drafts</span>
          </div>
          <GmailDraftsManager initialFolder="drafts" />
        </div>
      ) : cleanRoute === '/bulk-paste' ? (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Breadcrumb back navigation link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Bulk Paste Mailer</span>
          </div>

          <BulkPasteMailer />
        </div>
      ) : cleanRoute === '/direct-send' ? (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Breadcrumb back navigation link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Quick Direct Mail</span>
          </div>

          <QuickSend />
        </div>
      ) : (
        /* Main Home Route "/" */
        <div>
          {!sheetData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.4s ease' }}>
              <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                  Explore, Batch & Apply
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
                  A programmatically automated recruiter messaging suite. Load your spreadsheet, manage Gmail drafts, or send bulk emails to recruiters directly.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={() => navigate('/gmail-drafts')}
                    style={{ fontSize: '0.9rem' }}
                  >
                    <FileText size={16} />
                    My Gmail Drafts
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => navigate('/gmail-sent')}
                    style={{ fontSize: '0.9rem', color: '#d97706', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                  >
                    <Clock size={16} />
                    Previous Sent Mails
                  </button>
                </div>
              </div>
              
              <UploadZone onDataLoaded={handleDataLoaded} />
            </div>
          ) : (
            /* Contact View & Campaigns Inner Navigation Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.4s ease' }}>
              
              {/* File Status Bar */}
              <div className="glass-card" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '1rem 1.5rem',
                borderLeft: '4px solid var(--accent-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem', borderRadius: '8px', color: '#818cf8', display: 'flex' }}>
                    <Layers size={20} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Active Sheet
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {fileName}
                    </span>
                  </div>
                </div>
                
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleReset}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', gap: '0.35rem' }}
                >
                  <RefreshCw size={14} />
                  Upload Different File
                </button>
              </div>

              {/* View Mode Switcher */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <button
                  type="button"
                  className={activeTab === 'table' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setActiveTab('table')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Table size={14} />
                  Contacts Table ({sheetData.length})
                </button>
                
                <button
                  type="button"
                  className={activeTab === 'campaign' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setActiveTab('campaign')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Send size={14} />
                  Batch Email Campaign
                </button>
              </div>

              {/* Dashboard stats */}
              <StatsDashboard data={sheetData} />

              {/* View Content */}
              {activeTab === 'table' ? (
                <TableView 
                  data={sheetData} 
                  headers={headers} 
                  onRowClick={(contact: any) => setSelectedContact(contact)} 
                />
              ) : (
                <BatchMailer data={sheetData} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Contact detail modal */}
      {selectedContact && (
        <DetailModal 
          contact={selectedContact} 
          headers={headers} 
          onClose={() => setSelectedContact(null)} 
        />
      )}
    </div>
  );
}

export default App;
