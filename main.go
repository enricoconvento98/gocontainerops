package main

import (
	"fmt"
	"log"
	"net/http"

	"gocontainerops/internal/docker"
	"gocontainerops/internal/handler" // Import the new package
)

func main() {
	// Initialize Docker Client
	dockerClient, err := docker.NewClient()
	if err != nil {
		log.Fatalf("Error creating docker client: %v", err)
	}

	// Initialize Handler with DockerService
	appHandler := &handler.Handler{
		DockerService: dockerClient,
	}

	// Serve Static Files
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	// API Endpoints
	http.HandleFunc("/api/stats", appHandler.HandleStats)
	http.HandleFunc("/api/logs/", appHandler.HandleLogs)
	http.HandleFunc("/api/processes/", appHandler.HandleProcesses)

	fmt.Println("Server starting on :8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

