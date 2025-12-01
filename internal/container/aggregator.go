package container

import (
	"time"
)

// CalculateAggregateMetrics computes system-wide aggregate statistics
func CalculateAggregateMetrics(containers []ContainerData) AggregateMetrics {
	metrics := AggregateMetrics{
		TotalContainers: len(containers),
	}

	if len(containers) == 0 {
		return metrics
	}

	var runningCount int
	var totalCPU, totalMem, totalMemLimit float64
	var totalNetIn, totalNetOut, totalBlkIn, totalBlkOut float64
	var maxRestarts int
	var mostRestarted *ContainerData

	for i := range containers {
		c := &containers[i]
		
		// Count running containers
		if c.State == "running" {
			runningCount++
		}

		// Aggregate metrics
		totalCPU += c.CPUPercent
		totalMem += c.MemUsage
		totalMemLimit += c.MemLimit
		totalNetIn += c.NetInput
		totalNetOut += c.NetOutput
		totalBlkIn += c.BlockInput
		totalBlkOut += c.BlockOutput

		// Track most restarted container
		if c.RestartCount > maxRestarts {
			maxRestarts = c.RestartCount
			mostRestarted = c
		}
	}

	metrics.RunningContainers = runningCount
	metrics.StoppedContainers = metrics.TotalContainers - runningCount
	metrics.TotalCPUPercent = totalCPU
	metrics.TotalMemUsage = totalMem
	metrics.TotalMemLimit = totalMemLimit
	metrics.TotalNetInput = totalNetIn
	metrics.TotalNetOutput = totalNetOut
	metrics.TotalBlockInput = totalBlkIn
	metrics.TotalBlockOutput = totalBlkOut

	// Calculate averages
	if runningCount > 0 {
		metrics.AverageCPUPercent = totalCPU / float64(runningCount)
		if totalMemLimit > 0 {
			metrics.AverageMemPercent = (totalMem / totalMemLimit) * 100.0
		}
	}

	// Set most restarted container info
	if mostRestarted != nil && maxRestarts > 0 {
		metrics.MostRestartedContainer = &MostRestartedInfo{
			ID:           mostRestarted.ID,
			Name:         mostRestarted.Name,
			RestartCount: mostRestarted.RestartCount,
		}
	}

	return metrics
}

// CalculateUptime calculates container uptime in seconds
func CalculateUptime(created int64, state string) int64 {
	if state != "running" {
		return 0
	}
	
	createdTime := time.Unix(created, 0)
	uptime := time.Since(createdTime)
	
	return int64(uptime.Seconds())
}
