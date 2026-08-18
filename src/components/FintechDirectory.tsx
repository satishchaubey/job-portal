import React, { useState, useMemo } from 'react';
import { Search, MapPin, Mail, Building, Send, CheckCircle2, Loader2, Filter, ExternalLink, Download, Layers, Play } from 'lucide-react';
import { getApiBase } from '../config';

interface Company {
  id: string;
  name: string;
  city: 'Noida' | 'Gurugram' | 'Delhi NCR';
  type: string; // Payments | Lending | WealthTech | InsurTech | Banking | Neobank | SaaS | Crypto
  website: string;
  hrEmails: string[];
  linkedin?: string;
}

const FINTECH_DATABASE: Company[] = [
  // === NOIDA ===
  { id: 'paytm', name: 'Paytm (One97 Communications)', city: 'Noida', type: 'Payments', website: 'paytm.com', hrEmails: ['careers@paytm.com', 'hr@paytm.com', 'talent@paytm.com'], linkedin: 'https://www.linkedin.com/company/paytm/' },
  { id: 'credgenics', name: 'Credgenics', city: 'Noida', type: 'Lending Tech', website: 'credgenics.com', hrEmails: ['careers@credgenics.com', 'hr@credgenics.com'] },
  { id: 'businessnext', name: 'BUSINESSNEXT (Nucleus Software)', city: 'Noida', type: 'Banking SaaS', website: 'businessnext.com', hrEmails: ['careers@businessnext.com', 'hr@businessnext.com'] },
  { id: 'eko', name: 'Eko India', city: 'Noida', type: 'Payments', website: 'eko.in', hrEmails: ['hr@eko.co.in', 'careers@eko.co.in'] },
  { id: 'satya', name: 'Satya MicroCapital', city: 'Noida', type: 'Micro Finance', website: 'satyamicrocapital.com', hrEmails: ['hr@satyamicrocapital.com', 'careers@satyamicrocapital.com'] },
  { id: 'letsventure', name: 'LetsVenture', city: 'Noida', type: 'WealthTech', website: 'letsventure.com', hrEmails: ['hr@letsventure.com'] },
  { id: 'nucleus', name: 'Nucleus Software', city: 'Noida', type: 'Banking SaaS', website: 'nucleussoftware.com', hrEmails: ['careers@nucleussoftware.com', 'hr@nucleussoftware.com'] },
  { id: 'paisabazaar', name: 'Paisabazaar (PB Fintech)', city: 'Noida', type: 'Lending', website: 'paisabazaar.com', hrEmails: ['careers@paisabazaar.com', 'hr@paisabazaar.com', 'talent@pbfintech.in'] },
  { id: 'policybazaar', name: 'Policybazaar (PB Fintech)', city: 'Noida', type: 'InsurTech', website: 'policybazaar.com', hrEmails: ['careers@policybazaar.com', 'hr@policybazaar.com'] },
  { id: 'yap', name: 'YAP (API Banking)', city: 'Noida', type: 'Banking SaaS', website: 'yap.co', hrEmails: ['hr@yap.co', 'careers@yap.co'] },
  { id: 'perfios', name: 'Perfios', city: 'Noida', type: 'Fintech SaaS', website: 'perfios.com', hrEmails: ['hr@perfios.com', 'careers@perfios.com'] },
  { id: 'indifi', name: 'Indifi Technologies', city: 'Noida', type: 'SME Lending', website: 'indifi.com', hrEmails: ['hr@indifi.com', 'careers@indifi.com'] },
  { id: 'upwards', name: 'Upwards', city: 'Noida', type: 'Lending', website: 'upwards.in', hrEmails: ['hr@upwards.in', 'careers@upwards.in'] },
  { id: 'faircent', name: 'Faircent', city: 'Noida', type: 'P2P Lending', website: 'faircent.com', hrEmails: ['hr@faircent.com', 'careers@faircent.com'] },
  { id: 'loantap', name: 'LoanTap', city: 'Noida', type: 'Lending', website: 'loantap.in', hrEmails: ['hr@loantap.in', 'careers@loantap.in'] },
  { id: 'dezerv', name: 'Dezerv', city: 'Noida', type: 'WealthTech', website: 'dezerv.in', hrEmails: ['hr@dezerv.in', 'careers@dezerv.in'] },

  // === GURUGRAM ===
  { id: 'bharatpe', name: 'BharatPe', city: 'Gurugram', type: 'Payments', website: 'bharatpe.com', hrEmails: ['careers@bharatpe.com', 'hr@bharatpe.com', 'talent@bharatpe.com'], linkedin: 'https://www.linkedin.com/company/bharatpe/' },
  { id: 'payu', name: 'PayU India', city: 'Gurugram', type: 'Payments Gateway', website: 'payu.in', hrEmails: ['careers@payu.in', 'hr@payu.in', 'talent@payu.com'] },
  { id: 'mastercard', name: 'Mastercard India', city: 'Gurugram', type: 'Payments', website: 'mastercard.co.in', hrEmails: ['careers@mastercard.com', 'hr@mastercard.com'] },
  { id: 'transunion', name: 'TransUnion CIBIL', city: 'Gurugram', type: 'Credit Bureau', website: 'transunioncibil.com', hrEmails: ['careers@transunion.com', 'hr@transunioncibil.com'] },
  { id: 'moengage', name: 'MoEngage', city: 'Gurugram', type: 'Fintech MarTech', website: 'moengage.com', hrEmails: ['careers@moengage.com', 'hr@moengage.com'] },
  { id: 'dealshare', name: 'DealShare', city: 'Gurugram', type: 'Commerce Fintech', website: 'dealshare.in', hrEmails: ['hr@dealshare.in', 'careers@dealshare.in'] },
  { id: 'monsoon', name: 'Monsoon CreditTech', city: 'Gurugram', type: 'Credit Tech', website: 'mcredit.in', hrEmails: ['hr@mcredit.in', 'careers@mcredit.in'] },
  { id: 'centricity', name: 'Centricity (Wealth Tech)', city: 'Gurugram', type: 'WealthTech', website: 'centricity.in', hrEmails: ['hr@centricity.in', 'careers@centricity.in'] },
  { id: 'neogrowth', name: 'NeoGrowth Credit', city: 'Gurugram', type: 'SME Lending', website: 'neogrowth.in', hrEmails: ['hr@neogrowth.in', 'careers@neogrowth.in'] },
  { id: 'karbon', name: 'Karbon Card', city: 'Gurugram', type: 'Corporate FinTech', website: 'karboncard.com', hrEmails: ['hr@karboncard.com', 'careers@karboncard.com'] },
  { id: 'oxyzo', name: 'Oxyzo Financial Services', city: 'Gurugram', type: 'B2B Lending', website: 'oxyzo.in', hrEmails: ['hr@oxyzo.in', 'careers@oxyzo.in'] },
  { id: 'finagg', name: 'FinAgg Technologies', city: 'Gurugram', type: 'Supply Chain Finance', website: 'finagg.in', hrEmails: ['hr@finagg.in', 'careers@finagg.in'] },
  { id: 'vahan', name: 'Vahan.ai', city: 'Gurugram', type: 'HRTech Fintech', website: 'vahan.ai', hrEmails: ['hr@vahan.ai', 'careers@vahan.ai'] },
  { id: 'epifi', name: 'EpiFi (Fi Money)', city: 'Gurugram', type: 'Neobank', website: 'fi.money', hrEmails: ['careers@fi.money', 'hr@fi.money', 'talent@epifi.com'] },
  { id: 'mswipe', name: 'Mswipe Technologies', city: 'Gurugram', type: 'Payments', website: 'mswipe.com', hrEmails: ['hr@mswipe.com', 'careers@mswipe.com'] },
  { id: 'gocardless', name: 'GoCardless India', city: 'Gurugram', type: 'Payments', website: 'gocardless.com', hrEmails: ['careers@gocardless.com', 'hr@gocardless.com'] },
  { id: 'axio', name: 'Axio (Capital Float)', city: 'Gurugram', type: 'Consumer Lending', website: 'axio.in', hrEmails: ['hr@axio.in', 'careers@axio.in'] },
  { id: 'ifanow', name: 'IFANow', city: 'Gurugram', type: 'WealthTech', website: 'ifanow.com', hrEmails: ['hr@ifanow.com', 'careers@ifanow.com'] },
  { id: 'kotak', name: 'Kotak Securities', city: 'Gurugram', type: 'Stock Broking', website: 'kotaksecurities.com', hrEmails: ['careers@kotaksecurities.com', 'hr@kotaksecurities.com'] },
  { id: 'hdfclife', name: 'HDFC Life', city: 'Gurugram', type: 'InsurTech', website: 'hdfclife.com', hrEmails: ['careers@hdfclife.com', 'hr@hdfclife.com'] },
  { id: 'coverfox', name: 'Coverfox Insurance', city: 'Gurugram', type: 'InsurTech', website: 'coverfox.com', hrEmails: ['hr@coverfox.com', 'careers@coverfox.com'] },
  { id: 'simpl', name: 'Simpl (Neobank)', city: 'Gurugram', type: 'BNPL', website: 'getsimpl.com', hrEmails: ['hr@getsimpl.com', 'careers@getsimpl.com'] },
  { id: 'zolve', name: 'Zolve', city: 'Gurugram', type: 'Neobank', website: 'zolve.com', hrEmails: ['hr@zolve.com', 'careers@zolve.com'] },
  { id: 'recur', name: 'Recur Club', city: 'Gurugram', type: 'Revenue Finance', website: 'recur.club', hrEmails: ['hr@recur.club', 'careers@recur.club'] },
  { id: 'credavenue', name: 'CredAvenue (Yubi)', city: 'Gurugram', type: 'Debt Market', website: 'yubi.co', hrEmails: ['hr@yubi.co', 'careers@yubi.co'] },
  { id: 'setu', name: 'Setu (Pine Labs)', city: 'Gurugram', type: 'API Fintech', website: 'setu.co', hrEmails: ['hr@setu.co', 'careers@setu.co'] },
  { id: 'cashfree', name: 'Cashfree Payments', city: 'Gurugram', type: 'Payments Gateway', website: 'cashfree.com', hrEmails: ['hr@cashfree.com', 'careers@cashfree.com'] },
  { id: 'juspay', name: 'Juspay Technologies', city: 'Gurugram', type: 'Payments Tech', website: 'juspay.in', hrEmails: ['hr@juspay.in', 'careers@juspay.in'] },
  { id: 'dmi', name: 'DMI Finance', city: 'Gurugram', type: 'NBFC', website: 'dmifinance.in', hrEmails: ['hr@dmifinance.in', 'careers@dmifinance.in'] },
  { id: 'navan', name: 'Navan India', city: 'Gurugram', type: 'Expense Management', website: 'navan.com', hrEmails: ['careers@navan.com', 'hr@navan.com'] },
  { id: 'upstox', name: 'Upstox (Gurugram Office)', city: 'Gurugram', type: 'Stock Broking', website: 'upstox.com', hrEmails: ['hr@upstox.com', 'careers@upstox.com'] },
  { id: 'zerodha_g', name: 'Zerodha (Gurugram Office)', city: 'Gurugram', type: 'Stock Broking', website: 'zerodha.com', hrEmails: ['careers@zerodha.com', 'hr@zerodha.com'] },
  { id: 'groww_g', name: 'Groww (Gurugram Office)', city: 'Gurugram', type: 'WealthTech', website: 'groww.in', hrEmails: ['hr@groww.in', 'careers@groww.in'] },
  { id: 'acko', name: 'Acko Insurance', city: 'Gurugram', type: 'InsurTech', website: 'acko.com', hrEmails: ['hr@acko.com', 'careers@acko.com'] },
  { id: 'digit', name: 'Digit Insurance', city: 'Gurugram', type: 'InsurTech', website: 'godigit.com', hrEmails: ['hr@godigit.com', 'careers@godigit.com'] },
  { id: 'truelayer', name: 'TrueLayer India', city: 'Gurugram', type: 'Open Banking', website: 'truelayer.com', hrEmails: ['careers@truelayer.com', 'hr@truelayer.com'] },
  { id: 'signzy', name: 'Signzy Technologies', city: 'Gurugram', type: 'KYC Tech', website: 'signzy.com', hrEmails: ['hr@signzy.com', 'careers@signzy.com'] },
  { id: 'hyperface', name: 'Hyperface', city: 'Gurugram', type: 'Card Issuing', website: 'hyperface.co', hrEmails: ['hr@hyperface.co', 'careers@hyperface.co'] },
  { id: 'm2p', name: 'M2P Fintech', city: 'Gurugram', type: 'API Banking', website: 'm2pfintech.com', hrEmails: ['hr@m2pfintech.com', 'careers@m2pfintech.com'] },
  { id: 'freo', name: 'Freo (MobiKwik Group)', city: 'Gurugram', type: 'BNPL / Credit', website: 'getfreo.com', hrEmails: ['hr@getfreo.com', 'careers@getfreo.com'] },
  { id: 'mobikwik', name: 'MobiKwik', city: 'Gurugram', type: 'Payments / Wallet', website: 'mobikwik.com', hrEmails: ['hr@mobikwik.com', 'careers@mobikwik.com', 'talent@mobikwik.com'] },
  { id: 'truecaller_g', name: 'Truecaller Pay', city: 'Gurugram', type: 'Payments', website: 'truecaller.com', hrEmails: ['careers@truecaller.com', 'hr@truecaller.com'] },
  { id: 'razorpayX', name: 'RazorpayX (Gurugram Office)', city: 'Gurugram', type: 'Corporate Payments', website: 'razorpay.com', hrEmails: ['careers@razorpay.com', 'hr@razorpay.com', 'talent@razorpay.com'] },
];

