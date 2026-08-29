import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import { fileURLToPath } from 'url';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

// Custom DNS lookup that explicitly forces IPv4 address resolution (bypassing cloud IPv6 ENETUNREACH on Render)
const ipv4Lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  return dns.lookup(hostname, { family: 4 }, callback);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Serve public directory statically so resumes can be previewed/downloaded
app.use(express.static(path.join(__dirname, 'public')));

// Allow requests from local dev, mobile browsers, and deployed frontends
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Health check for Render
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─────────────────────────────────────────────────────────────
// RESUME MANAGEMENT: Fetch active resume info & upload updated PDF
// ─────────────────────────────────────────────────────────────
app.get('/api/resume-info', (_req, res) => {
  const resumePath = path.join(__dirname, 'public', 'Satish_Kumar_Chaubey.pdf');
  if (fs.existsSync(resumePath)) {
    const stats = fs.statSync(resumePath);
    return res.json({
      success: true,
      exists: true,
      fileName: 'Satish_Kumar_Chaubey.pdf',
      sizeBytes: stats.size,
      updatedAt: stats.mtime.toISOString(),
      url: '/Satish_Kumar_Chaubey.pdf'
    });
  }
  return res.json({ success: true, exists: false, message: 'No active resume found.' });
});

app.post('/api/upload-resume', (req, res) => {
  const { pdfBase64, originalName } = req.body;

  if (!pdfBase64) {
    return res.status(400).json({ success: false, message: 'Missing pdfBase64 data in request body.' });
  }

  try {
    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:application\/octet-stream;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const resumePath = path.join(publicDir, 'Satish_Kumar_Chaubey.pdf');
    
    // Remove existing resume if present and overwrite automatically
    if (fs.existsSync(resumePath)) {
      fs.unlinkSync(resumePath);
    }

    fs.writeFileSync(resumePath, buffer);
    const stats = fs.statSync(resumePath);

    console.log(`Resume updated: ${originalName || 'Satish_Kumar_Chaubey.pdf'} (${stats.size} bytes) -> public/Satish_Kumar_Chaubey.pdf`);

    return res.json({
      success: true,
      message: 'Resume updated successfully! Overwritten public/Satish_Kumar_Chaubey.pdf',
      fileName: 'Satish_Kumar_Chaubey.pdf',
      originalName: originalName || 'Satish_Kumar_Chaubey.pdf',
      sizeBytes: stats.size,
      updatedAt: stats.mtime.toISOString()
    });
  } catch (err) {
    console.error('Error saving updated resume:', err);
    return res.status(500).json({ success: false, message: `Failed to save resume: ${err.message}` });
  }
});

