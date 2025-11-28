import { useState, useEffect, useRef } from 'react';
import ContainerCard from './components/ContainerCard';
import DetailedView from './components/DetailedView';
import './App.css';

function App() {
  const [containers, setContainers] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageFilter, setImageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const containerHistories = useRef({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (imageFilter) params.append('image', imageFilter);
        if (statusFilter) params.append('status', statusFilter);

        const response = await fetch(`/api/stats?${params.toString()}`);
        const data = await response.json();
        setContainers(data || []);
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);

        // Update histories
        (data || []).forEach((container) => {
          if (!containerHistories.current[container.id]) {
            containerHistories.current[container.id] = [];
          }
          containerHistories.current[container.id].push(container.mem_usage);
          if (containerHistories.current[container.id].length > 30) {
            containerHistories.current[container.id].shift();
          }
        });

        // Update selected container with latest data
        if (selectedContainer) {
          const updated = data.find(c => c.id === selectedContainer.id);
          if (updated) {
            setSelectedContainer(updated);
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000);

    return () => clearInterval(interval);
  }, [selectedContainer, searchQuery, imageFilter, statusFilter]);

  const handleCardClick = (container) => {
    setSelectedContainer(container);
  };

  const handleCloseDetail = () => {
    setSelectedContainer(null);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleImageFilterChange = (event) => {
    setImageFilter(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  // Frontend filtering is no longer needed as backend handles it
  const displayedContainers = containers;

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div>
            <h1 className="title">Docker Live Monitor</h1>
            <p className="subtitle">Real-time container metrics</p>
          </div>
          <div className="filters">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <div className="filter-dropdown">
              <input
                type="text"
                placeholder="Filter by image..."
                value={imageFilter}
                onChange={handleImageFilterChange}
              />
            </div>
            <div className="filter-dropdown">
              <select value={statusFilter} onChange={handleStatusFilterChange}>
                <option value="">All Statuses</option>
                <option value="running">Running</option>
                <option value="exited">Exited</option>
                <option value="paused">Paused</option>
                <option value="restarting">Restarting</option>
                <option value="dead">Dead</option>
              </select>
            </div>
          </div>
          <div className="last-updated">
            {lastUpdated && `Last updated: ${lastUpdated}`}
          </div>
        </header>

        <div className={`main-content ${selectedContainer ? 'split-view' : ''}`}>
          <div className="containers-section">
            <div className="containers-scroll">
              <div className="container-list">
                {loading ? (
                  <div className="loading">Loading Docker Stats...</div>
                ) : displayedContainers.length === 0 ? (
                  <div className="empty">No active containers found.</div>
                ) : (
                  displayedContainers.map((container) => (
                    <ContainerCard
                      key={container.id}
                      container={container}
                      onClick={() => handleCardClick(container)}
                      isSelected={selectedContainer?.id === container.id}
                      isDetailedViewOpen={!!selectedContainer}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {selectedContainer && (
            <DetailedView
              container={selectedContainer}
              onClose={handleCloseDetail}
              history={containerHistories.current[selectedContainer.id] || []}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
