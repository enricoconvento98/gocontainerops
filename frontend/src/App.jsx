import { useState, useEffect, useRef } from 'react';
import ContainerCard from './components/ContainerCard';
import DetailedView from './components/DetailedView';
import './App.css';

function App() {
  const [containers, setContainers] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const containerHistories = useRef({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
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
  }, [selectedContainer]);

  const handleCardClick = (container) => {
    setSelectedContainer(container);
  };

  const handleCloseDetail = () => {
    setSelectedContainer(null);
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div>
            <h1 className="title">Docker Live Monitor</h1>
            <p className="subtitle">Real-time container metrics</p>
          </div>
          <div className="last-updated">
            {lastUpdated && `Last updated: ${lastUpdated}`}
          </div>
        </header>

        <div className={`main-content ${selectedContainer ? 'split-view' : ''}`}>
          <div className="containers-section">
            <div className="containers-scroll">
              <div className="grid">
                {loading ? (
                  <div className="loading">Loading Docker Stats...</div>
                ) : containers.length === 0 ? (
                  <div className="empty">No active containers found.</div>
                ) : (
                  containers.map((container) => (
                    <ContainerCard
                      key={container.id}
                      container={container}
                      onClick={() => handleCardClick(container)}
                      isSelected={selectedContainer?.id === container.id}
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
