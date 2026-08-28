import React from 'react';
import { ROLE_TEMPLATES, type RoleTemplate } from '../templates';
import { toast } from 'react-toastify';
import { Briefcase } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: string;
  onSelectRole: (template: RoleTemplate) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelectRole }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
      <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
        <Briefcase size={16} style={{ color: '#6366f1' }} />
        Target Role Presets (Select to auto-fill Subject & Mail Body)
      </label>
      
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {ROLE_TEMPLATES.map((tmpl) => {
          const isSelected = selectedRole === tmpl.id;
          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => {
                onSelectRole(tmpl);
                toast.info(`✨ Applied "${tmpl.label}" email template & subject!`, { autoClose: 2000 });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: isSelected ? '2px solid #6366f1' : '1px solid var(--border-color)',
                background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)',
                color: isSelected ? '#6366f1' : 'var(--text-primary)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tmpl.label}</span>
              <span 
                style={{
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '4px',
                  background: isSelected ? '#6366f1' : 'rgba(156, 163, 175, 0.2)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 600
                }}
              >
                {tmpl.badge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
