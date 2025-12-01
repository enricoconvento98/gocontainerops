package main

import (
	"fmt"
	"log"
	"net/http"

	"gocontainerops/internal/docker"
	"gocontainerops/internal/handler"
	"gocontainerops/internal/storage"
)

func main() {
	// Initialize Docker Client
	dockerClient, err := docker.NewClient()
	if err != nil {
		log.Fatalf("Error creating docker client: %v", err)
	}

	// Initialize History Store (in-memory by default)
	historyStore := storage.NewInMemoryStore()
	log.Println("Using in-memory history store")

	// Initialize Handler with DockerService and HistoryStore
	appHandler := &handler.Handler{
		DockerService: dockerClient,
		HistoryStore:  historyStore,
	}

	// Serve Static Files
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	// API Endpoints
	http.HandleFunc("/api/stats", appHandler.HandleStats)
	http.HandleFunc("/api/metrics/aggregate", appHandler.HandleAggregateMetrics)
	http.HandleFunc("/api/logs/", appHandler.HandleLogs)
	http.HandleFunc("/api/processes/", appHandler.HandleProcesses)
	http.HandleFunc("/api/history/", appHandler.HandleContainerHistory)
	http.HandleFunc("/api/events", appHandler.HandleEvents)

	fmt.Println("Server starting on :8080...")
	fmt.Println("📊 Dashboard: http://localhost:8080")
	fmt.Println("📈 Aggregate Metrics: http://localhost:8080/api/metrics/aggregate")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

