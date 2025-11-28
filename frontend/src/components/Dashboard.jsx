import React from 'react';
import StatCard from './StatCard';
import './Dashboard.css';

function Dashboard({ containers }) {
  const activeContainers = containers.filter(c => c.state === 'running').length;
  const totalContainers = containers.length;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard
          title="Active Containers"
          value={activeContainers}
          icon="🚀"
        />
        <StatCard
          title="Total Containers"
          value={totalContainers}
          icon="📦"
        />
      </div>
    </div>
  );
}

export default Dashboard;
