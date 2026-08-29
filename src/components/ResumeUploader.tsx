import React, { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle2, Loader2, ExternalLink, FileCheck } from 'lucide-react';
import { toast } from '../toast';
import { getApiBase } from '../config';

interface ResumeInfo {
  exists: boolean;
  fileName: string;
  sizeBytes: number;
  updatedAt: string;
  url: string;
}

interface ResumeUploaderProps {
  onUploaded?: () => void;
  compact?: boolean;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onUploaded, compact = false }) => {
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Fetch active resume metadata from backend
  const fetchResumeInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/resume-info`);
      const data = await res.json();
      if (res.ok && data.success) {
        setResumeInfo(data);
      } else {
        setResumeInfo(null);
      }
    } catch (err) {
      console.warn('Could not fetch resume info from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumeInfo();
  }, []);

  // Process and upload file
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate PDF file format
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      toast.error('Only PDF resume files (.pdf) are supported!');
      return;
    }

    // Validate size (< 15MB)
    if (file.size > 15 * 1024 * 1024) {
      toast.error('PDF file size is too large! Please upload a PDF under 15MB.');
      return;
    }

    setUploading(true);
    toast.info(`📤 Uploading updated resume: ${file.name}...`);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        const res = await fetch(`${getApiBase()}/api/upload-resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64: base64Data,
            originalName: file.name
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          toast.success(`✅ Resume updated! Saved as public/Satish_Kumar_Chaubey.pdf & linked to all email campaigns.`);
          await fetchResumeInfo();
          if (onUploaded) onUploaded();
        } else {
          toast.error(`❌ Upload failed: ${data.message || 'Unknown server error'}`);
        }
        setUploading(false);
      };

      reader.onerror = () => {
        toast.error('Error reading PDF file.');
        setUploading(false);
      };

      reader.readAsDataURL(file);

    } catch (err: any) {
      console.error(err);
      toast.error(`❌ Upload error: ${err.message}`);
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const openResumePreview = () => {
    const resumeUrl = `${getApiBase()}/Satish_Kumar_Chaubey.pdf`;
    window.open(resumeUrl, '_blank');
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.65rem 0.85rem', background: 'rgba(99, 102, 241, 0.06)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={16} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Attachment: Satish_Kumar_Chaubey.pdf
          </span>
          {resumeInfo?.exists && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ({formatFileSize(resumeInfo.sizeBytes)})
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={openResumePreview}
            style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
            title="Preview current PDF resume"
          >
            <ExternalLink size={12} /> View
          </button>

          <label 
            style={{ 
              fontSize: '0.72rem', 
              padding: '0.25rem 0.6rem', 
              background: '#6366f1', 
              color: '#ffffff', 
              borderRadius: '6px', 
              fontWeight: 600, 
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploading ? 'Replacing...' : 'Update PDF'}
            <input
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ padding: '0.45rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <FileCheck size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Resume Attachment Manager
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Upload updated PDF resume to automatically replace existing resume in <b>public/Satish_Kumar_Chaubey.pdf</b>
            </p>
          </div>
        </div>

        {resumeInfo?.exists && (
          <button
            type="button"
            className="btn-secondary"
            onClick={openResumePreview}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            <ExternalLink size={13} />
            Preview Active Resume
          </button>
        )}
      </div>

      {/* Status & Drag-and-Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: isDragOver ? '2px dashed #6366f1' : '2px dashed var(--border-color)',
          background: isDragOver ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0, 0, 0, 0.02)',
          borderRadius: '12px',
          padding: '1.25rem',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.6rem'
        }}
      >
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
            <Loader2 size={28} className="animate-spin" style={{ color: '#6366f1' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Replacing & Saving PDF to public/Satish_Kumar_Chaubey.pdf...
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1' }}>
              <Upload size={22} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Drag & Drop Updated PDF Resume Here
              </span>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Or click below to browse your updated PDF resume file. Existing <b>Satish_Kumar_Chaubey.pdf</b> will be overwritten automatically.
            </p>

            <label 
              className="btn-primary"
              style={{ 
                marginTop: '0.35rem', 
                fontSize: '0.8rem', 
                padding: '0.45rem 1.1rem', 
                cursor: 'pointer',
                background: '#6366f1',
                borderColor: '#6366f1'
              }}
            >
              <Upload size={14} />
              Browse PDF Resume
              <input
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
            </label>
          </>
        )}
      </div>

      {/* Active Resume Details Badge */}
      {loading ? (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Checking active resume info...
        </div>
      ) : resumeInfo?.exists ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', padding: '0.6rem 0.85rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Active Resume: {resumeInfo.fileName}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                File Size: {formatFileSize(resumeInfo.sizeBytes)} • Updated: {new Date(resumeInfo.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 600 }}>
            Attached to All Emails
          </span>
        </div>
      ) : (
        <div style={{ fontSize: '0.78rem', color: '#ef4444', textAlign: 'center' }}>
          No active resume found in public folder. Please upload your PDF resume above.
        </div>
      )}

    </div>
  );
};
