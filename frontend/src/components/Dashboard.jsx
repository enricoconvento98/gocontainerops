import React from 'react';
import StatCard from './StatCard';
import './Dashboard.css';

function Dashboard({ containers, onFilterByStatus }) {
  const activeContainers = containers.filter(c => c.state === 'running').length;
  const totalContainers = containers.length;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div onClick={() => onFilterByStatus('running')} style={{ cursor: 'pointer' }}>
          <StatCard
            title="Active Containers"
            value={activeContainers}
            icon="🚀"
          />
        </div>
        <div onClick={() => onFilterByStatus('')} style={{ cursor: 'pointer' }}>
          <StatCard
            title="Total Containers"
            value={totalContainers}
            icon="📦"
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
