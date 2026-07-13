import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import ChartsSection from './components/ChartsSection';
import DetailedLog from './components/DetailedLog';
import { getWeekStartString } from './utils/helpers';
import { useAttendanceAnalytics } from './hooks/useAttendanceAnalytics';
import './index.css';

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
        // Pre-sort by Date (descending) then Name (ascending)
        processed.sort((a, b) => b.Date.localeCompare(a.Date) || a.Name.localeCompare(b.Name));
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

  const analytics = useAttendanceAnalytics(rawData, selectedPerson, selectedMonth, selectedWeek);

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