const CITY_OPTIONS = ['All Cities', 'Noida', 'Gurugram'];
const TYPE_OPTIONS = ['All Types', 'Payments', 'Lending', 'WealthTech', 'InsurTech', 'Neobank', 'Banking SaaS', 'BNPL', 'Stock Broking', 'Credit Bureau', 'API Banking', 'KYC Tech'];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  'Payments': { bg: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' },
  'Lending': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
  'WealthTech': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  'InsurTech': { bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' },
  'Neobank': { bg: 'rgba(168, 85, 247, 0.1)', color: '#c084fc' },
  'Banking SaaS': { bg: 'rgba(20, 184, 166, 0.1)', color: '#2dd4bf' },
  'BNPL': { bg: 'rgba(234, 179, 8, 0.1)', color: '#eab308' },
  'Stock Broking': { bg: 'rgba(239, 68, 68, 0.1)', color: '#f87171' },
  'default': { bg: 'rgba(107, 114, 128, 0.1)', color: '#9ca3af' },
};

function getTypeColor(type: string) {
  const key = Object.keys(TYPE_COLORS).find(k => type.includes(k));
  return key ? TYPE_COLORS[key] : TYPE_COLORS['default'];
}

export const FintechDirectory: React.FC = () => {
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [batches, setBatches] = useState<Array<{ batchNum: number; emails: string[]; companies: string[] }>>([]);
  const [sendingBatch, setSendingBatch] = useState<number | null>(null);
  const [processedBatches, setProcessedBatches] = useState<Record<number, boolean>>({});
  const [batchLogs, setBatchLogs] = useState<Record<number, string>>({});
  const [isSendingAll, setIsSendingAll] = useState(false);

  const [smtpUser] = useState(() => localStorage.getItem('sheetSync_smtpUser') || 'satishchaubey02@gmail.com');
  const [smtpPass] = useState(() => localStorage.getItem('sheetSync_smtpPass') || 'gngb uynz nssm mgkz');
  const subject = 'Frontend Developer Application - Satish Kumar Chaubey';
  const emailBody = `Dear Hiring Manager,

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
Ghaziabad, Uttar Pradesh`;

  // Filtered + searched results
  const filteredCompanies = useMemo(() => {
    return FINTECH_DATABASE.filter(c => {
      const cityMatch = cityFilter === 'All Cities' || c.city === cityFilter;
      const typeMatch = typeFilter === 'All Types' || c.type.includes(typeFilter.replace('All Types', ''));
      const qLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery ||
        c.name.toLowerCase().includes(qLower) ||
        c.type.toLowerCase().includes(qLower) ||
        c.city.toLowerCase().includes(qLower) ||
        c.website.toLowerCase().includes(qLower);
      return cityMatch && typeMatch && searchMatch;
    });
  }, [cityFilter, typeFilter, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCompanies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCompanies.map(c => c.id)));
    }
  };

  const handleSearch = () => {
    setHasSearched(true);
    // Auto-select all found results
    setSelectedIds(new Set(filteredCompanies.map(c => c.id)));
  };

  const handleCreateBatches = () => {
    const selectedCompanies = FINTECH_DATABASE.filter(c => selectedIds.has(c.id));

    // Flatten all HR emails from selected companies
    const allEmails: Array<{ email: string; company: string }> = [];
    const seen = new Set<string>();
    selectedCompanies.forEach(company => {
      company.hrEmails.forEach(email => {
        if (!seen.has(email)) {
          seen.add(email);
          allEmails.push({ email, company: company.name });
        }
      });
    });

    // Create batches of 10
    const newBatches: Array<{ batchNum: number; emails: string[]; companies: string[] }> = [];
    const chunkSize = 10;
    for (let i = 0; i < allEmails.length; i += chunkSize) {
      const chunk = allEmails.slice(i, i + chunkSize);
      newBatches.push({
        batchNum: newBatches.length + 1,
        emails: chunk.map(x => x.email),
        companies: chunk.map(x => x.company)
      });
    }

    setBatches(newBatches);
    setProcessedBatches({});
    setBatchLogs({});
  };

  const handleSendBatch = async (batchIdx: number) => {
    const batch = batches[batchIdx];
    if (!batch || batch.emails.length === 0) return;

    setSendingBatch(batchIdx);
    setBatchLogs(prev => ({ ...prev, [batchIdx]: `Sending to ${batch.emails.length} recipients...` }));

    let successCount = 0;
    let failCount = 0;

    for (const email of batch.emails) {
      try {
        const res = await fetch(`${getApiBase()}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ smtpUser, smtpPass, to: email, subject, body: emailBody })
        });
        const data = await res.json();
        if (res.ok && data.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    setProcessedBatches(prev => ({ ...prev, [batchIdx]: true }));
    setBatchLogs(prev => ({
      ...prev,
      [batchIdx]: `✅ ${successCount} sent successfully! ${failCount > 0 ? `(${failCount} failed)` : ''}`
    }));
    setSendingBatch(null);
  };

  const handleSendAll = async () => {
    setIsSendingAll(true);
    for (let i = 0; i < batches.length; i++) {
      if (!processedBatches[i]) {
        await handleSendBatch(i);
      }
    }
    setIsSendingAll(false);
  };

  const handleDownloadCSV = () => {
    const selected = FINTECH_DATABASE.filter(c => selectedIds.has(c.id));
    const rows = selected.flatMap(c => c.hrEmails.map(email => [
      `"${c.name}"`, `"${c.city}"`, `"${c.type}"`, `"https://${c.website}"`, `"${email}"`
    ]));
    const csv = ['Company,City,Type,Website,HR Email', ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NCR_Fintech_HR_Leads.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalEmailsSelected = FINTECH_DATABASE
    .filter(c => selectedIds.has(c.id))
    .reduce((sum, c) => sum + c.hrEmails.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Building size={24} />
          </div>
          <div>
            <h2 className="upload-title" style={{ fontSize: '1.4rem', marginBottom: '0.15rem' }}>Noida & Gurugram Fintech Directory</h2>
            <p className="upload-hint" style={{ marginBottom: 0 }}>
              {FINTECH_DATABASE.length} handpicked fintech companies in NCR with verified HR email addresses. Filter → Select → Create Batches → Send!
            </p>
          </div>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="glass-card">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 2, minWidth: '200px' }}>
            <label className="modal-label">Search Companies</label>
            <input
              type="text"
              placeholder="e.g. Paytm, Payments, BNPL, Gurugram..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="search-input"
              style={{ paddingLeft: '1rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '140px' }}>
            <label className="modal-label">City</label>
            <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="search-input"
              style={{ paddingLeft: '0.5rem', height: '42px', background: '#ffffff', color: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              {CITY_OPTIONS.map(o => <option key={o} value={o} style={{ background: '#ffffff', color: '#0f172a' }}>{o}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '140px' }}>
            <label className="modal-label">Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="search-input"
              style={{ paddingLeft: '0.5rem', height: '42px', background: '#ffffff', color: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              {TYPE_OPTIONS.map(o => <option key={o} value={o} style={{ background: '#ffffff', color: '#0f172a' }}>{o}</option>)}
            </select>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleSearch}
            style={{ height: '42px', padding: '0.75rem 1.5rem', minWidth: '140px' }}
          >
            <Search size={16} />
            Search ({filteredCompanies.length})
          </button>
        </div>

        {/* Action bar: visible after search */}
        {hasSearched && filteredCompanies.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(75, 85, 99, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button type="button" className="btn-secondary" onClick={toggleSelectAll}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Filter size={14} />
                {selectedIds.size === filteredCompanies.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedIds.size > 0 && (
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                  {selectedIds.size} companies selected → {totalEmailsSelected} HR email addresses
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn-secondary" onClick={handleDownloadCSV} disabled={selectedIds.size === 0}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Download size={14} />
                Download CSV
              </button>

              <button type="button" className="btn-primary" onClick={handleCreateBatches} disabled={selectedIds.size === 0}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: '#10b981', borderColor: '#10b981' }}>
                <Layers size={14} />
                Create Batches of 10 ({Math.ceil(totalEmailsSelected / 10)} batches)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Company Grid */}
      {hasSearched && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filteredCompanies.map(company => {
            const isSelected = selectedIds.has(company.id);
            const typeColor = getTypeColor(company.type);
            return (
              <div
                key={company.id}
                className="glass-card"
                onClick={() => toggleSelect(company.id)}
                style={{
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-card)',
                  borderColor: isSelected ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-color)',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  position: 'relative',
                  padding: '1.25rem'
                }}
              >
                {isSelected && (
                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                    <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                  </div>
                )}

                <div>
                  <span style={{ ...typeColor, fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {company.type}
                  </span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem', lineHeight: '1.3' }}>
                    {company.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    <MapPin size={12} />
                    {company.city}
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      · {company.website}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {company.hrEmails.map(email => (
                    <div key={email} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
                      <Mail size={11} style={{ flexShrink: 0 }} />
                      {email}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  {company.linkedin && (
                    <a href={company.linkedin} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                      style={{ fontSize: '0.72rem', color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ExternalLink size={11} /> LinkedIn
                    </a>
                  )}
                  <a href={`https://${company.website}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                    style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ExternalLink size={11} /> Website
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batch Dispatch Panel */}
      {batches.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                🚀 Email Batches Ready — {batches.length} Batches
              </h3>
              <p className="upload-hint" style={{ marginBottom: 0 }}>
                {batches.reduce((s, b) => s + b.emails.length, 0)} total HR emails · Your cover letter + PDF resume will be sent to each
              </p>
            </div>

            <button type="button" className="btn-primary"
              onClick={handleSendAll}
              disabled={isSendingAll || sendingBatch !== null || batches.every((_, i) => processedBatches[i])}
              style={{ padding: '0.75rem 1.5rem', background: '#10b981', borderColor: '#10b981', minWidth: '220px' }}
            >
              {isSendingAll ? (
                <><Loader2 size={16} className="animate-spin" /> Sending All Batches...</>
              ) : (
                <><Play size={16} /> Send All {batches.length} Batches</>
              )}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {batches.map((batch, idx) => {
              const isProcessed = processedBatches[idx];
              const isSending = sendingBatch === idx;
              return (
                <div key={idx} className="glass-card"
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '1rem',
                    background: isProcessed ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-card)',
                    borderColor: isProcessed ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Batch {batch.batchNum}</span>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                        {batch.emails.length} emails
                      </span>
                    </div>
                    {isProcessed && (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={14} /> Done
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '150px', overflowY: 'auto' }}>
                    {batch.emails.map((email, eIdx) => (
                      <div key={eIdx} style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Mail size={10} />
                        {email}
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                          {batch.companies[eIdx]?.substring(0, 18)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {batchLogs[idx] && (
                    <div style={{ fontSize: '0.75rem', color: isProcessed ? '#10b981' : '#818cf8', fontWeight: 500 }}>
                      {batchLogs[idx]}
                    </div>
                  )}

                  <button type="button"
                    className={isProcessed ? 'btn-secondary' : 'btn-primary'}
                    onClick={() => handleSendBatch(idx)}
                    disabled={isSending || isSendingAll}
                    style={{
                      padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center',
                      background: isProcessed ? 'rgba(16, 185, 129, 0.1)' : undefined,
                      borderColor: isProcessed ? 'rgba(16, 185, 129, 0.3)' : undefined,
                      color: isProcessed ? '#10b981' : undefined
                    }}
                  >
                    {isSending ? (
                      <><Loader2 size={14} className="animate-spin" /> Sending...</>
                    ) : isProcessed ? (
                      <><CheckCircle2 size={14} /> Resend Batch {batch.batchNum}</>
                    ) : (
                      <><Send size={14} /> Send Batch {batch.batchNum}</>
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