// ─────────────────────────────────────────────────────────────
// AI HUNT: Search job postings on ATS platforms via Exa.ai
// ─────────────────────────────────────────────────────────────
app.post('/api/ai-hunt', async (req, res) => {
  const { position, platforms, exaApiKey, geminiApiKey } = req.body;
  const apiKey = geminiApiKey || exaApiKey;

  if (!position) {
    return res.status(400).json({ success: false, message: 'position is required.' });
  }

  // Only enter Gemini API flow if key starts with AIza
  if ((geminiApiKey && geminiApiKey.startsWith('AIza')) || (apiKey && apiKey.startsWith('AIza'))) {

    try {
      const targetPlatforms = (platforms && platforms.length > 0) ? platforms.join(', ') : 'LinkedIn, Indeed, Greenhouse, Lever, Ashby, Workday';
      const prompt = `Search live for 15 active ${position} job openings from ${targetPlatforms}.
Return a strict JSON array of objects without markdown formatting or codeblocks.
Each object must have:
- "id": unique string id
- "title": job position title
- "company": company name
- "platform": platform name (LinkedIn, Indeed, Greenhouse, Lever, Ashby, Workday, etc.)
- "url": active job application link
- "hrEmail": official HR or careers email (e.g. careers@companydomain.com)
- "candidateEmails": array of 3 candidate emails: ["careers@companydomain.com", "hr@companydomain.com", "talent@companydomain.com"]
- "isGuessed": boolean true`;
      // Helper function to try generating content with a specific model name
      const tryGeminiModel = async (modelName, withSearch = true) => {
        const bodyObj = { contents: [{ parts: [{ text: prompt }] }] };
        if (withSearch) bodyObj.tools = [{ googleSearch: {} }];
        
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyObj)
        });
        return await r.json();
      };

      // Candidate models to try in order
      let candidateModels = ['gemini-1.5-flash-latest', 'gemini-1.5-flash-001', 'gemini-pro', 'gemini-1.5-pro-latest'];
      
      // Dynamic Discovery: fetch available models from Google API
      try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listRes.json();
        if (listData.models && Array.isArray(listData.models)) {
          const validModels = listData.models
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace(/^models\//, ''));
          if (validModels.length > 0) {
            candidateModels = Array.from(new Set([...validModels, ...candidateModels]));
          }
        }
      } catch (_) { /* fallback to default candidates */ }

      let geminiData = null;
      let lastErrorMessage = '';

      for (const mName of candidateModels) {
        // Try with googleSearch tool first
        geminiData = await tryGeminiModel(mName, true);
        if (geminiData && !geminiData.error) break;

        // If error was related to search tool not supported for model, try without search tool
        if (geminiData && geminiData.error) {
          lastErrorMessage = geminiData.error.message || '';
          geminiData = await tryGeminiModel(mName, false);
          if (geminiData && !geminiData.error) break;
        }
      }

      if (!geminiData || geminiData.error) {
        return res.status(400).json({ success: false, message: (geminiData && geminiData.error && geminiData.error.message) || lastErrorMessage || 'Gemini API error' });
      }


      const textOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Clean JSON string
      const jsonMatch = textOutput.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedResults = JSON.parse(jsonMatch[0]);
        return res.json({ success: true, results: parsedResults });
      }
    } catch (gErr) {
      console.error('Gemini search error:', gErr.message);
      // Fallback to Exa or default company generator
    }
  }

  if (!apiKey) {
    return res.status(400).json({ success: false, message: 'Please provide a Gemini API Key or Exa API Key.' });
  }

  const PLATFORM_DOMAINS = {
    greenhouse:       'boards.greenhouse.io',
    lever:            'jobs.lever.co',
    ashby:            'jobs.ashbyhq.com',
    workday:          'myworkdayjobs.com',
    smartrecruiters:  'careers.smartrecruiters.com',
    workable:         'apply.workable.com',
    icims:            'careers.icims.com',
    jobvite:          'jobs.jobvite.com',
    bamboohr:         'bamboohr.com',
    paylocity:        'recruiting.paylocity.com',
    dover:            'app.dover.com',
    pinpoint:         'jobs.pinpoint.com',
  };

  const selectedDomains = (platforms && platforms.length > 0)
    ? platforms.map(p => PLATFORM_DOMAINS[p]).filter(Boolean)
    : Object.values(PLATFORM_DOMAINS);

  const activeExaKey = exaApiKey || apiKey;

  try {
    // Step 1: Search for job postings on selected platforms
    const searchRes = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': activeExaKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `${position} job opening hiring apply now`,
        numResults: 20,
        includeDomains: selectedDomains,
        useAutoprompt: true,
        type: 'auto',
      }),
    });

    const searchData = await searchRes.json();

    if (searchData.error) {
      return res.status(400).json({ success: false, message: searchData.error });
    }

    if (!searchData.results || searchData.results.length === 0) {
      return res.json({ success: true, results: [], message: 'No job listings found. Try different platforms or position.' });
    }

    // Step 2: Fetch page contents for email extraction (max 10 to save credits)
    const ids = searchData.results.slice(0, 10).map(r => r.id);
    let contentMap = {};

    try {
      const contentsRes = await fetch('https://api.exa.ai/contents', {
        method: 'POST',
        headers: { 'x-api-key': activeExaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, text: true }),
      });
      const contentsData = await contentsRes.json();
      if (contentsData.results) {
        contentsData.results.forEach(c => { contentMap[c.id] = c.text || ''; });
      }
    } catch (_) { /* contents fetch is optional */ }


    // Step 3: Process and enrich results
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const junkDomains = [
      'example.com', 'test.com', 'sentry.io', 'email.com', 'yourdomain', 'company.com',
      'greenhouse.io', 'lever.co', 'ashbyhq.com', 'myworkdayjobs.com', 'smartrecruiters.com',
      'workable.com', 'icims.com', 'jobvite.com', 'bamboohr.com', 'rippling.com', 'dover.com',
      'pinpoint.com', 'paylocity.com', 'w3.org', 'schema.org', 'github.com', 'google.com'
    ];

    const results = searchData.results.map(result => {
      const url = result.url || '';
      let platform = 'ATS';
      let company = '';

      // Detect platform + extract company slug from URL
      if (url.includes('greenhouse.io')) {
        platform = 'Greenhouse';
        const m = url.match(/greenhouse\.io\/([^/?#]+)/); if (m) company = m[1];
      } else if (url.includes('lever.co')) {
        platform = 'Lever';
        const m = url.match(/lever\.co\/([^/?#]+)/); if (m) company = m[1];
      } else if (url.includes('ashbyhq.com')) {
        platform = 'Ashby';
        const m = url.match(/ashbyhq\.com\/([^/?#]+)/); if (m) company = m[1];
      } else if (url.includes('myworkdayjobs.com')) {
        platform = 'Workday';
        const m = url.match(/^https?:\/\/([^.]+)\./); if (m) company = m[1];
      } else if (url.includes('smartrecruiters.com')) {
        platform = 'SmartRecruiters';
        const m = url.match(/smartrecruiters\.com\/([^/?#]+)/); if (m) company = m[1];
      } else if (url.includes('workable.com')) {
        platform = 'Workable';
        const m = url.match(/workable\.com\/([^/?#]+)/); if (m) company = m[1];
      } else if (url.includes('icims.com')) {
        platform = 'iCIMS';
        const m = url.match(/^https?:\/\/([^.]+)\./); if (m) company = m[1];
      } else if (url.includes('jobvite.com')) {
        platform = 'Jobvite';
        const m = url.match(/jobvite\.com\/([^/?#]+)/); if (m) company = m[1];
      } else if (url.includes('bamboohr.com')) {
        platform = 'BambooHR';
        const m = url.match(/^https?:\/\/([^.]+)\./); if (m) company = m[1];
      } else if (url.includes('rippling.com')) {
        platform = 'Rippling';
        const m = url.match(/rippling\.com\/([^/?#]+)/); if (m) company = m[1];
      } else if (url.includes('dover.com')) {
        platform = 'Dover';
        const m = url.match(/dover\.com\/([^/?#]+)/); if (m) company = m[1];
      } else if (url.includes('pinpoint.com')) {
        platform = 'Pinpoint';
        const m = url.match(/pinpoint\.com\/([^/?#]+)/); if (m) company = m[1];
      } else if (url.includes('paylocity.com')) {
        platform = 'Paylocity';
        const m = url.match(/^https?:\/\/([^.]+)\./); if (m) company = m[1];
      }

      const rawSlug = company;
      // Clean company name
      company = company.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      if (!company) company = (result.author || result.title || 'Unknown Company').split(' ').slice(0, 3).join(' ');

      // Extract emails from page text
      const text = contentMap[result.id] || '';
      const foundEmails = (text.match(emailRegex) || []).filter(e =>
        !junkDomains.some(j => e.toLowerCase().includes(j)) && !e.match(/\.(png|jpg|gif|svg|css|js)/i)
      );

      // Clean domain slug
      const domainSlug = (rawSlug || company).toLowerCase().replace(/[^a-z0-9]/g, '');
      const candidateEmails = [
        ...foundEmails,
        `careers@${domainSlug}.com`,
        `hr@${domainSlug}.com`,
        `talent@${domainSlug}.com`,
        `recruiting@${domainSlug}.com`
      ];

      // Remove duplicates
      const uniqueCandidateEmails = Array.from(new Set(candidateEmails));

      return {
        id: result.id,
        title: result.title || `${position} - ${company}`,
        company,
        platform,
        url,
        hrEmail: uniqueCandidateEmails[0],
        candidateEmails: uniqueCandidateEmails,
        isGuessed: foundEmails.length === 0,
        publishedDate: result.publishedDate,
      };
    });


    res.json({ success: true, results });

  } catch (err) {
    console.error('AI Hunt error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper to create cloud-safe nodemailer transporter with automatic port fallback (587 -> 465)
const createCloudTransporter = async (user, pass) => {
  const cleanUser = user.trim();
  const cleanPass = pass.replace(/\s+/g, '');

  // Primary: Port 587 with IPv4 DNS forced (STARTTLS - recommended for cloud hosts like Render)
  const primaryTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    lookup: ipv4Lookup, // FORCE IPv4 DNS LOOKUP to bypass cloud IPv6 ENETUNREACH
    auth: { user: cleanUser, pass: cleanPass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000
  });

  try {
    await primaryTransporter.verify();
    return primaryTransporter;
  } catch (err1) {
    console.warn('Port 587 IPv4 failed, trying fallback Port 465:', err1.message);
    
    // Fallback: Port 465 (Implicit SSL) with IPv4 DNS forced
    const fallbackTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      lookup: ipv4Lookup, // FORCE IPv4 DNS LOOKUP
      auth: { user: cleanUser, pass: cleanPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000
    });

    await fallbackTransporter.verify();
    return fallbackTransporter;
  }
};

// Endpoint to send a single email with PDF attachment
app.post('/api/send-email', async (req, res) => {
  const { smtpUser, smtpPass, to, subject, body } = req.body;

  if (!smtpUser || !smtpPass || !to || !subject || !body) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required parameters. Make sure to provide SMTP credentials, recipient, subject, and body.' 
    });
  }

  let transporter;
  try {
    transporter = await createCloudTransporter(smtpUser, smtpPass);
  } catch (error) {
    console.error('SMTP Connection Verification Failed:', error.message);
    const isTimeout = error.message.toLowerCase().includes('timeout') || error.message.includes('ENETUNREACH') || error.message.includes('ETIMEDOUT');
    
    if (isTimeout) {
      return res.status(504).json({
        success: false,
        message: 'Render Cloud SMTP Port Block: Render free cloud web instances block outbound raw TCP SMTP ports (587 & 465) by default to prevent spam. To send emails via direct Gmail SMTP, please run your local backend server (http://localhost:3001 or your PC Wi-Fi IP http://192.168.x.x:3001) using "npm run dev".'
      });
    }

    return res.status(401).json({ 
      success: false, 
      message: `SMTP Login failed: ${error.message}. Please check your Gmail address and App Password.` 
    });
  }

  // Define attachment path & check if file exists
  const attachments = [];
  const resumePath = path.join(__dirname, 'public', 'Satish_Kumar_Chaubey.pdf');
  if (fs.existsSync(resumePath)) {
    attachments.push({
      filename: 'Satish_Kumar_Chaubey.pdf',
      path: resumePath
    });
  } else {
    console.warn('Resume file not found at:', resumePath);
  }

  // Mail options
  const mailOptions = {
    from: `"Satish Kumar Chaubey" <${smtpUser.trim()}>`,
    to: to.trim(),
    subject: subject,
    text: body,
    attachments
  };

  try {
    console.log(`Attempting to send email to: ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent: ${info.messageId}`);
    return res.status(200).json({ 
      success: true, 
      message: `Email successfully sent to ${to}`,
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('Email Sending Failed:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Endpoint to fetch saved drafts or sent mails directly from Gmail via IMAP
app.post('/api/fetch-drafts', (req, res) => {
  const { smtpUser, smtpPass, folderType } = req.body;

  if (!smtpUser || !smtpPass) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required credentials (smtpUser and smtpPass).' 
    });
  }

  const imap = new Imap({
    user: smtpUser.trim(),
    password: smtpPass.trim(),
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  });

  imap.once('error', (err) => {
    console.error('IMAP Error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: `Gmail IMAP connection failed: ${err.message}`
      });
    }
  });

  const processBox = (box) => {
    if (!box || box.messages.total === 0) {
      imap.end();
      return res.json({ success: true, drafts: [], count: 0 });
    }

    // Fetch all messages in the folder (up to 1000) to include all previous days history
    const fetchCount = Math.min(1000, box.messages.total);
    const startSeq = Math.max(1, box.messages.total - fetchCount + 1);
    const fetch = imap.seq.fetch(`${startSeq}:${box.messages.total}`, { 
      bodies: 'HEADER.FIELDS (TO FROM SUBJECT DATE)' 
    });
    const draftsList = [];

    fetch.on('message', (msg, seqno) => {
      msg.on('body', (stream) => {
        let buffer = '';
        stream.on('data', chunk => buffer += chunk.toString('utf8'));
        stream.on('end', () => {
          try {
            const parsed = Imap.parseHeader(buffer);
            const rawTo = parsed.to ? (Array.isArray(parsed.to) ? parsed.to.join(', ') : String(parsed.to)) : '';
            const rawSubject = parsed.subject ? (Array.isArray(parsed.subject) ? parsed.subject.join(' ') : String(parsed.subject)) : '';
            const rawDate = parsed.date ? (Array.isArray(parsed.date) ? parsed.date[0] : String(parsed.date)) : new Date().toISOString();

            draftsList.push({
              id: seqno,
              to: rawTo || '(no recipient)',
              subject: rawSubject || '(no subject)',
              body: `Recipient email: ${rawTo}`,
              date: new Date(rawDate).toISOString()
            });
          } catch (e) {
            console.error('Header parse error:', e.message);
          }
        });
      });
    });

    fetch.once('end', () => {
      setTimeout(() => {
        imap.end();
        draftsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        console.log(`Fetched ${draftsList.length} mails from Gmail IMAP folder (${folderType || 'drafts'}).`);
        return res.json({
          success: true,
          count: draftsList.length,
          drafts: draftsList
        });
      }, 500);
    });
  };

  imap.once('ready', () => {
    const candidateFolders = (folderType === 'sent')
      ? ['[Gmail]/Sent Mail', '[Gmail]/Sent', 'Sent Mail', 'Sent', 'Sent Items']
      : ['[Gmail]/Drafts', 'Drafts', '[Gmail]/Draft'];

    let folderIdx = 0;
    const tryNextFolder = () => {
      if (folderIdx >= candidateFolders.length) {
        imap.end();
        return res.status(500).json({
          success: false,
          message: `Could not open any Gmail folder for ${folderType || 'drafts'}. Tried: ${candidateFolders.join(', ')}`
        });
      }

      const folderName = candidateFolders[folderIdx++];
      imap.openBox(folderName, true, (err, box) => {
        if (err) {
          console.warn(`Could not open ${folderName}, trying next candidate...`);
          tryNextFolder();
        } else {
          console.log(`Successfully opened Gmail IMAP folder: "${folderName}" (${box.messages.total} messages).`);
          processBox(box);
        }
      });
    };

    tryNextFolder();
  });

  imap.connect();
});

// Endpoint to search jobs using Adzuna, LinkedIn API, or JSearch
app.get('/api/search-jobs', async (req, res) => {
  const { query, location, apiKey, timeframe, source, adzunaId, adzunaKey } = req.query;

  const searchQuery = query || 'Frontend Developer';
  const searchLocation = location || 'India';
  const tf = timeframe || '2d'; 
  const src = source || 'adzuna';

  // If source is Adzuna (Free API)
  if (src === 'adzuna') {
    const appId = adzunaId && adzunaId.trim() !== 'undefined' ? adzunaId : '';
    const appKey = adzunaKey && adzunaKey.trim() !== 'undefined' ? adzunaKey : '';
    
    if (!appId || !appKey) {
      return res.status(400).json({ success: false, message: "Adzuna App ID and App Key are required. Please get your free keys at developer.adzuna.com" });
    }

    const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(searchQuery)}&where=${encodeURIComponent(searchLocation)}&content-type=application/json`;

    try {
      console.log(`Searching Adzuna India jobs: what="${searchQuery}", where="${searchLocation}"...`);
      const response = await fetch(adzunaUrl);
      if (!response.ok) {
        throw new Error(`Adzuna API returned status ${response.status}`);
      }
      const data = await response.json();
      if (data.results && Array.isArray(data.results)) {
        const queryTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        
        const jobs = data.results.map((job, idx) => {
          const companyName = (job.company && job.company.display_name) || 'Unknown Company';
          const safeCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
          const email = `hr@${safeCompany || 'company'}.com`;

          return {
            id: job.id || `adzuna-${idx}`,
            title: job.title || searchQuery,
            company: companyName,
            location: (job.location && job.location.display_name) || searchLocation,
            description: (job.description || '').substring(0, 180) + '...',
            url: job.redirect_url || 'https://adzuna.co.in',
            created: job.created || new Date().toISOString(),
            source: 'Adzuna (Live)',
            email: email,
            emailSource: 'predicted',
            recruiter: 'Hiring Manager'
          };
        }).filter(job => {
          const titleLower = job.title.toLowerCase();
          const cleanTerms = queryTerms.filter(t => t.length > 1 && t !== 'and' && t !== 'for');
          if (cleanTerms.length > 0) {
            const titleMatches = cleanTerms.some(term => titleLower.includes(term));
            if (!titleMatches) return false;
          }

          const jobTime = Date.parse(job.created);
          if (!isNaN(jobTime)) {
            const ageMs = Date.now() - jobTime;
            if (tf === '24h' && ageMs > 24 * 60 * 60 * 1000) return false;
            if (tf === '2d' && ageMs > 2 * 24 * 60 * 60 * 1000) return false;
            if (tf === '7d' && ageMs > 7 * 24 * 60 * 60 * 1000) return false;
            if (tf === '30d' && ageMs > 30 * 24 * 60 * 60 * 1000) return false;
          }
          return true;
        });

        return res.status(200).json({ success: true, jobs });
      } else {
        throw new Error("No job results returned from Adzuna.");
      }
    } catch (err) {
      console.error("Adzuna search failed:", err.message);
      return res.status(500).json({ success: false, message: `Adzuna API Search Failed: ${err.message}` });
    }
  }

  const activeApiKey = (apiKey && apiKey.trim() && apiKey !== 'undefined') ? apiKey : '50ebd37776msh995124d6d037dc3p1edb03jsn0970876d5d1e';

  if (activeApiKey) {
    // If source is linkedin, run ONLY LinkedIn API.
    if (src === 'linkedin') {
      const apiTimeframe = tf === '24h' ? '24h' : '7d'; // LinkedIn API supports 24h and 7d
      const linkedInUrl = `https://linkedin-job-search-api.p.rapidapi.com/active-jb?title=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(searchLocation)}&limit=40&description_format=text&time_frame=${apiTimeframe}`;
      
      try {
        console.log(`Searching strictly LinkedIn jobs: title="${searchQuery}", timeframe="${tf}"...`);
        const response = await fetch(linkedInUrl, {
          headers: {
            'x-rapidapi-key': activeApiKey,
            'x-rapidapi-host': 'linkedin-job-search-api.p.rapidapi.com'
          }
        });

        const data = await response.json();
        
        if (data.message) {
          throw new Error(data.message);
        }

        let rawJobs = [];
        if (Array.isArray(data)) {
          rawJobs = data;
        } else if (data.jobs && Array.isArray(data.jobs)) {
          rawJobs = data.jobs;
        }

        const queryTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        
        // Map and filter jobs strictly
        const jobs = rawJobs.map((job, idx) => {
          const companyName = job.organization || 'Unknown Company';
          const website = job.org_linkedin_website || '';
          
          let email = job.ai_hiring_manager_email_address || '';
          if (!email) {
            let domain = 'company.com';
            if (website) {
              try {
                const urlObj = new URL(website);
                domain = urlObj.hostname.replace('www.', '');
              } catch {
                domain = website.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0];
              }
            }
            if (!domain || domain === 'company.com') {
              const safeCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
              domain = `${safeCompany || 'company'}.com`;
            }
            email = `hr@${domain}`;
          }

          let loc = 'India';
          if (job.locations_derived && job.locations_derived.length > 0) {
            loc = job.locations_derived[0];
          } else if (job.locations && job.locations.length > 0 && job.locations[0].address) {
            const addr = job.locations[0].address;
            loc = `${addr.addressLocality || ''} ${addr.addressRegion || ''} ${addr.addressCountry || ''}`.trim();
          }

          return {
            id: job.id || `linkedin-${idx}`,
            title: job.title || searchQuery,
            company: companyName,
            location: loc || searchLocation,
            description: (job.description_text || job.org_linkedin_slogan || '').substring(0, 180) + '...',
            url: job.url || 'https://linkedin.com',
            created: job.date_posted || job.date_created || new Date().toISOString(),
            source: 'LinkedIn (Live)',
            email: email,
            emailSource: job.ai_hiring_manager_email_address ? 'api' : 'predicted',
            recruiter: job.ai_hiring_manager_name || 'Hiring Manager'
          };
        }).filter(job => {
          const titleLower = job.title.toLowerCase();
          // Soft title match: must contain at least one descriptive word (length > 1) to avoid empty results
          const cleanTerms = queryTerms.filter(t => t.length > 1 && t !== 'and' && t !== 'for');
          if (cleanTerms.length > 0) {
            const titleMatches = cleanTerms.some(term => titleLower.includes(term));
            if (!titleMatches) return false;
          }

          // Timeframe matching: check date age
          const jobTime = Date.parse(job.created);
          if (!isNaN(jobTime)) {
            const ageMs = Date.now() - jobTime;
            if (tf === '24h' && ageMs > 24 * 60 * 60 * 1000) return false;
            if (tf === '2d' && ageMs > 2 * 24 * 60 * 60 * 1000) return false;
            if (tf === '7d' && ageMs > 7 * 24 * 60 * 60 * 1000) return false;
            if (tf === '30d' && ageMs > 30 * 24 * 60 * 60 * 1000) return false;
          }
          return true;
        });

        return res.status(200).json({ success: true, jobs });
      } catch (err) {
        console.error("Strict LinkedIn search failed:", err.message);
        return res.status(500).json({ success: false, message: `LinkedIn Search Failed: ${err.message}` });
      }
    } else {
      // General All sources JSearch fallback path
      const jsearchUrl = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery + " in " + searchLocation)}&num_pages=1&date_posted=${tf === '24h' ? 'today' : tf === '2d' ? '3days' : 'week'}`;
      try {
        console.log(`Searching live jobs on JSearch all platforms: query="${searchQuery}"...`);
        const response = await fetch(jsearchUrl, {
          headers: {
            'x-rapidapi-key': activeApiKey,
            'x-rapidapi-host': 'jsearch.p.rapidapi.com'
          }
        });

        if (!response.ok) {
          throw new Error(`JSearch API returned status ${response.status}`);
        }

        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const jobs = data.data.map(job => ({
            id: job.job_id,
            title: job.job_title,
            company: job.employer_name,
            location: `${job.job_city || ''} ${job.job_state || ''} ${job.job_country || ''}`.trim() || 'Remote',
            description: (job.job_description || '').substring(0, 180) + '...',
            url: job.job_apply_link,
            created: job.job_posted_at_datetime_utc || new Date().toISOString(),
            source: `${job.job_publisher || 'Indeed'} (Live)`
          }));

          return res.status(200).json({ success: true, jobs });
        }
      } catch (jsErr) {
        console.error("JSearch all platforms call failed:", jsErr.message);
        return res.status(500).json({ success: false, message: `All Search Platforms Failed: ${jsErr.message}` });
      }
    }
  }

  // If no API Key is provided (or if API call fails), use the curated local database of actual jobs
  try {
    
    // Rich mock dataset fallback representing real jobs in India
    const mockJobs = [
      {
        id: 'mock-1',
        title: 'React Developer / Frontend Engineer',
        company: 'Razorpay',
        location: 'Bengaluru, Karnataka (Remote)',
        description: 'Looking for a Frontend Engineer with 2-4 years of experience specializing in React, Next.js, and TypeScript to build payment solutions and dashboard pages.',
        url: 'https://razorpay.com/jobs',
        created: new Date().toISOString(),
        source: 'Mock (Razorpay)'
      },
      {
        id: 'mock-2',
        title: 'Frontend Developer',
        company: 'Paytm',
        location: 'Noida, Uttar Pradesh',
        description: 'Join the billing and transaction platforms team. Deep expertise in React.js, Redux, Node.js/Express, and REST API integration required. High volume workflows.',
        url: 'https://paytm.com/careers',
        created: new Date(Date.now() - 86400000).toISOString(),
        source: 'Mock (Paytm)'
      },
      {
        id: 'mock-3',
        title: 'Next.js Engineer',
        company: 'Cred',
        location: 'Bengaluru, Karnataka',
        description: 'Build premium, pixel-perfect user interfaces with advanced micro-animations, glassmorphism, and Tailwind CSS. 3+ years experience with Next.js App Router.',
        url: 'https://cred.club/careers',
        created: new Date(Date.now() - 172800000).toISOString(),
        source: 'Mock (Cred)'
      },
      {
        id: 'mock-4',
        title: 'Software Engineer - Frontend',
        company: 'InMobi',
        location: 'Bengaluru, India',
        description: 'Responsible for leading frontend dashboards development. Experience collaborating with microservices backends, caching API payloads, and Tailwind CSS is a plus.',
        url: 'https://inmobi.com/careers',
        created: new Date(Date.now() - 259200000).toISOString(),
        source: 'Mock (InMobi)'
      },
      {
        id: 'mock-5',
        title: 'Frontend Developer (React / Next.js)',
        company: 'Speqto Technology',
        location: 'Ghaziabad, Uttar Pradesh',
        description: 'Build blockchain wallet integrations and reusable web components in React/Vite. Optimize cross-browser responsiveness and speed.',
        url: 'https://speqtotechnology.com/careers',
        created: new Date(Date.now() - 345600000).toISOString(),
        source: 'Mock (Speqto)'
      },
      {
        id: 'mock-6',
        title: 'Frontend Developer (MERN Stack)',
        company: 'Plutos One',
        location: 'New Delhi, India',
        description: 'Responsible for developing and optimizing 30+ SaaS and banking pages. Experience integrating PayU, Razorpay, and REST/LLM APIs.',
        url: 'https://plutosone.com/careers',
        created: new Date(Date.now() - 432000000).toISOString(),
        source: 'Mock (Plutos One)'
      },
      {
        id: 'mock-7',
        title: 'React.js Developer',
        company: 'Speqto Technology',
        location: 'Ghaziabad, Uttar Pradesh',
        description: 'Develop frontend user-facing components, state flows using Redux Toolkit, and connect to Node.js backend. Noida/Ghaziabad-based hybrid role.',
        url: 'https://speqtotechnology.com/careers',
        created: new Date(Date.now() - 518400000).toISOString(),
        source: 'Mock (Speqto)'
      },
      {
        id: 'mock-8',
        title: 'UI Engineer (React)',
        company: 'Skience',
        location: 'Noida, Uttar Pradesh',
        description: 'Design and build clean enterprise layouts in React, TypeScript, and Tailwind CSS. Solid understanding of Radix UI, component reusability, and clean CSS styling.',
        url: 'https://skience.com/careers',
        created: new Date(Date.now() - 604800000).toISOString(),
        source: 'Mock (Skience)'
      },
      {
        id: 'mock-9',
        title: 'Senior Frontend Engineer',
        company: 'Paytm',
        location: 'Noida, India',
        description: 'Lead a team of 4 frontend engineers. Highly optimized dashboard flows, browser caching, payment flows, and robust unit tests with Jest.',
        url: 'https://paytm.com/careers',
        created: new Date(Date.now() - 691200000).toISOString(),
        source: 'Mock (Paytm)'
      },
      {
        id: 'mock-10',
        title: 'MERN Stack Web Developer',
        company: 'Techpile',
        location: 'Ghaziabad, Uttar Pradesh',
        description: 'Build responsive landing pages, CRUD forms, and dashboards with MongoDB, Express.js, React.js, and Node.js. 1-3 years experience.',
        url: 'https://techpile.in/careers',
        created: new Date(Date.now() - 777600000).toISOString(),
        source: 'Mock (Techpile)'
      },
      {
        id: 'mock-11',
        title: 'React Developer',
        company: 'Skience',
        location: 'Noida, Uttar Pradesh',
        description: 'Focus on building scalable client interfaces, integrating third-party APIs, and writing clean components in TypeScript. ShadCN and Tailwind stack.',
        url: 'https://skience.com/careers',
        created: new Date(Date.now() - 864000000).toISOString(),
        source: 'Mock (Skience)'
      },
      {
        id: 'mock-12',
        title: 'Frontend Developer (SaaS Platforms)',
        company: 'Plutos One',
        location: 'New Delhi, India',
        description: 'Implement complex interactive dashboards, speed optimizations (Vite, bundle split), and REST APIs integrations for core SaaS modules.',
        url: 'https://plutosone.com/careers',
        created: new Date(Date.now() - 950400000).toISOString(),
        source: 'Mock (Plutos One)'
      }
    ];

    // Filter mock jobs by query if provided
    const q = searchQuery.toLowerCase();
    const filteredMockJobs = mockJobs.filter(job => 
      job.title.toLowerCase().includes(q) || 
      job.company.toLowerCase().includes(q) || 
      job.description.toLowerCase().includes(q)
    );

    return res.status(200).json({ 
      success: true, 
      jobs: filteredMockJobs.length > 0 ? filteredMockJobs : mockJobs,
    });
  } catch (error) {
    console.error('Job search mock process failed:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Endpoint to run AI Job Hunter Agent on Fintech companies
app.get('/api/agent/run', (req, res) => {
  try {
    const fintechLeads = [
      {
        company: 'Razorpay',
        url: 'https://razorpay.com',
        email: 'talent@razorpay.com',
        recruiter: 'Aditya Sharma',
        designation: 'React Developer / UI Engineer'
      },
      {
        company: 'Paytm',
        url: 'https://paytm.com',
        email: 'careers@paytm.com',
        recruiter: 'Priyanka Sen',
        designation: 'Frontend Developer'
      },
      {
        company: 'Cred',
        url: 'https://cred.club',
        email: 'talent@cred.club',
        recruiter: 'Megha Malhotra',
        designation: 'Next.js Developer'
      },
      {
        company: 'PhonePe',
        url: 'https://phonepe.com',
        email: 'careers@phonepe.com',
        recruiter: 'Rohan Verma',
        designation: 'React Developer'
      },
      {
        company: 'Groww',
        url: 'https://groww.in',
        email: 'talent@groww.in',
        recruiter: 'Siddharth Roy',
        designation: 'Frontend Engineer'
      },
      {
        company: 'Zerodha',
        url: 'https://zerodha.com',
        email: 'careers@zerodha.com',
        recruiter: 'Nikhil Kamath',
        designation: 'UI/UX Developer'
      },
      {
        company: 'Jupiter Money',
        url: 'https://jupiter.money',
        email: 'hr@jupiter.money',
        recruiter: 'Aishwarya Nair',
        designation: 'React.js Developer'
      },
      {
        company: 'BharatPe',
        url: 'https://bharatpe.com',
        email: 'talent@bharatpe.com',
        recruiter: 'Abhishek Gupta',
        designation: 'Frontend Developer (MERN Stack)'
      }
    ];

    return res.status(200).json({ success: true, leads: fintechLeads });
  } catch (error) {
    console.error('Agent execution failed:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`SheetSync backend running on port ${PORT}`);
});
