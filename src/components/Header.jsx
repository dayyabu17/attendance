import React from 'react';
import { Filter } from 'lucide-react';

function formatMonthOption(ym) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [year, month] = ym.split('-');
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

const Header = ({ 
  selectedPerson, 
  setSelectedPerson, 
  selectedMonth, 
  setSelectedMonth, 
  selectedWeek, 
  setSelectedWeek, 
  filterOptions 
}) => {
  return (
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
  );
};

export default Header;
