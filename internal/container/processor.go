package container

import (
	"strings"

	"github.com/docker/docker/api/types"
)

// processStats calculates percentages from raw docker stats
func ProcessStats(c types.Container, stats *types.StatsJSON) ContainerData {
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
		Created:     c.Created,
	}
}
