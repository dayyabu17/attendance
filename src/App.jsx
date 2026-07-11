import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { Clock, UserX, CalendarDays, Users, Filter, List, LogOut, Download, Award, TrendingUp } from 'lucide-react';
import './index.css';

function getWeekStartString(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

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

const PIE_COLORS = ['#10b981', '#ef4444']; // Green for On Time, Red for Late

function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPerson, setSelectedPerson] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedWeek, setSelectedWeek] = useState('All');

  useEffect(() => {
    fetch('/attendance_data.json')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load attendance_data.json');
        return response.json();
      })
      .then(data => {
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

  const filterOptions = useMemo(() => {
    const persons = new Set();
    const months = new Set();
    const weeks = new Set();

    rawData.forEach(record => {
      persons.add(record.Name);
      months.add(record.Date.substring(0, 7));
      if (record.WeekStart) weeks.add(record.WeekStart);
    });

    return {
      persons: Array.from(persons).sort(),
      months: Array.from(months).sort((a, b) => b.localeCompare(a)),
      weeks: Array.from(weeks).sort((a, b) => b.localeCompare(a))
    };
  }, [rawData]);

  const analytics = useMemo(() => {
    if (rawData.length === 0) return null;

    const LATE_THRESHOLD_MINUTES = 9 * 60 + 30; // 9:30 AM
    const OVERTIME_THRESHOLD_MINUTES = 17 * 60 + 30; // 5:30 PM
    
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

    let onTimeCount = 0;
    let lateCount = 0;

    const monthlyAttendances = {}; 
    const personStats = {}; 
    
    // Daily Trends (1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri)
    const dailyTrendData = {
      1: { name: 'Mon', totalMins: 0, count: 0 },
      2: { name: 'Tue', totalMins: 0, count: 0 },
      3: { name: 'Wed', totalMins: 0, count: 0 },
      4: { name: 'Thu', totalMins: 0, count: 0 },
      5: { name: 'Fri', totalMins: 0, count: 0 },
    };

    const tableDetails = [];

    filteredData.forEach(record => {
      const monthStr = record.Date.substring(0, 7);
      if (!monthlyAttendances[monthStr]) monthlyAttendances[monthStr] = 0;
      monthlyAttendances[monthStr]++;

      const inMins = timeToMinutes(record.InTime);
      const outMins = timeToMinutes(record.OutTime);
      
      let isLate = false;
      let overtimeMins = 0;

      if (!personStats[record.Name]) {
        personStats[record.Name] = { onTime: 0, late: 0, overtimeMins: 0, totalPunches: 0 };
      }

      if (inMins !== null) {
        totalLoginMinutes += inMins;
        loginCount++;
        isLate = inMins > LATE_THRESHOLD_MINUTES;
        
        if (isLate) {
          lateCount++;
          personStats[record.Name].late++;
        } else {
          onTimeCount++;
          personStats[record.Name].onTime++;
        }
        personStats[record.Name].totalPunches++;

        // Track trend by day of week
        const d = new Date(record.Date);
        const dayOfWeek = d.getDay();
        if (dailyTrendData[dayOfWeek]) {
          dailyTrendData[dayOfWeek].totalMins += inMins;
          dailyTrendData[dayOfWeek].count++;
        }
      }

      if (outMins !== null) {
        totalLogoutMinutes += outMins;
        logoutCount++;
        if (outMins > OVERTIME_THRESHOLD_MINUTES) {
          overtimeMins = outMins - OVERTIME_THRESHOLD_MINUTES;
          personStats[record.Name].overtimeMins += overtimeMins;
        }
      }

      tableDetails.push({
        date: record.Date,
        name: record.Name,
        inStr: record.InTime ? record.InTime.trim() : '-',
        outStr: record.OutTime ? record.OutTime.trim() : '-',
        isLate,
        overtimeMins
      });
    });

    tableDetails.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));

    const averageLoginTime = loginCount > 0 
      ? formatMinutesToTimeString(Math.round(totalLoginMinutes / loginCount)) : "N/A";
    const averageLogoutTime = logoutCount > 0 
      ? formatMinutesToTimeString(Math.round(totalLogoutMinutes / logoutCount)) : "N/A";

    const punctualityData = [
      { name: 'On Time', value: onTimeCount },
      { name: 'Late', value: lateCount }
    ];

    // Compute Daily Trend Chart Data
    const trendChartData = [1, 2, 3, 4, 5].map(day => {
      const td = dailyTrendData[day];
      const avgMins = td.count > 0 ? Math.round(td.totalMins / td.count) : null;
      // Convert to decimal hours for charting (e.g. 9.5 for 9:30)
      const decimalHours = avgMins !== null ? +(avgMins / 60).toFixed(2) : null;
      return {
        day: td.name,
        avgTime: decimalHours,
        tooltipStr: avgMins !== null ? formatMinutesToTimeString(avgMins) : 'N/A'
      };
    });

    // Leaderboards
    let mostPunctual = { name: 'None', ratio: 0, count: 0 };
    let mostOvertime = { name: 'None', hours: 0 };

    Object.entries(personStats).forEach(([name, stats]) => {
      const ratio = stats.totalPunches > 0 ? (stats.onTime / stats.totalPunches) : 0;
      // Tie breaker goes to the person with more total punches
      if (ratio > mostPunctual.ratio || (ratio === mostPunctual.ratio && stats.onTime > mostPunctual.count)) {
        mostPunctual = { name, ratio, count: stats.onTime };
      }

      const otHours = stats.overtimeMins / 60;
      if (otHours > mostOvertime.hours) {
        mostOvertime = { name, hours: otHours };
      }
    });

    const chartData = Object.entries(monthlyAttendances)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ym, count]) => ({
        month: formatMonthOption(ym),
        attendances: count
      }));

    return {
      averageLoginTime,
      averageLogoutTime,
      punctualityData,
      trendChartData,
      mostPunctual,
      mostOvertime,
      chartData,
      tableDetails,
      totalRecords: filteredData.length,
      totalLogins: loginCount
    };
  }, [rawData, selectedPerson, selectedMonth, selectedWeek]);

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

  const CustomTrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '0.5rem', backdropFilter: 'blur(12px)' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{label}</p>
          <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Avg Arrival: {payload[0].payload.tooltipStr}
          </p>
        </div>
      );
    }
    return null;
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/un_logo.svg" alt="UN Logo" style={{ width: '48px', height: '48px' }} />
          <h1>Usman Nagarta Attendance</h1>
        </div>
        
        <div className="filters-container">
          <div className="filter-group">
            <Filter size={18} color="var(--primary)" />
            <span className="filter-label">Filters:</span>
          </div>

          <div className="filter-group">
            <select className="filter-select" value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
              <option value="All">All Persons</option>
              {filterOptions.persons.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select className="filter-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              <option value="All">All Months</option>
              {filterOptions.months.map(m => (
                <option key={m} value={m}>{formatMonthOption(m)}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select className="filter-select" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
              <option value="All">All Weeks</option>
              {filterOptions.weeks.map(w => (
                <option key={w} value={w}>{`Week of ${w}`}</option>
              ))}
            </select>
          </div>

          {(selectedPerson !== 'All' || selectedMonth !== 'All' || selectedWeek !== 'All') && (
            <button 
              onClick={() => { setSelectedPerson('All'); setSelectedMonth('All'); setSelectedWeek('All'); }}
              style={{
                background: 'transparent',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              Clear Filters
            </button>
          )}
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
              <div className="metric-icon time">
                <Award size={28} />
              </div>
              <div className="metric-content">
                <div className="metric-label">Most Punctual</div>
                <div className="metric-value" style={{ fontSize: '1.25rem' }}>{analytics.mostPunctual.name}</div>
                <div className="metric-sub">{Math.round(analytics.mostPunctual.ratio * 100)}% On-Time Rate</div>
              </div>
            </div>

            <div className="glass-panel metric-card">
              <div className="metric-icon late">
                <TrendingUp size={28} />
              </div>
              <div className="metric-content">
                <div className="metric-label">Most Overtime</div>
                <div className="metric-value" style={{ fontSize: '1.25rem' }}>{analytics.mostOvertime.name}</div>
                <div className="metric-sub">{analytics.mostOvertime.hours.toFixed(1)} Extra Hrs</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="glass-panel">
              <h2>Punctuality Ratio</h2>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {analytics.punctualityData[0].value > 0 || analytics.punctualityData[1].value > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.punctualityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.punctualityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>No punch data</span>
                )}
              </div>
            </div>

            <div className="glass-panel">
              <h2>Avg Daily Arrival Trend</h2>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.trendChartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="var(--text-secondary)" 
                      tick={{ fill: 'var(--text-secondary)' }} 
                      tickFormatter={(val) => `${Math.floor(val)}:${Math.round((val % 1) * 60).toString().padStart(2, '0')}`}
                    />
                    <Tooltip content={<CustomTrendTooltip />} />
                    <Line type="monotone" dataKey="avgTime" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

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
