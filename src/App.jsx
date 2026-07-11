import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, UserX, CalendarDays, Users, Filter, List, LogOut } from 'lucide-react';
import './index.css';

function getWeekStartString(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const day = d.getDay();
  // If it's Sunday (0), shift back 6 days to Monday. Otherwise, shift back (day - 1) days.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

// Convert "HH:MM" or "HH:MM " string to minutes for math
function timeToMinutes(tStr) {
  if (!tStr) return null;
  const parts = tStr.trim().split(':');
  if (parts.length !== 2) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function formatMinutesToTimeString(mins) {
  if (mins == null || isNaN(mins)) return 'N/A';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatMonthOption(ym) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [year, month] = ym.split('-');
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [selectedPerson, setSelectedPerson] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedWeek, setSelectedWeek] = useState('All');

  useEffect(() => {
    fetch('/attendance_data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load attendance_data.json');
        }
        return response.json();
      })
      .then(data => {
        // Data format: { Name: "Saif", Date: "2026-01-01", InTime: "10:06", OutTime: "17:52" }
        // Pre-calculate WeekStart for filtering
        const processed = data.map(record => ({
          ...record,
          WeekStart: getWeekStartString(record.Date)
        }));
        
        setRawData(processed);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Compute available options for filters dynamically
  const filterOptions = useMemo(() => {
    const persons = new Set();
    const months = new Set();
    const weeks = new Set();

    rawData.forEach(record => {
      persons.add(record.Name);
      months.add(record.Date.substring(0, 7)); // YYYY-MM
      if (record.WeekStart) weeks.add(record.WeekStart);
    });

    return {
      persons: Array.from(persons).sort(),
      months: Array.from(months).sort((a, b) => b.localeCompare(a)), // Latest first
      weeks: Array.from(weeks).sort((a, b) => b.localeCompare(a))    // Latest first
    };
  }, [rawData]);

  const analytics = useMemo(() => {
    if (rawData.length === 0) return null;

    const LATE_THRESHOLD_MINUTES = 9 * 60 + 30; // 9:30 AM
    
    // Apply Filters to rawData before processing
    const filteredData = rawData.filter(record => {
      const monthStr = record.Date.substring(0, 7);
      const matchPerson = selectedPerson === 'All' || record.Name === selectedPerson;
      const matchMonth = selectedMonth === 'All' || monthStr === selectedMonth;
      const matchWeek = selectedWeek === 'All' || record.WeekStart === selectedWeek;
      
      return matchPerson && matchMonth && matchWeek;
    });

    let totalLoginMinutes = 0;
    let loginCount = 0;
    
    let totalLogoutMinutes = 0;
    let logoutCount = 0;

    const lateCounts = {}; 
    const monthlyAttendances = {}; 
    
    // For detailed table
    const tableDetails = [];

    filteredData.forEach(record => {
      const monthStr = record.Date.substring(0, 7);
      if (!monthlyAttendances[monthStr]) monthlyAttendances[monthStr] = 0;
      monthlyAttendances[monthStr]++;

      const inMins = timeToMinutes(record.InTime);
      const outMins = timeToMinutes(record.OutTime);
      
      let isLate = false;

      if (inMins !== null) {
        totalLoginMinutes += inMins;
        loginCount++;
        isLate = inMins > LATE_THRESHOLD_MINUTES;
        if (isLate) {
          lateCounts[record.Name] = (lateCounts[record.Name] || 0) + 1;
        }
      }

      if (outMins !== null) {
        totalLogoutMinutes += outMins;
        logoutCount++;
      }

      tableDetails.push({
        date: record.Date,
        name: record.Name,
        inStr: record.InTime ? record.InTime.trim() : '-',
        outStr: record.OutTime ? record.OutTime.trim() : '-',
        isLate
      });
    });

    // Sort table: newest date first, then by name
    tableDetails.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));

    // Formatting outputs
    const averageLoginTime = loginCount > 0 
      ? formatMinutesToTimeString(Math.round(totalLoginMinutes / loginCount))
      : "N/A";
      
    const averageLogoutTime = logoutCount > 0 
      ? formatMinutesToTimeString(Math.round(totalLogoutMinutes / logoutCount))
      : "N/A";

    let mostLateDisplay = "N/A";
    if (loginCount > 0) {
      let mostLatePerson = "None";
      let maxLates = 0;
      Object.entries(lateCounts).forEach(([name, count]) => {
        if (count > maxLates) {
          maxLates = count;
          mostLatePerson = name;
        }
      });
      mostLateDisplay = maxLates > 0 ? `${mostLatePerson} (${maxLates} times)` : "Everyone on time";
    }

    const chartData = Object.entries(monthlyAttendances)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ym, count]) => ({
        month: formatMonthOption(ym),
        attendances: count
      }));

    return {
      averageLoginTime,
      averageLogoutTime,
      mostLateDisplay,
      chartData,
      tableDetails,
      totalRecords: filteredData.length,
      totalLogins: filteredData.length
    };
  }, [rawData, selectedPerson, selectedMonth, selectedWeek]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <h2>Loading ZKTeco Attendance Data...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading">
        <h2 style={{ color: 'var(--accent-red)' }}>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="header-container">
        <h1>Attendance Dashboard</h1>
        
        <div className="filters-container">
          <div className="filter-group">
            <Filter size={18} color="var(--primary)" />
            <span className="filter-label">Filters:</span>
          </div>

          <div className="filter-group">
            <select 
              className="filter-select"
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
            >
              <option value="All">All Persons</option>
              {filterOptions.persons.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select 
              className="filter-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="All">All Months</option>
              {filterOptions.months.map(m => (
                <option key={m} value={m}>{formatMonthOption(m)}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select 
              className="filter-select"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
            >
              <option value="All">All Weeks</option>
              {filterOptions.weeks.map(w => (
                <option key={w} value={w}>{`Week of ${w}`}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {analytics && (
        <>
          <div className="dashboard-grid">
            <div className="glass-panel metric-card">
              <div className="metric-icon time">
                <Clock size={28} />
              </div>
              <div className="metric-content">
                <div className="metric-label">Avg Log In Time</div>
                <div className="metric-value">{analytics.averageLoginTime}</div>
                <div className="metric-sub">Across filtered period</div>
              </div>
            </div>

            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <LogOut size={28} />
              </div>
              <div className="metric-content">
                <div className="metric-label">Avg Log Out Time</div>
                <div className="metric-value">{analytics.averageLogoutTime}</div>
                <div className="metric-sub">Across filtered period</div>
              </div>
            </div>

            <div className="glass-panel metric-card">
              <div className="metric-icon late">
                <UserX size={28} />
              </div>
              <div className="metric-content">
                <div className="metric-label">Most Late Person</div>
                <div className="metric-value" style={{ fontSize: '1.25rem' }}>{analytics.mostLateDisplay}</div>
                <div className="metric-sub">Arrivals after 9:30 AM</div>
              </div>
            </div>
            
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ background: 'rgba(192, 132, 252, 0.1)', color: '#c084fc' }}>
                <Users size={28} />
              </div>
              <div className="metric-content">
                <div className="metric-label">Total Entries</div>
                <div className="metric-value">{analytics.totalRecords}</div>
                <div className="metric-sub">Matching ZKTeco records</div>
              </div>
            </div>
          </div>

          <div className="charts-section">
            <div className="glass-panel">
              <h2>Attendance Summary by Month</h2>
              {analytics.chartData.length > 0 ? (
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        stroke="var(--text-secondary)"
                        tick={{ fill: 'var(--text-secondary)' }}
                      />
                      <YAxis 
                        stroke="var(--text-secondary)"
                        tick={{ fill: 'var(--text-secondary)' }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      />
                      <Bar 
                        dataKey="attendances" 
                        fill="var(--primary)" 
                        radius={[4, 4, 0, 0]} 
                        name="Total Attendances"
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  No data available for the selected filters.
                </div>
              )}
            </div>

            <div className="glass-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <List size={20} color="var(--primary)" />
                <h2 style={{ margin: 0 }}>Detailed Log (Filtered)</h2>
              </div>
              
              {analytics.tableDetails.length > 0 ? (
                <div className="table-container">
                  <table className="details-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Log In Time</th>
                        <th>Log Out Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.tableDetails.map((row, i) => (
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
                                No Punch In
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No records to display. Try adjusting your filters.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
