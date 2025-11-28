package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/docker/docker/api/types"

	"gocontainerops/internal/container"
	"gocontainerops/internal/docker"
)

// Handler struct to hold dependencies
type Handler struct {
	DockerService docker.DockerService
}

// HandleProcesses handles the /api/processes/ endpoint
func (h *Handler) HandleProcesses(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	id := strings.TrimPrefix(r.URL.Path, "/api/processes/")

	top, err := h.DockerService.ContainerTop(ctx, id, []string{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(top)
}

// HandleLogs handles the /api/logs/ endpoint
func (h *Handler) HandleLogs(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	id := strings.TrimPrefix(r.URL.Path, "/api/logs/")

	follow := r.URL.Query().Get("follow") == "true"

	options := types.ContainerLogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Timestamps: true,
		Tail:       "200", // Always show last 200 lines
		Follow:     follow,
	}

	reader, err := h.DockerService.ContainerLogs(ctx, id, options)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer reader.Close()

	w.Header().Set("Content-Type", "text/plain")
	if follow {
		// For follow mode, we need to stream the logs
		// Set appropriate headers for streaming
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
			return
		}

		hdr := make([]byte, 8)
		for {
			_, err := reader.Read(hdr)
			if err != nil {
				break
			}
			size := int(hdr[4])<<24 | int(hdr[5])<<16 | int(hdr[6])<<8 | int(hdr[7])
			content := make([]byte, size)
			_, err = reader.Read(content)
			if err != nil {
				break
			}
			fmt.Fprintf(w, "data: %s\n\n", string(content))
			flusher.Flush()
		}
	} else {
		// For non-follow mode, just send the logs once
		hdr := make([]byte, 8)
		for {
			_, err := reader.Read(hdr)
			if err != nil {
				break
			}
			size := int(hdr[4])<<24 | int(hdr[5])<<16 | int(hdr[6])<<8 | int(hdr[7])
			content := make([]byte, size)
			_, err = reader.Read(content)
			if err != nil {
				break
			}
			w.Write(content)
		}
	}
}

// HandleStats handles the /api/stats endpoint
func (h *Handler) HandleStats(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	containers, err := h.DockerService.ListContainers(ctx, types.ContainerListOptions{All: true}) // Get all containers to filter by status
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	searchQuery := r.URL.Query().Get("search")
	imageFilter := r.URL.Query().Get("image")
	statusFilter := r.URL.Query().Get("status")

	var filteredContainers []types.Container
	for _, c := range containers {
		match := true

		// Filter by status
		if statusFilter != "" {
			if !strings.EqualFold(c.State, statusFilter) {
				match = false
			}
		}

		// Filter by image
		if imageFilter != "" {
			if !strings.Contains(strings.ToLower(c.Image), strings.ToLower(imageFilter)) {
				match = false
			}
		}

		// Filter by search query (name)
		if searchQuery != "" {
			name := "unknown"
			if len(c.Names) > 0 {
				name = c.Names[0][1:] // Remove leading slash
			}
			if !strings.Contains(strings.ToLower(name), strings.ToLower(searchQuery)) {
				match = false
			}
		}

		if match {
			filteredContainers = append(filteredContainers, c)
		}
	}

	var results []container.ContainerData
	var wg sync.WaitGroup
	var mutex sync.Mutex

	// Fetch stats for each container concurrently
	for _, c := range filteredContainers {
		wg.Add(1)
		go func(c types.Container) {
			defer wg.Done()

			// We request a one-time stream snapshot (stream: false)
			statsReader, err := h.DockerService.ContainerStats(ctx, c.ID) // Renamed to statsReader for clarity
            if err != nil {
                log.Printf("Error getting stats for %s: %v", c.ID[:10], err)
                return
            }
            defer statsReader.Close() // Use statsReader directly, remove .Body

            var stats types.StatsJSON
            // Decode directly from the statsReader, remove .Body
            if err := json.NewDecoder(statsReader).Decode(&stats); err != nil { 
                return
            }

			data := container.ProcessStats(c, &stats)

			mutex.Lock()
			results = append(results, data)
			mutex.Unlock()
		}(c)
	}

	wg.Wait()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}