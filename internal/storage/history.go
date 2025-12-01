package storage

import (
	"sync"
	"time"
)

// ContainerEvent represents a container lifecycle event
type ContainerEvent struct {
	ContainerID   string    `json:"container_id"`
	ContainerName string    `json:"container_name"`
	EventType     string    `json:"event_type"` // "start", "stop", "restart"
	Timestamp     time.Time `json:"timestamp"`
	RestartCount  int       `json:"restart_count"`
}

// MetricSnapshot represents a point-in-time metric reading
type MetricSnapshot struct {
	ContainerID string    `json:"container_id"`
	Timestamp   time.Time `json:"timestamp"`
	CPUPercent  float64   `json:"cpu_percent"`
	MemUsage    float64   `json:"mem_usage"`
	MemPercent  float64   `json:"mem_percent"`
	NetInput    float64   `json:"net_input"`
	NetOutput   float64   `json:"net_output"`
}

// HistoryStore interface for storage implementations
type HistoryStore interface {
	// Events
	AddEvent(event ContainerEvent) error
	GetEvents(containerID string, limit int) ([]ContainerEvent, error)
	GetAllEvents(limit int) ([]ContainerEvent, error)
	
	// Metrics
	AddMetric(metric MetricSnapshot) error
	GetMetrics(containerID string, since time.Time) ([]MetricSnapshot, error)
	
	// Analytics
	GetMostRestartedContainers(limit int) ([]ContainerRestartStats, error)
	GetContainerUptime(containerID string) (time.Duration, error)
}

// ContainerRestartStats holds restart statistics for a container
type ContainerRestartStats struct {
	ContainerID   string `json:"container_id"`
	ContainerName string `json:"container_name"`
	RestartCount  int    `json:"restart_count"`
	LastRestart   time.Time `json:"last_restart"`
}

// InMemoryStore implements HistoryStore using in-memory storage
type InMemoryStore struct {
	events  []ContainerEvent
	metrics []MetricSnapshot
	mu      sync.RWMutex
	
	// Track container states for uptime calculation
	containerStates map[string]containerState
}

type containerState struct {
	lastStartTime time.Time
	isRunning     bool
	totalUptime   time.Duration
}

// NewInMemoryStore creates a new in-memory history store
func NewInMemoryStore() *InMemoryStore {
	return &InMemoryStore{
		events:          make([]ContainerEvent, 0),
		metrics:         make([]MetricSnapshot, 0),
		containerStates: make(map[string]containerState),
	}
}

// AddEvent adds a container event to the store
func (s *InMemoryStore) AddEvent(event ContainerEvent) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	s.events = append(s.events, event)
	
	// Update container state
	state := s.containerStates[event.ContainerID]
	if event.EventType == "start" || event.EventType == "restart" {
		state.lastStartTime = event.Timestamp
		state.isRunning = true
	} else if event.EventType == "stop" {
		if state.isRunning {
			state.totalUptime += event.Timestamp.Sub(state.lastStartTime)
		}
		state.isRunning = false
	}
	s.containerStates[event.ContainerID] = state
	
	// Keep only last 1000 events to prevent memory bloat
	if len(s.events) > 1000 {
		s.events = s.events[len(s.events)-1000:]
	}
	
	return nil
}

// GetEvents retrieves events for a specific container
func (s *InMemoryStore) GetEvents(containerID string, limit int) ([]ContainerEvent, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	var result []ContainerEvent
	for i := len(s.events) - 1; i >= 0 && len(result) < limit; i-- {
		if s.events[i].ContainerID == containerID {
			result = append(result, s.events[i])
		}
	}
	
	return result, nil
}

// GetAllEvents retrieves all events
func (s *InMemoryStore) GetAllEvents(limit int) ([]ContainerEvent, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	start := len(s.events) - limit
	if start < 0 {
		start = 0
	}
	
	result := make([]ContainerEvent, len(s.events)-start)
	copy(result, s.events[start:])
	
	// Reverse to get newest first
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}
	
	return result, nil
}

// AddMetric adds a metric snapshot to the store
func (s *InMemoryStore) AddMetric(metric MetricSnapshot) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	s.metrics = append(s.metrics, metric)
	
	// Keep only last 10000 metrics (about 5 hours at 2s intervals for ~10 containers)
	if len(s.metrics) > 10000 {
		s.metrics = s.metrics[len(s.metrics)-10000:]
	}
	
	return nil
}

// GetMetrics retrieves metrics for a container since a specific time
func (s *InMemoryStore) GetMetrics(containerID string, since time.Time) ([]MetricSnapshot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	var result []MetricSnapshot
	for i := len(s.metrics) - 1; i >= 0; i-- {
		if s.metrics[i].ContainerID == containerID && s.metrics[i].Timestamp.After(since) {
			result = append(result, s.metrics[i])
		}
	}
	
	// Reverse to get chronological order
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}
	
	return result, nil
}

// GetMostRestartedContainers returns containers sorted by restart count
func (s *InMemoryStore) GetMostRestartedContainers(limit int) ([]ContainerRestartStats, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	// Count restarts per container
	restartCounts := make(map[string]*ContainerRestartStats)
	
	for _, event := range s.events {
		if event.EventType == "restart" {
			stats, exists := restartCounts[event.ContainerID]
			if !exists {
				stats = &ContainerRestartStats{
					ContainerID:   event.ContainerID,
					ContainerName: event.ContainerName,
					RestartCount:  0,
				}
				restartCounts[event.ContainerID] = stats
			}
			stats.RestartCount++
			if event.Timestamp.After(stats.LastRestart) {
				stats.LastRestart = event.Timestamp
			}
		}
	}
	
	// Convert to slice and sort
	var result []ContainerRestartStats
	for _, stats := range restartCounts {
		result = append(result, *stats)
	}
	
	// Simple bubble sort by restart count (descending)
	for i := 0; i < len(result); i++ {
		for j := i + 1; j < len(result); j++ {
			if result[j].RestartCount > result[i].RestartCount {
				result[i], result[j] = result[j], result[i]
			}
		}
	}
	
	if len(result) > limit {
		result = result[:limit]
	}
	
	return result, nil
}

// GetContainerUptime calculates total uptime for a container
func (s *InMemoryStore) GetContainerUptime(containerID string) (time.Duration, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	state, exists := s.containerStates[containerID]
	if !exists {
		return 0, nil
	}
	
	uptime := state.totalUptime
	if state.isRunning {
		uptime += time.Since(state.lastStartTime)
	}
	
	return uptime, nil
}
