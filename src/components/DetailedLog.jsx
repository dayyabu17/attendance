import React, { useState, useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { List, Download, Loader2 } from 'lucide-react';
import { timeToMinutes, formatMinutesToTimeString } from '../utils/helpers';

const DetailedLog = ({ 
  analytics, 
  currentPage, 
  setCurrentPage, 
  rowsPerPage, 
  setRowsPerPage 
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const paginatedTableDetails = useMemo(() => {
    if (!analytics) return [];
    return analytics.tableDetails.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [analytics, currentPage, rowsPerPage]);

  const totalPages = analytics ? Math.ceil(analytics.tableDetails.length / rowsPerPage) || 1 : 1;

  const handleExportCSV = () => {
    if (!analytics || analytics.tableDetails.length === 0 || isExporting) return;
    
    setIsExporting(true);

    // Use setTimeout to allow the UI to re-render and show the "Exporting..." state
    setTimeout(() => {
      try {
        const headers = ["Date", "Name", "Log In Time", "Log Out Time", "Status", "Overtime (Hrs)"];
        const rows = analytics.tableDetails.map(row => [
          row.date,
          row.name,
          row.inStr,
          row.outStr,
          row.isLate ? "Late" : "On Time",
          (row.overtimeMins / 60).toFixed(2)
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Attendance_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } finally {
        setIsExporting(false);
      }
    }, 50);
  };

  if (!analytics) return null;

  return (
    <div className="charts-section">
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <List size={20} color="var(--primary)" />
            <h2 style={{ margin: 0 }}>Detailed Log</h2>
          </div>
          
          <button 
            onClick={handleExportCSV}
            disabled={isExporting}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: isExporting ? 'var(--text-secondary)' : 'var(--primary)', color: 'white',
              border: 'none', padding: '0.5rem 1rem',
              borderRadius: '0.5rem', cursor: isExporting ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem', fontWeight: '500',
              transition: 'all 0.2s', fontFamily: 'inherit'
            }}
            onMouseOver={(e) => { if (!isExporting) e.target.style.background = 'var(--primary-hover)' }}
            onMouseOut={(e) => { if (!isExporting) e.target.style.background = 'var(--primary)' }}
          >
            {isExporting ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Download size={16} />
            )}
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
        
        {analytics.tableDetails.length > 0 ? (
          <>
            <div className="table-container">
              <TableVirtuoso
                data={paginatedTableDetails}
                style={{ height: '60vh', minHeight: '400px' }}
                className="details-table"
                components={{
                  Table: (props) => <table {...props} className="details-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }} />
                }}
                fixedHeaderContent={() => (
                  <tr style={{ background: 'var(--bg-color)', zIndex: 10 }}>
                    <th style={{ background: 'var(--bg-color)' }}>Date</th>
                    <th style={{ background: 'var(--bg-color)' }}>Name</th>
                    <th style={{ background: 'var(--bg-color)' }}>Log In Time</th>
                    <th style={{ background: 'var(--bg-color)' }}>Log Out Time</th>
                    <th style={{ background: 'var(--bg-color)' }}>Status</th>
                    <th style={{ background: 'var(--bg-color)' }}>Overtime</th>
                  </tr>
                )}
                itemContent={(index, row) => (
                  <>
                    <td data-label="Date">{row.date}</td>
                    <td data-label="Name" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.name}</td>
                    <td data-label="Log In Time">{row.inStr !== '-' ? formatMinutesToTimeString(timeToMinutes(row.inStr)) : '-'}</td>
                    <td data-label="Log Out Time">{row.outStr !== '-' ? formatMinutesToTimeString(timeToMinutes(row.outStr)) : '-'}</td>
                    <td data-label="Status">
                      {row.inStr !== '-' ? (
                        <span className={`status-badge ${row.isLate ? 'late' : 'ontime'}`}>
                          {row.isLate ? 'Late' : 'On Time'}
                        </span>
                      ) : (
                        <span className="status-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                          Missing
                        </span>
                      )}
                    </td>
                    <td data-label="Overtime" style={{ color: row.overtimeMins > 0 ? 'var(--accent-green)' : 'inherit' }}>
                      {row.overtimeMins > 0 ? `+${(row.overtimeMins / 60).toFixed(1)}h` : '-'}
                    </td>
                  </>
                )}
              />
            </div>
            
            <div className="pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="rows-per-page" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                <span>Rows per page:</span>
                <select 
                  value={rowsPerPage} 
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '0.25rem', padding: '0.25rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
                <span style={{ marginLeft: '0.5rem' }}>
                  Showing {analytics.tableDetails.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, analytics.tableDetails.length)} of {analytics.tableDetails.length} records
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '0.5rem 1rem', background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'var(--primary)', color: currentPage === 1 ? 'var(--text-secondary)' : 'white', border: 'none', borderRadius: '0.5rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', fontWeight: '500' }}
                >
                  Previous
                </button>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '0.5rem 1rem', background: currentPage === totalPages ? 'rgba(255,255,255,0.05)' : 'var(--primary)', color: currentPage === totalPages ? 'var(--text-secondary)' : 'white', border: 'none', borderRadius: '0.5rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', fontWeight: '500' }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No records to display. Try adjusting your filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailedLog;
