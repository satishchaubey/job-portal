import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Filter, ChevronLeft, ChevronRight, X, ArrowUpDown } from 'lucide-react';

interface TableViewProps {
  data: any[];
  headers: string[];
  onRowClick: (row: any) => void;
}

type SortConfig = {
  key: string | null;
  direction: 'ascending' | 'descending' | null;
};

export const TableView: React.FC<TableViewProps> = ({ data, headers, onRowClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // 1. Determine which columns are suitable for categorical dropdown filtering
  // Criteria: has between 2 and 15 unique values across all records
  const filterableColumns = useMemo(() => {
    const filters: Record<string, string[]> = {};
    headers.forEach(header => {
      const uniqueVals = new Set<string>();
      data.forEach(row => {
        const val = row[header];
        if (val !== undefined && val !== null) {
          const str = String(val).trim();
          if (str !== '') uniqueVals.add(str);
        }
      });
      // Allow filter if between 2 and 15 unique values
      if (uniqueVals.size >= 2 && uniqueVals.size <= 15) {
        filters[header] = Array.from(uniqueVals).sort((a, b) => a.localeCompare(b));
      }
    });
    return filters;
  }, [data, headers]);

  // 2. Filter data by global search AND column filters
  const filteredData = useMemo(() => {
    return data.filter(row => {
      // Check column filters first
      const matchesColumnFilters = Object.entries(columnFilters).every(([col, val]) => {
        if (!val) return true;
        const cellVal = row[col];
        const cellStr = cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : '';
        return cellStr === val;
      });

      if (!matchesColumnFilters) return false;

      // Check global search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return headers.some(header => {
        const val = row[header];
        const cellStr = val !== undefined && val !== null ? String(val).toLowerCase() : '';
        return cellStr.includes(q);
      });
    });
  }, [data, headers, searchQuery, columnFilters]);

  // 3. Sort data
  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData];
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      const key = sortConfig.key;
      const isAsc = sortConfig.direction === 'ascending';
      sortableItems.sort((a, b) => {
        const valA = a[key] !== undefined && a[key] !== null ? String(a[key]).trim() : '';
        const valB = b[key] !== undefined && b[key] !== null ? String(b[key]).trim() : '';

        // Try numeric sorting if applicable
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
          return isAsc ? numA - numB : numB - numA;
        }

        // Default alphabetical sorting
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // 4. Paginate sorted data
  const paginatedData = useMemo(() => {
    if (pageSize === -1) return sortedData; // "All" selected
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Total pages calculation
  const totalPages = useMemo(() => {
    if (pageSize === -1) return 1;
    return Math.ceil(sortedData.length / pageSize) || 1;
  }, [sortedData.length, pageSize]);

  // Adjust page number if it goes out of bounds after filtering
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' | null = 'ascending';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') {
        direction = 'descending';
      } else if (sortConfig.direction === 'descending') {
        direction = null; // reset sort
      }
    }
    setSortConfig({ key: direction ? key : null, direction });
    setCurrentPage(1);
  };

  const handleFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchQuery('');
    setSortConfig({ key: null, direction: null });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(columnFilters).some(Boolean) || searchQuery !== '' || sortConfig.key !== null;

  // Render text helper to highlight search results
  const renderCellWithHighlight = (value: any, query: string) => {
    const text = value !== undefined && value !== null ? String(value) : '';
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="highlight">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // RegExp helper
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Table controls */}
      <div className="table-controls">
        <div className="search-filter-row">
          
          {/* Global Search Bar */}
          <div className="search-box-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search across all columns..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>

          {/* Categorical Dropdown Filters */}
          {Object.entries(filterableColumns).map(([col, values]) => (
            <div key={col} style={{ display: 'flex', alignItems: 'center' }}>
              <select
                value={columnFilters[col] || ''}
                onChange={(e) => handleFilterChange(col, e.target.value)}
                className="filter-select"
              >
                <option value="">All {col}s</option>
                {values.map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
          ))}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={clearAllFilters}
              style={{ padding: '0.65rem 1rem', fontSize: '0.875rem' }}
            >
              <X size={16} />
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Badges for visual aid */}
        {hasActiveFilters && (
          <div className="filter-badge-list">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Filters:
            </span>
            {searchQuery && (
              <span className="filter-badge">
                Search: "{searchQuery}"
                <span className="filter-badge-clear" onClick={() => setSearchQuery('')}><X size={10} /></span>
              </span>
            )}
            {Object.entries(columnFilters).map(([col, val]) => val && (
              <span className="filter-badge" key={col}>
                {col}: {val}
                <span className="filter-badge-clear" onClick={() => handleFilterChange(col, '')}><X size={10} /></span>
              </span>
            ))}
            {sortConfig.key && (
              <span className="filter-badge">
                Sort: {sortConfig.key} ({sortConfig.direction === 'ascending' ? 'Asc' : 'Desc'})
                <span className="filter-badge-clear" onClick={() => setSortConfig({ key: null, direction: null })}><X size={10} /></span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actual Data Table */}
      <div className="table-wrapper">
        {paginatedData.length === 0 ? (
          <div className="empty-state">
            <Filter size={40} className="empty-state-icon" />
            <h4 className="empty-state-title">No matching records found</h4>
            <p className="empty-state-desc">Try resetting your filter parameters or checking your search query.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {headers.map(header => {
                  const isSortedColumn = sortConfig.key === header;
                  return (
                    <th
                      key={header}
                      className="sortable"
                      onClick={() => requestSort(header)}
                      title={`Click to sort by ${header}`}
                    >
                      <div className="header-cell-content">
                        {header}
                        <span className="sort-indicator">
                          {isSortedColumn ? (
                            sortConfig.direction === 'ascending' ? (
                              <ChevronUp size={14} className="sort-active" />
                            ) : (
                              <ChevronDown size={14} className="sort-active" />
                            )
                          ) : (
                            <ArrowUpDown size={12} />
                          )}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} onClick={() => onRowClick(row)}>
                  {headers.map(header => (
                    <td key={header} title={row[header]}>
                      {renderCellWithHighlight(row[header], searchQuery)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination & Footer controls */}
      {sortedData.length > 0 && (
        <div className="pagination-container">
          
          <div className="pagination-info">
            Showing <strong>{pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong>
              {pageSize === -1
                ? sortedData.length
                : Math.min(currentPage * pageSize, sortedData.length)}
            </strong>{' '}
            of <strong>{sortedData.length}</strong> records
            {filteredData.length !== data.length && ` (filtered from ${data.length} total)`}
          </div>

          <div className="pagination-controls">
            
            {/* Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="page-size-selector"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All</option>
              </select>
            </div>

            {pageSize !== -1 && (
              <>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="First Page"
                >
                  <ChevronLeft size={16} style={{ transform: 'translateX(-2px)' }} />
                  <ChevronLeft size={16} style={{ position: 'absolute', transform: 'translateX(2px)' }} />
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Dynamic Page Numbers list */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Logic to center the active page number
                  let pageNum = currentPage;
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  // Filter out invalid page numbers (e.g. if totalPages < 5)
                  if (pageNum <= 0 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      className={`pagination-btn ${currentPage === pageNum ? 'pagination-active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Last Page"
                >
                  <ChevronRight size={16} style={{ position: 'absolute', transform: 'translateX(-2px)' }} />
                  <ChevronRight size={16} style={{ transform: 'translateX(2px)' }} />
                </button>
              </>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
