import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import ChartsSection from './components/ChartsSection';
import DetailedLog from './components/DetailedLog';
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

function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [selectedPerson, setSelectedPerson] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedWeek, setSelectedWeek] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPerson, selectedMonth, selectedWeek]);

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

    const trendChartData = [1, 2, 3, 4, 5].map(day => {
      const td = dailyTrendData[day];
      const avgMins = td.count > 0 ? Math.round(td.totalMins / td.count) : null;
      const decimalHours = avgMins !== null ? +(avgMins / 60).toFixed(2) : null;
      return {
        day: td.name,
        avgTime: decimalHours,
        tooltipStr: avgMins !== null ? formatMinutesToTimeString(avgMins) : 'N/A'
      };
    });

    let mostPunctual = { name: 'None', ratio: 0, count: 0 };
    let mostOvertime = { name: 'None', hours: 0 };

    Object.entries(personStats).forEach(([name, stats]) => {
      const ratio = stats.totalPunches > 0 ? (stats.onTime / stats.totalPunches) : 0;
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
      <Header 
        selectedPerson={selectedPerson}
        setSelectedPerson={setSelectedPerson}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedWeek={selectedWeek}
        setSelectedWeek={setSelectedWeek}
        filterOptions={filterOptions}
      />
      
      {analytics && (
        <>
          <MetricCards analytics={analytics} />
          <ChartsSection analytics={analytics} />
          <DetailedLog 
            analytics={analytics} 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
          />
        </>
      )}
    </div>
  );
}

export default App;
