import React, { useState } from 'react';
import { Search, Loader2, Import, ExternalLink, Check, Briefcase, MapPin, Calendar, Download } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  created: string;
  source: string;
  email?: string;
  recruiter?: string;
  emailSource?: 'api' | 'predicted';
}

interface JobRadarProps {
  onImportLeads: (leads: Array<{ company: string; email: string; recruiter: string; designation: string; url?: string }>) => void;
}

export const JobRadar: React.FC<JobRadarProps> = ({ onImportLeads }) => {
  const [jobTitle, setJobTitle] = useState('React Developer');
  const [location, setLocation] = useState('India');
  const [rapidApiKey, setRapidApiKey] = useState(() => localStorage.getItem('sheetSync_rapidApiKey') || '50ebd37776msh995124d6d037dc3p1edb03jsn0970876d5d1e');
  const [timeframe, setTimeframe] = useState('2d'); // '24h' | '2d' | '7d'
  const [source, setSource] = useState('adzuna'); // default to 'adzuna' (free!)
  const [adzunaAppId, setAdzunaAppId] = useState(() => localStorage.getItem('sheetSync_adzunaAppId') || '');
  const [adzunaAppKey, setAdzunaAppKey] = useState(() => localStorage.getItem('sheetSync_adzunaAppKey') || '');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedJobIds, setImportedJobIds] = useState<Record<string, boolean>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Save keys to local storage
    localStorage.setItem('sheetSync_rapidApiKey', rapidApiKey);
    localStorage.setItem('sheetSync_adzunaAppId', adzunaAppId);
    localStorage.setItem('sheetSync_adzunaAppKey', adzunaAppKey);

    try {
      const response = await fetch(
        `http://localhost:3001/api/search-jobs?query=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(location)}&apiKey=${encodeURIComponent(rapidApiKey)}&timeframe=${timeframe}&source=${source}&adzunaId=${encodeURIComponent(adzunaAppId)}&adzunaKey=${encodeURIComponent(adzunaAppKey)}`
      );
      if (!response.ok) {
        throw new Error('Local server failed to search jobs.');
      }
      const data = await response.json();
      if (data.success && data.jobs) {
        setJobs(data.jobs);
      } else {
        throw new Error(data.message || 'No jobs returned.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect to local Node server. Make sure "npm run server" is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportLead = (job: Job) => {
    if (importedJobIds[job.id]) return;

    onImportLeads([{
      company: job.company,
      email: job.email || `hr@${job.company.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15)}.com`,
      recruiter: job.recruiter || 'Hiring Manager',
      designation: job.title,
      url: job.url
    }]);

    // Mark as imported
    setImportedJobIds(prev => ({ ...prev, [job.id]: true }));
  };

  const handleImportAll = () => {
    const unimportedJobs = jobs.filter(j => !importedJobIds[j.id]);
    if (unimportedJobs.length === 0) return;

    const leadsToImport = unimportedJobs.map(job => ({
      company: job.company,
      email: job.email || `hr@${job.company.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15)}.com`,
      recruiter: job.recruiter || 'Hiring Manager',
      designation: job.title,
      url: job.url
    }));

    onImportLeads(leadsToImport);

    const newImports = { ...importedJobIds };
    jobs.forEach(j => {
      newImports[j.id] = true;
    });
    setImportedJobIds(newImports);
  };

  const handleDownloadCSV = () => {
    if (jobs.length === 0) return;
    
    const csvHeaders = ['Company', 'Job Title', 'Location', 'Job URL', 'Posted Date', 'Recruiter Name', 'HR Email Address'];
    const csvRows = jobs.map(job => [
      `"${job.company.replace(/"/g, '""')}"`,
      `"${job.title.replace(/"/g, '""')}"`,
      `"${job.location.replace(/"/g, '""')}"`,
      `"${job.url.replace(/"/g, '""')}"`,
      `"${job.created.replace(/"/g, '""')}"`,
      `"${(job.recruiter || 'Hiring Manager').replace(/"/g, '""')}"`,
      `"${(job.email || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Scanned_LinkedIn_Jobs.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to format iso date strings to friendly text
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Search Header Form */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Briefcase size={20} style={{ color: '#818cf8' }} />
          <h3 className="upload-title" style={{ fontSize: '1.25rem', marginBottom: 0 }}>Job Search Radar</h3>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 2, minWidth: '200px' }}>
              <label className="modal-label">Job Title / Position</label>
              <input
                type="text"
                placeholder="e.g. React Developer, Frontend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '1rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '150px' }}>
              <label className="modal-label">Location</label>
              <input
                type="text"
                placeholder="e.g. India, Ghaziabad, Noida"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '1rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '130px' }}>
              <label className="modal-label">Source Platform</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '0.5rem', height: '42px', background: '#111827', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
              >
                <option value="adzuna">Adzuna Only (Free)</option>
                <option value="linkedin">LinkedIn Only (RapidAPI)</option>
                <option value="all">Indeed / JSearch (RapidAPI)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '130px' }}>
              <label className="modal-label">Posted Within</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '0.5rem', height: '42px', background: '#111827', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
              >
                <option value="24h">Last 24 Hours</option>
                <option value="2d">Last 2 Days (48h)</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ height: '42px', padding: '0.75rem 1.5rem', minWidth: '150px' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Scan Open Jobs
                </>
              )}
            </button>
          </div>

          {source === 'adzuna' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid rgba(75, 85, 99, 0.15)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: 0 }}>
                  🔑 Adzuna Credentials (100% Free, 250,000 Free Searches)
                </label>
                <a 
                  href="https://developer.adzuna.com/" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: '0.8rem', color: '#c084fc', textDecoration: 'none', fontWeight: 600 }}
                >
                  Register Free Adzuna Keys
                </a>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '150px' }}>
                  <label className="modal-label" style={{ fontSize: '0.75rem' }}>Adzuna App ID</label>
                  <input
                    type="text"
                    placeholder="Enter your Adzuna App ID..."
                    value={adzunaAppId}
                    onChange={(e) => setAdzunaAppId(e.target.value)}
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 2, minWidth: '200px' }}>
                  <label className="modal-label" style={{ fontSize: '0.75rem' }}>Adzuna App Key</label>
                  <input
                    type="password"
                    placeholder="Enter your Adzuna App Key..."
                    value={adzunaAppKey}
                    onChange={(e) => setAdzunaAppKey(e.target.value)}
                    className="search-input"
                    style={{ paddingLeft: '1rem' }}
                    required
                  />
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                💡 Adzuna is completely free for up to 250,000 queries per month. Your keys will be securely saved locally in your browser.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid rgba(75, 85, 99, 0.15)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: 0 }}>
                  🔑 RapidAPI JSearch Key (Optional for Live LinkedIn & Indeed Jobs)
                </label>
                <a 
                  href="https://rapidapi.com/letscrape-65710217/api/jsearch" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: '0.8rem', color: '#818cf8', textDecoration: 'none' }}
                >
                  Get Free JSearch API Key
                </a>
              </div>
              <input
                type="password"
                placeholder="Paste your RapidAPI Key here to enable real-time LinkedIn, Indeed, Glassdoor scraping..."
                value={rapidApiKey}
                onChange={(e) => setRapidApiKey(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '1rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                💡 If left blank, it will load our curated database of live developer openings in India (Razorpay, Paytm, Cred, Plutos One, Speqto, Skience, Techpile) which you can test and import immediately!
              </span>
            </div>
          )}
        </form>

        {error && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem 1rem', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.85rem'
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Jobs Result Grid */}
      <div>
        {jobs.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Briefcase size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <h3 className="upload-title" style={{ fontSize: '1.2rem' }}>Ready to Scan Jobs</h3>
            <p className="upload-hint" style={{ maxWidth: '400px', margin: '0.25rem auto' }}>
              Enter a job title and location above, then click "Scan Open Jobs" to retrieve active listings from job search aggregators.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>Scanned Jobs Results</h4>
                <p className="upload-hint" style={{ marginBottom: 0 }}>Found {jobs.length} jobs matching your parameters. Import them to start emailing recruiters.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleDownloadCSV}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  title="Download all scanned jobs as a CSV file compatible with Excel"
                >
                  <Download size={14} />
                  Download Excel / CSV
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleImportAll}
                  disabled={jobs.every(j => importedJobIds[j.id])}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#10b981', borderColor: '#10b981' }}
                  title="Import all scanned jobs as leads and open campaigns"
                >
                  <Import size={14} />
                  Import All to Leads ({jobs.filter(j => !importedJobIds[j.id]).length})
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {jobs.map((job) => {
              const isImported = importedJobIds[job.id];
              return (
                <div 
                  key={job.id} 
                  className="glass-card" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1rem',
                    background: isImported ? 'rgba(16, 185, 129, 0.02)' : 'var(--bg-card)',
                    borderColor: isImported ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-color)',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {/* Card Title & Company */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {job.company}
                      </span>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', lineHeight: '1.3' }}>
                        {job.title}
                      </h4>
                    </div>

                    {/* Meta info tags */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={12} />
                        {job.location}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        {formatDate(job.created)}
                      </span>
                    </div>

                    {/* Description snippet */}
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: '1.4' }}>
                      {job.description}
                    </p>

                    {/* Recruiter Email Input & Verification Badge */}
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Recruiter Email ID</span>
                        {job.emailSource === 'api' ? (
                          <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>🟢 Verified HR Mail</span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>🟡 Predicted Fallback</span>
                        )}
                      </div>
                      <input
                        type="email"
                        value={job.email || ''}
                        onChange={(e) => {
                          const updatedJobs = jobs.map(j => j.id === job.id ? { ...j, email: e.target.value } : j);
                          setJobs(updatedJobs);
                        }}
                        style={{
                          fontSize: '0.8rem',
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '0.45rem 0.5rem',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)'
                        }}
                        placeholder="hr@company.com"
                      />
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid rgba(75, 85, 99, 0.15)', paddingTop: '0.85rem' }}>
                    <button
                      type="button"
                      className={isImported ? 'btn-secondary' : 'btn-primary'}
                      style={{ 
                        padding: '0.45rem 0.85rem', 
                        fontSize: '0.8rem', 
                        gap: '0.35rem', 
                        flexGrow: 2, 
                        justifyContent: 'center',
                        background: isImported ? 'rgba(16, 185, 129, 0.1)' : undefined,
                        borderColor: isImported ? 'rgba(16, 185, 129, 0.3)' : undefined,
                        color: isImported ? '#10b981' : undefined
                      }}
                      onClick={() => handleImportLead(job)}
                      title="Add this job company to your contacts list and open campaigns"
                    >
                      {isImported ? (
                        <>
                          <Check size={14} />
                          Imported to Leads
                        </>
                      ) : (
                        <>
                          <Import size={14} />
                          Import to Leads
                        </>
                      )}
                    </button>

                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      title="View original job post details"
                    >
                      <ExternalLink size={14} />
                      Apply
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}
      </div>

    </div>
  );
};
