package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"


	"github.com/docker/docker/api/types"

	"github.com/docker/docker/client"
)

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
}

var (
	dockerCli *client.Client
)

func main() {
	var err error
	// Initialize Docker Client (uses environment variables automatically)
	dockerCli, err = client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Fatalf("Error creating docker client: %v", err)
	}

	// Serve Static Files
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	// API Endpoint
	http.HandleFunc("/api/stats", handleStats)

	fmt.Println("Server starting on :8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleStats(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	containers, err := dockerCli.ContainerList(ctx, types.ContainerListOptions{All: false}) // Only running containers
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var results []ContainerData
	var wg sync.WaitGroup
	var mutex sync.Mutex

	// Fetch stats for each container concurrently
	for _, c := range containers {
		wg.Add(1)
		go func(c types.Container) {
			defer wg.Done()
			
			// We request a one-time stream snapshot (stream: false)
			statsJSON, err := dockerCli.ContainerStats(ctx, c.ID, false)
			if err != nil {
				log.Printf("Error getting stats for %s: %v", c.ID[:10], err)
				return
			}
			defer statsJSON.Body.Close()

			var stats types.StatsJSON
			if err := json.NewDecoder(statsJSON.Body).Decode(&stats); err != nil {
				return
			}

			data := processStats(c, &stats)
			
			mutex.Lock()
			results = append(results, data)
			mutex.Unlock()
		}(c)
	}

	wg.Wait()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

// processStats calculates percentages from raw docker stats
func processStats(c types.Container, stats *types.StatsJSON) ContainerData {
	// CPU Calculation
	cpuDelta := float64(stats.CPUStats.CPUUsage.TotalUsage) - float64(stats.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(stats.CPUStats.SystemUsage) - float64(stats.PreCPUStats.SystemUsage)
	numberCPUs := float64(stats.CPUStats.OnlineCPUs)
	if numberCPUs == 0.0 {
		numberCPUs = float64(len(stats.CPUStats.CPUUsage.PercpuUsage))
	}

	cpuPercent := 0.0
	if systemDelta > 0.0 && cpuDelta > 0.0 {
		cpuPercent = (cpuDelta / systemDelta) * numberCPUs * 100.0
	}

	// Memory Calculation
	memUsage := float64(stats.MemoryStats.Usage) / 1024 / 1024 // MB
	memLimit := float64(stats.MemoryStats.Limit) / 1024 / 1024 // MB
	memPercent := 0.0
	if memLimit > 0 {
		memPercent = (memUsage / memLimit) * 100.0
	}

	// Network I/O
	var rx, tx float64
	for _, network := range stats.Networks {
		rx += float64(network.RxBytes)
		tx += float64(network.TxBytes)
	}

	// Block I/O
	var blkRead, blkWrite float64
	for _, blk := range stats.BlkioStats.IoServiceBytesRecursive {
		if blk.Op == "read" {
			blkRead += float64(blk.Value)
		} else if blk.Op == "write" {
			blkWrite += float64(blk.Value)
		}
	}

	name := "unknown"
	if len(c.Names) > 0 {
		name = c.Names[0][1:] // Remove leading slash
	}

	return ContainerData{
		ID:          c.ID[:12],
		Name:        name,
		Image:       c.Image,
		State:       c.State,
		Status:      c.Status,
		CPUPercent:  cpuPercent,
		MemUsage:    memUsage,
		MemLimit:    memLimit,
		MemPercent:  memPercent,
		NetInput:    rx / 1024,
		NetOutput:   tx / 1024,
		BlockInput:  blkRead / 1024,
		BlockOutput: blkWrite / 1024,
	}
}