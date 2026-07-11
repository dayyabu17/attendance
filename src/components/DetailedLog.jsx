import React, { useMemo } from 'react';
import { List, Download } from 'lucide-react';
import { timeToMinutes, formatMinutesToTimeString } from '../utils/helpers';

const DetailedLog = ({ 
  analytics, 
  currentPage, 
  setCurrentPage, 
  rowsPerPage, 
  setRowsPerPage 
}) => {
  const paginatedTableDetails = useMemo(() => {
    if (!analytics) return [];
    return analytics.tableDetails.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [analytics, currentPage, rowsPerPage]);

  const totalPages = analytics ? Math.ceil(analytics.tableDetails.length / rowsPerPage) || 1 : 1;

  const handleExportCSV = () => {
    if (!analytics || analytics.tableDetails.length === 0) return;
    
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
  };

  if (!analytics) return null;

  return (
    <div className="charts-section">
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <List size={20} color="var(--primary)" />
            <h2 style={{ margin: 0 }}>Detailed Log</h2>
          </div>
          
          <button 
            onClick={handleExportCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--primary)', color: 'white',
              border: 'none', padding: '0.5rem 1rem',
              borderRadius: '0.5rem', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: '500',
              transition: 'all 0.2s', fontFamily: 'inherit'
            }}
            onMouseOver={(e) => e.target.style.background = 'var(--primary-hover)'}
            onMouseOut={(e) => e.target.style.background = 'var(--primary)'}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
        
        {analytics.tableDetails.length > 0 ? (
          <>
            <div className="table-container">
              <table className="details-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Log In Time</th>
                    <th>Log Out Time</th>
                    <th>Status</th>
                    <th>Overtime</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTableDetails.map((row, i) => (
                    <tr key={`${row.date}-${row.name}-${i}`}>
                      <td>{row.date}</td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.name}</td>
                      <td>{row.inStr !== '-' ? formatMinutesToTimeString(timeToMinutes(row.inStr)) : '-'}</td>
                      <td>{row.outStr !== '-' ? formatMinutesToTimeString(timeToMinutes(row.outStr)) : '-'}</td>
                      <td>
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
                      <td style={{ color: row.overtimeMins > 0 ? 'var(--accent-green)' : 'inherit' }}>
                        {row.overtimeMins > 0 ? `+${(row.overtimeMins / 60).toFixed(1)}h` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
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
                <span style={{ marginLeft: '1rem' }}>
                  Showing {analytics.tableDetails.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, analytics.tableDetails.length)} of {analytics.tableDetails.length} records
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
