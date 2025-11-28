package container

// ContainerData holds the processed stats for the UI
type ContainerData struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Image       string  `json:"image"`
	State       string  `json:"state"`
	Status      string  `json:"status"`
	CPUPercent  float64 `json:"cpu_percent"`
	MemUsage    float64 `json:"mem_usage"` // in MB
	MemLimit    float64 `json:"mem_limit"` // in MB
	MemPercent  float64 `json:"mem_percent"`
	NetInput    float64 `json:"net_input"`  // KB
	NetOutput   float64 `json:"net_output"` // KB
	BlockInput  float64 `json:"block_input"` // KB
	BlockOutput float64 `json:"block_output"` // KB
	Created     int64   `json:"created"`
}
