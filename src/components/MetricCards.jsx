import React from 'react';
import { Clock, LogOut, Award, TrendingUp } from 'lucide-react';

const MetricCards = React.memo(({ analytics }) => {
  if (!analytics) return null;

  return (
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
  );
});

export default MetricCards;
