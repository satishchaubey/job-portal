import { useState, useEffect } from 'react';
import { FileSpreadsheet, Sparkles, RefreshCw, Layers, Table, ChevronRight, Send, Building, Zap, Mail, Menu, X } from 'lucide-react';
import { UploadZone } from './components/UploadZone';
import { StatsDashboard } from './components/StatsDashboard';
import { TableView } from './components/TableView';
import { DetailModal } from './components/DetailModal';
import { BatchMailer } from './components/BatchMailer';
import { QuickSend } from './components/QuickSend';
import { BulkPasteMailer } from './components/BulkPasteMailer';
import { FintechDirectory } from './components/FintechDirectory';
import { AIHunt } from './components/AIHunt';

function App() {
  const [sheetData, setSheetData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'campaign'>('table');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Client-side router state
  const [route, setRoute] = useState(window.location.pathname);


  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
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
  };

  const handleReset = () => {
    setSheetData(null);
    setHeaders([]);
    setFileName('');
    setSelectedContact(null);
  };


  return (
    <div className="container">
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
            justify: 'center'
          }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Desktop Navigation */}
        <nav className="desktop-nav-bar" style={{ display: 'flex', gap: '0.35rem', background: '#ffffff', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className={route === '/' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', border: 'none', background: route === '/' ? undefined : 'transparent' }}
          >
            <Table size={14} style={{ marginRight: '0.25rem' }} />
            Contacts Manager
          </button>
          
          <button
            type="button"
            className={route === '/direct-send' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/direct-send')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', border: 'none', background: route === '/direct-send' ? undefined : 'transparent' }}
          >
            <Send size={14} style={{ marginRight: '0.25rem' }} />
            Quick Direct Mail
          </button>

          <button
            type="button"
            className={route === '/bulk-paste' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/bulk-paste')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', border: 'none', background: route === '/bulk-paste' ? undefined : 'transparent' }}
          >
            <Layers size={14} style={{ marginRight: '0.25rem' }} />
            Bulk Paste Mailer
          </button>

          <button
            type="button"
            className={route === '/fintech-dir' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/fintech-dir')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', border: 'none', background: route === '/fintech-dir' ? undefined : 'transparent', color: route === '/fintech-dir' ? undefined : '#f59e0b' }}
          >
            <Building size={14} style={{ marginRight: '0.25rem' }} />
            Fintech Directory NCR
          </button>

          <button
            type="button"
            className={route === '/ai-hunt' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/ai-hunt')}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', border: 'none', background: route === '/ai-hunt' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'transparent', color: route === '/ai-hunt' ? 'white' : '#4f46e5' }}
          >
            <Zap size={14} style={{ marginRight: '0.25rem' }} />
            AI Job Hunter
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
              background: route === '/' ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
              color: route === '/' ? '#4f46e5' : '#0f172a', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <Table size={18} style={{ color: '#4f46e5' }} /> Contacts Manager
          </button>

          <button
            type="button"
            onClick={() => { navigate('/direct-send'); setMobileMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none',
              background: route === '/direct-send' ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
              color: route === '/direct-send' ? '#4f46e5' : '#0f172a', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <Send size={18} style={{ color: '#4f46e5' }} /> Quick Direct Mail
          </button>

          <button
            type="button"
            onClick={() => { navigate('/bulk-paste'); setMobileMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none',
              background: route === '/bulk-paste' ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
              color: route === '/bulk-paste' ? '#4f46e5' : '#0f172a', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <Layers size={18} style={{ color: '#4f46e5' }} /> Bulk Paste Mailer
          </button>

          <button
            type="button"
            onClick={() => { navigate('/fintech-dir'); setMobileMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none',
              background: route === '/fintech-dir' ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
              color: route === '/fintech-dir' ? '#d97706' : '#0f172a', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <Building size={18} style={{ color: '#f59e0b' }} /> Fintech Directory NCR
          </button>

          <button
            type="button"
            onClick={() => { navigate('/ai-hunt'); setMobileMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none',
              background: route === '/ai-hunt' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'transparent',
              color: route === '/ai-hunt' ? '#ffffff' : '#4f46e5', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <Zap size={18} style={{ color: route === '/ai-hunt' ? '#ffffff' : '#4f46e5' }} /> AI Job Hunter
          </button>
        </div>
      )}


      {/* Route Switcher Render */}
      {route === '/ai-hunt' ? (
        /* Full-page light theme — no container wrapper */
        <AIHunt />
      ) : route === '/fintech-dir' ? (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Fintech Directory NCR</span>
          </div>
          <FintechDirectory />
        </div>
      ) : route === '/bulk-paste' ? (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Breadcrumb back navigation link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Bulk Paste Mailer</span>
          </div>

          <BulkPasteMailer />
        </div>
      ) : route === '/direct-send' ? (
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
        /* Main Home Route "/" */
        <div>
          {!sheetData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.4s ease' }}>
              <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                  Explore, Batch & Apply
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
                  A programmatically automated recruiter messaging suite. Load your spreadsheet, browse the Fintech Directory, or send bulk emails to NCR companies directly.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={() => navigate('/fintech-dir')}
                    style={{ fontSize: '0.9rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderColor: '#f59e0b', color: '#ffffff' }}
                  >
                    <Building size={16} />
                    Fintech Directory NCR
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => navigate('/direct-send')}
                    style={{ fontSize: '0.9rem' }}
                  >
                    <Send size={16} />
                    Quick Direct Mail
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

              {/* Navigation Sub-Tabs */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                borderBottom: '1px solid var(--border-color)', 
                paddingBottom: '0.75rem',
                marginTop: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('table')}
                  className={activeTab === 'table' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem', gap: '0.5rem' }}
                >
                  <Table size={16} />
                  Database View
                </button>
                
                <button
                  type="button"
                  onClick={() => setActiveTab('campaign')}
                  className={activeTab === 'campaign' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem', gap: '0.5rem' }}
                >
                  <Mail size={16} />
                  Batch Email Campaign
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === 'table' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
                  <StatsDashboard data={sheetData} />
                  <TableView 
                    data={sheetData} 
                    headers={headers} 
                    onRowClick={(row) => setSelectedContact(row)} 
                  />
                </div>
              ) : (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <BatchMailer data={sheetData} />
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* Selected Contact Details Modal */}
      {selectedContact && (
        <DetailModal
          contact={selectedContact}
          headers={headers}
          onClose={() => setSelectedContact(null)}
        />
      )}

      {/* Footer */}
      <footer style={{ 
        marginTop: 'auto', 
        paddingTop: '2rem', 
        borderTop: '1px solid var(--border-color)', 
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <p>© 2026 SheetSync. Built using React, TypeScript and Vanilla CSS. All file parsing and mail routing occur securely within your browser session.</p>
      </footer>
    </div>
  );
}

export default App;
