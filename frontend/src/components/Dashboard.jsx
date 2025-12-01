import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import './Dashboard.css';

function Dashboard({ containers, onFilterByStatus }) {
  const [aggregateMetrics, setAggregateMetrics] = useState(null);

  useEffect(() => {
    const fetchAggregateMetrics = async () => {
      try {
        const response = await fetch('/api/metrics/aggregate');
        const data = await response.json();
        setAggregateMetrics(data);
      } catch (error) {
        console.error('Error fetching aggregate metrics:', error);
      }
    };

    fetchAggregateMetrics();
    const interval = setInterval(fetchAggregateMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  // Fallback to local calculation if API fails
  const activeContainers = aggregateMetrics?.running_containers ?? containers.filter(c => c.state === 'running').length;
  const totalContainers = aggregateMetrics?.total_containers ?? containers.length;
  const stoppedContainers = aggregateMetrics?.stopped_containers ?? (totalContainers - activeContainers);

  const formatBytes = (kb) => {
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div onClick={() => onFilterByStatus('running')} style={{ cursor: 'pointer' }}>
          <StatCard
            title="Active Containers"
            value={activeContainers}
            icon="🚀"
            subtitle={aggregateMetrics?.average_cpu_percent ? `Avg CPU: ${aggregateMetrics.average_cpu_percent.toFixed(1)}%` : ''}
          />
        </div>

        <div onClick={() => onFilterByStatus('')} style={{ cursor: 'pointer' }}>
          <StatCard
            title="Total Containers"
            value={totalContainers}
            icon="📦"
            subtitle={stoppedContainers > 0 ? `${stoppedContainers} stopped` : 'All running'}
          />
        </div>

        {aggregateMetrics && (
          <>
            <StatCard
              title="Total CPU Usage"
              value={`${aggregateMetrics.total_cpu_percent.toFixed(1)}%`}
              icon="⚡"
              subtitle={`Avg: ${aggregateMetrics.average_cpu_percent.toFixed(1)}%`}
            />

            <StatCard
              title="Total Memory"
              value={`${aggregateMetrics.total_mem_usage.toFixed(0)} MB`}
              icon="💾"
              subtitle={aggregateMetrics.average_mem_percent ? `Avg: ${aggregateMetrics.average_mem_percent.toFixed(1)}%` : ''}
            />

            <StatCard
              title="Network I/O"
              value={formatBytes(aggregateMetrics.total_net_input + aggregateMetrics.total_net_output)}
              icon="🌐"
              subtitle={`↓ ${formatBytes(aggregateMetrics.total_net_input)} ↑ ${formatBytes(aggregateMetrics.total_net_output)}`}
            />

            <StatCard
              title="Disk I/O"
              value={formatBytes(aggregateMetrics.total_block_input + aggregateMetrics.total_block_output)}
              icon="💿"
              subtitle={`↓ ${formatBytes(aggregateMetrics.total_block_input)} ↑ ${formatBytes(aggregateMetrics.total_block_output)}`}
            />

            {aggregateMetrics.most_restarted_container && (
              <StatCard
                title="Most Restarted"
                value={aggregateMetrics.most_restarted_container.name}
                icon="🔄"
                subtitle={`${aggregateMetrics.most_restarted_container.restart_count} restarts`}
                highlight={aggregateMetrics.most_restarted_container.restart_count > 5}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

