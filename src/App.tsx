import { useState, useEffect } from 'react';
import { FileSpreadsheet, Sparkles, RefreshCw, Layers, Table, Mail, ChevronRight, Send, Building } from 'lucide-react';
import { UploadZone } from './components/UploadZone';
import { StatsDashboard } from './components/StatsDashboard';
import { TableView } from './components/TableView';
import { DetailModal } from './components/DetailModal';
import { BatchMailer } from './components/BatchMailer';
import { QuickSend } from './components/QuickSend';
import { BulkPasteMailer } from './components/BulkPasteMailer';
import { FintechDirectory } from './components/FintechDirectory';

function App() {
  const [sheetData, setSheetData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'campaign'>('table');

  // Client-side router state ('/' | '/jobs' | '/agent')
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

  const handleImportLeads = (newLeads: Array<{ company: string; email: string; recruiter: string; designation: string; url?: string }>) => {
    let targetHeaders = headers.length > 0 ? [...headers] : ['Contact Name', 'Email Address', 'Designation', 'Company'];
    
    // Ensure we have an Email header
    const hasEmailHeader = targetHeaders.some(h => 
      h.toLowerCase().includes('email') || 
      h.toLowerCase().includes('mail')
    );
    if (!hasEmailHeader) {
      targetHeaders.push('Email Address');
    }
    
    // Ensure we have a Name/Contact header
    const hasNameHeader = targetHeaders.some(h => 
      h.toLowerCase().includes('name') || 
      h.toLowerCase().includes('contact') || 
      h.toLowerCase().includes('recruiter')
    );
    if (!hasNameHeader) {
      targetHeaders.push('Contact Name');
    }

    // Update parent headers state if new columns were appended
    if (headers.length > 0 && (!hasEmailHeader || !hasNameHeader)) {
      setHeaders(targetHeaders);
    }
    
    const newRecords = newLeads.map(lead => {
      const newRecord: Record<string, any> = {};
      targetHeaders.forEach(header => {
        const h = header.toLowerCase();
        if (h.includes('company') || h.includes('organization') || h.includes('firm')) {
          newRecord[header] = lead.company;
        } else if (h.includes('email') || h.includes('mail')) {
          newRecord[header] = lead.email;
        } else if (h.includes('name') || h.includes('contact') || h.includes('recruiter')) {
          newRecord[header] = lead.recruiter || 'Hiring Manager';
        } else if (h.includes('designation') || h.includes('role') || h.includes('title')) {
          newRecord[header] = lead.designation || 'Frontend Developer';
        } else {
          newRecord[header] = '';
        }
      });
      return newRecord;
    });

    setSheetData(prev => {
      if (!prev) return newRecords;
      // Guarantee all previous rows contain the new keys to maintain shape alignment
      const alignedPrev = prev.map(row => {
        const alignedRow = { ...row };
        targetHeaders.forEach(h => {
          if (alignedRow[h] === undefined) {
            alignedRow[h] = '';
          }
        });
        return alignedRow;
      });
      return [...alignedPrev, ...newRecords];
    });

    if (headers.length === 0) {
      setHeaders(targetHeaders);
      setFileName('Imported_AI_Leads.xlsx');
    }

    // Automatically navigate back to Contacts Manager home '/' and open Campaign tab
    navigate('/');
    setActiveTab('campaign');
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
            <h1 className="brand-title">SheetSync Campaign</h1>
            <p className="brand-subtitle">Interactive Lead & Bulk Mailer Suite</p>
          </div>
        </div>

        {/* Client Route Tabs */}
        <nav style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-glass)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className={route === '/' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/')}
            style={{ 
              padding: '0.45rem 0.85rem', 
              fontSize: '0.8rem', 
              border: 'none', 
              background: route === '/' ? undefined : 'transparent' 
            }}
          >
            <Table size={14} style={{ marginRight: '0.25rem' }} />
            Contacts Manager
          </button>
          
          <button
            type="button"
            className={route === '/direct-send' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/direct-send')}
            style={{ 
              padding: '0.45rem 0.85rem', 
              fontSize: '0.8rem', 
              border: 'none', 
              background: route === '/direct-send' ? undefined : 'transparent' 
            }}
          >
            <Send size={14} style={{ marginRight: '0.25rem' }} />
            Quick Direct Mail
          </button>

          <button
            type="button"
            className={route === '/bulk-paste' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/bulk-paste')}
            style={{ 
              padding: '0.45rem 0.85rem', 
              fontSize: '0.8rem', 
              border: 'none', 
              background: route === '/bulk-paste' ? undefined : 'transparent' 
            }}
          >
            <Layers size={14} style={{ marginRight: '0.25rem' }} />
            Bulk Paste Mailer
          </button>

          <button
            type="button"
            className={route === '/fintech-dir' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => navigate('/fintech-dir')}
            style={{ 
              padding: '0.45rem 0.85rem', 
              fontSize: '0.8rem', 
              border: 'none', 
              background: route === '/fintech-dir' ? undefined : 'transparent',
              borderColor: route === '/fintech-dir' ? undefined : 'rgba(245, 158, 11, 0.3)',
              color: route === '/fintech-dir' ? undefined : '#f59e0b'
            }}
          >
            <Building size={14} style={{ marginRight: '0.25rem' }} />
            Fintech Directory NCR
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }} className="desktop-only">
          <Sparkles size={16} style={{ color: '#c084fc' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Active Mode: SMTP Enabled
          </span>
        </div>
      </header>

      {/* Route Switcher Render */}
      {route === '/fintech-dir' ? (
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
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f3f4f6' }}>
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
                    style={{ fontSize: '0.9rem', background: '#f59e0b', borderColor: '#f59e0b', color: '#090d16' }}
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
