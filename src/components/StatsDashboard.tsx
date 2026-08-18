import React from 'react';
import { Users, Building2, Briefcase, Award } from 'lucide-react';

interface StatsDashboardProps {
  data: any[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const totalContacts = data.length;

  // Helper to find column key by variations of name
  const findColumnKey = (variations: string[]): string | undefined => {
    if (data.length === 0) return undefined;
    const firstRowKeys = Object.keys(data[0]);
    return firstRowKeys.find(key => 
      variations.some(variation => key.toLowerCase().includes(variation.toLowerCase()))
    );
  };

  // Find organization/company key
  const companyKey = findColumnKey(['company', 'organization', 'employer', 'firm']);
  // Find title/designation key
  const roleKey = findColumnKey(['designation', 'role', 'title', 'job', 'position']);
  
  // Compute Stats
  const uniqueCompanies = companyKey 
    ? new Set(data.map(item => String(item[companyKey] || '').trim()).filter(Boolean)).size 
    : 0;

  const uniqueRoles = roleKey 
    ? new Set(data.map(item => String(item[roleKey] || '').trim()).filter(Boolean)).size 
    : 0;

  // Find most common company
  let topCompany = "N/A";
  let topCompanyCount = 0;
  if (companyKey) {
    const companyCounts: Record<string, number> = {};
    data.forEach(item => {
      const co = String(item[companyKey] || '').trim();
      if (co) {
        companyCounts[co] = (companyCounts[co] || 0) + 1;
      }
    });
    
    let max = 0;
    Object.entries(companyCounts).forEach(([co, count]) => {
      if (count > max) {
        max = count;
        topCompany = co;
        topCompanyCount = count;
      }
    });
  }


  return (
    <div className="stats-grid">
      {/* Stat 1: Total Contacts */}
      <div className="glass-card stat-card">
        <div className="stat-icon-wrapper">
          <Users size={24} />
        </div>
        <div className="stat-details">
          <span className="stat-value">{totalContacts}</span>
          <span className="stat-label">Total Contacts</span>
        </div>
      </div>

      {/* Stat 2: Unique Companies */}
      {companyKey && (
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.25)', color: '#c084fc' }}>
            <Building2 size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{uniqueCompanies}</span>
            <span className="stat-label">Unique Companies</span>
          </div>
        </div>
      )}

      {/* Stat 3: Unique Designations */}
      {roleKey && (
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)', borderColor: 'rgba(236, 72, 153, 0.25)', color: '#f472b6' }}>
            <Briefcase size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{uniqueRoles}</span>
            <span className="stat-label">Unique Designations</span>
          </div>
        </div>
      )}

      {/* Stat 4: Top Company / Most Active Entity */}
      {companyKey && topCompany !== "N/A" && (
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24' }}>
            <Award size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value" style={{ fontSize: '1.15rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }} title={topCompany}>
              {topCompany}
            </span>
            <span className="stat-label">Top Company ({topCompanyCount} contacts)</span>
          </div>
        </div>
      )}
    </div>
  );
};
