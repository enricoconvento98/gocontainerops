package container

// ContainerData holds the processed stats for the UI
type ContainerData struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	Image        string  `json:"image"`
	State        string  `json:"state"`
	Status       string  `json:"status"`
	CPUPercent   float64 `json:"cpu_percent"`
	MemUsage     float64 `json:"mem_usage"` // in MB
	MemLimit     float64 `json:"mem_limit"` // in MB
	MemPercent   float64 `json:"mem_percent"`
	NetInput     float64 `json:"net_input"`  // KB
	NetOutput    float64 `json:"net_output"` // KB
	BlockInput   float64 `json:"block_input"` // KB
	BlockOutput  float64 `json:"block_output"` // KB
	Created      int64   `json:"created"`
	RestartCount int     `json:"restart_count"`
	Uptime       int64   `json:"uptime"` // in seconds
}

// AggregateMetrics holds system-wide aggregate statistics
type AggregateMetrics struct {
	TotalContainers       int     `json:"total_containers"`
	RunningContainers     int     `json:"running_containers"`
	StoppedContainers     int     `json:"stopped_containers"`
	TotalCPUPercent       float64 `json:"total_cpu_percent"`
	TotalMemUsage         float64 `json:"total_mem_usage"` // in MB
	TotalMemLimit         float64 `json:"total_mem_limit"` // in MB
	TotalNetInput         float64 `json:"total_net_input"`  // KB
	TotalNetOutput        float64 `json:"total_net_output"` // KB
	TotalBlockInput       float64 `json:"total_block_input"` // KB
	TotalBlockOutput      float64 `json:"total_block_output"` // KB
	AverageCPUPercent     float64 `json:"average_cpu_percent"`
	AverageMemPercent     float64 `json:"average_mem_percent"`
	MostRestartedContainer *MostRestartedInfo `json:"most_restarted_container,omitempty"`
}

// MostRestartedInfo holds information about the most restarted container
type MostRestartedInfo struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	RestartCount int    `json:"restart_count"`
}
