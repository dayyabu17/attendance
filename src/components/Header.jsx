import React, { useState, useEffect } from 'react';
import { Filter, Sun, Moon } from 'lucide-react';
import { formatMonthOption } from '../utils/helpers';

const Header = ({ 
  selectedPerson, 
  setSelectedPerson, 
  selectedMonth, 
  setSelectedMonth, 
  selectedWeek, 
  setSelectedWeek, 
  filterOptions 
}) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <div className="header-container" style={{ alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--primary)' }}>
              <path d="M12 42V16C12 9.37258 17.3726 4 24 4C30.6274 4 36 9.37258 36 16V42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M20 42V20L28 42V20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 42H42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <h1>Usman Nagarta Attendance</h1>
          </div>
          <button 
            onClick={() => setIsDark(!isDark)}
            style={{
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.5rem',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              width: '40px',
              height: '40px'
            }}
            title="Toggle Theme"
          >
            {isDark ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
        
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
    </div>
  );
};

export default Header;
