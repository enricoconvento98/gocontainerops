import { useState, useEffect, useRef, useCallback } from 'react';
import ContainerCard from './components/ContainerCard';
import DetailedView from './components/DetailedView';
import Dashboard from './components/Dashboard';
import './App.css';
import './components/Dashboard.css';
import './components/StatCard.css';

const ITEMS_PER_PAGE = 10; // Number of containers per page

function App() {
  // State for filters and sorting, initialized from URL
  const getInitialFilter = (paramName, defaultValue) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(paramName) || defaultValue;
  };

  const [searchQuery, setSearchQuery] = useState(() => getInitialFilter('search', ''));
  const [imageFilter, setImageFilter] = useState(() => getInitialFilter('image', ''));
  const [statusFilter, setStatusFilter] = useState(() => getInitialFilter('status', ''));
  const [sortOrder, setSortOrder] = useState(() => getInitialFilter('sort', 'created_desc'));

  const [containers, setContainers] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const containerHistories = useRef({});

  // Effect to update URL when filters/sort change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (imageFilter) params.set('image', imageFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (sortOrder) params.set('sort', sortOrder);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchQuery, imageFilter, statusFilter, sortOrder]);

  // Effect to fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (imageFilter) params.append('image', imageFilter);
        if (statusFilter) params.append('status', statusFilter);

        const response = await fetch(`/api/stats?${params.toString()}`);
        let data = await response.json();

        // Apply sorting
        if (data) {
          data.sort((a, b) => {
            if (sortOrder === 'created_desc') {
              return b.created - a.created;
            }
            // Add other sorting options here if needed
            return 0;
          });
        }

        setContainers(prevContainers => {
          const newContainers = data || [];
          if (selectedContainer) {
            return prevContainers.map(pc => {
              const updatedContainer = newContainers.find(nc => nc.id === pc.id);
              return updatedContainer || pc;
            });
          }
          return newContainers;
        });

        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
        setCurrentPage(1); // Reset to first page on new data/filters

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
  }, [searchQuery, imageFilter, statusFilter, sortOrder]); // Add sortOrder to dependencies

  const handleCardClick = (container) => {
    setSelectedContainer(container);
  };

  const handleCloseDetail = () => {
    setSelectedContainer(null);
  };

  const handleSearchChange = useCallback((event) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleImageFilterChange = useCallback((event) => {
    setImageFilter(event.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((event) => {
    setStatusFilter(event.target.value);
  }, []);

  const handleFilterByStatus = useCallback((status) => {
    setStatusFilter(status);
  }, []);

  const handleSortOrderChange = useCallback((event) => {
    setSortOrder(event.target.value);
  }, []);

  const toggleDashboard = () => {
    setShowDashboard(!showDashboard);
  };

  // Pagination Logic
  const indexOfLastContainer = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstContainer = indexOfLastContainer - ITEMS_PER_PAGE;
  const currentContainers = containers.slice(indexOfFirstContainer, indexOfLastContainer);

  const totalPages = Math.ceil(containers.length / ITEMS_PER_PAGE);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-title">
            <img src="/logo.png" alt="GoContainerOps Logo" className="logo" />
            <div>
              <h1 className="title">GoContainerOps</h1>
              <p className="subtitle">Real-time Go Container Metrics</p>
            </div>
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
            <div className="filter-dropdown">
              <select value={sortOrder} onChange={handleSortOrderChange}>
                <option value="created_desc">Last Started</option>
                {/* Add more sorting options here */}
              </select>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={toggleDashboard} className="toggle-dashboard-btn">
              {showDashboard ? 'Hide' : 'Show'} Dashboard
            </button>
            <div className="last-updated">
              {lastUpdated && `Last updated: ${lastUpdated}`}
            </div>
          </div>
        </header>

        {showDashboard && <Dashboard containers={containers} onFilterByStatus={handleFilterByStatus} />}

        <div className={`main-content ${selectedContainer ? 'split-view' : ''}`}>
          <div className="containers-section">
            <div className="containers-scroll">
              <div className="container-list">
                {loading ? (
                  <div className="loading">Loading Docker Stats...</div>
                ) : currentContainers.length === 0 ? (
                  <div className="empty">No active containers found.</div>
                ) : (
                  currentContainers.map((container) => (
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
            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
            )}
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
