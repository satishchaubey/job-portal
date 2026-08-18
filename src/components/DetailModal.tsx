import React, { useState } from 'react';
import { X, Copy, Check, Mail, Building, User, Award, ExternalLink } from 'lucide-react';

interface DetailModalProps {
  contact: any | null;
  headers: string[];
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ contact, headers, onClose }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!contact) return null;

  // Handle overlay click to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllDetails = () => {
    const text = headers
      .map(header => `${header}: ${contact[header] ?? 'N/A'}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Helper to choose iconic representation
  const getIconForHeader = (header: string) => {
    const h = header.toLowerCase();
    if (h.includes('name')) return <User size={18} />;
    if (h.includes('mail')) return <Mail size={18} />;
    if (h.includes('company') || h.includes('organization') || h.includes('firm')) return <Building size={18} />;
    if (h.includes('designation') || h.includes('role') || h.includes('title')) return <Award size={18} />;
    return <ExternalLink size={18} />;
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">Contact Profile</h3>
            <span className="modal-subtitle">Full details from spreadsheet row</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close details">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {headers.map((header) => {
            const val = contact[header];
            const strVal = val !== undefined && val !== null ? String(val).trim() : 'N/A';
            const hasMail = header.toLowerCase().includes('mail') && strVal.includes('@');
            
            return (
              <div key={header} className="modal-grid-row">
                <div className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {getIconForHeader(header)}
                  {header}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '0.15rem' }}>
                  {hasMail ? (
                    <a href={`mailto:${strVal}`} className="modal-value" style={{ color: '#818cf8', textDecoration: 'underline' }}>
                      {strVal}
                    </a>
                  ) : (
                    <span className="modal-value">{strVal}</span>
                  )}
                  
                  {strVal !== 'N/A' && (
                    <button
                      className="pagination-btn"
                      style={{ width: '1.75rem', height: '1.75rem', padding: 0 }}
                      onClick={() => copyToClipboard(strVal, header)}
                      title={`Copy ${header}`}
                    >
                      {copiedField === header ? (
                        <Check size={12} style={{ color: '#10b981' }} />
                      ) : (
                        <Copy size={12} style={{ color: 'var(--text-secondary)' }} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-primary" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            onClick={copyAllDetails}
          >
            {copiedAll ? (
              <>
                <Check size={14} />
                Copied Profile!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy All Details
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
