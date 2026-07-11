import React from 'react';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const PIE_COLORS = ['#10b981', '#ef4444']; // Green for On Time, Red for Late

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

const ChartsSection = React.memo(({ analytics }) => {
  if (!analytics) return null;

  return (
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
  );
});

export default ChartsSection;
