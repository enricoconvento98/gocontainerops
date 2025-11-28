Docker Live Monitor

A lightweight, real-time Docker container monitoring dashboard written in Go (Golang). It connects to the local Docker socket to display CPU usage, memory consumption, network I/O, and block I/O for all active containers.

📂 Folder Structure

docker-monitor/
├── main.go               # Go backend: fetches stats from Docker API
├── go.mod                # Go module definitions
├── Dockerfile            # Multi-stage Docker build file
├── docker-compose.yml    # Container orchestration & socket mounting
├── Makefile              # Shortcuts for building and running
└── frontend/             # React frontend application
    ├── src/
    │   ├── App.jsx       # Main application component
    │   ├── components/
    │   │   └── ContainerCard.jsx  # Container card with charts
    │   └── ...
    ├── package.json
    └── vite.config.js    # Vite configuration with proxy



🚀 Getting Started

Prerequisites

Docker and Docker Compose installed on your machine.

Go 1.21+ (Only if you want to build/run locally without Docker).

Option 1: Run with Docker Compose (Recommended)

This is the easiest way to run the application, as it isolates the environment and handles dependencies automatically.

Start the application:

make up
# OR
docker-compose up --build -d


Open your browser:
Navigate to http://localhost:8080.

Stop the application:

make down
# OR
docker-compose down


Option 2: Run Locally (for Development)

If you have Go installed and want to run the binary directly on your host:

Install dependencies:

go mod tidy


Run the application:

go run main.go
# OR
make run


Note: The application requires access to /var/run/docker.sock. On Linux/macOS, you might need sudo or your user must be in the docker group.

🛠 Tech Stack

Backend: Go (Golang)

Library: Official Docker SDK (github.com/docker/docker/client)

Frontend: React, Chart.js (for memory trend visualization)

Build Tool: Vite

Containerization: Docker, Alpine Linux, Multi-stage builds


📡 API Endpoints

GET /: Serves the dashboard.

GET /api/stats: Returns a JSON array of currently running containers with real-time metrics.

⚠️ Troubleshooting

"Error response from daemon: Bad response from Docker engine"
Ensure your Docker Desktop or Docker Daemon is running.

"permission denied while trying to connect to the Docker daemon socket"
If running locally on Linux, you may need to run with sudo or ensure your user has permissions to access /var/run/docker.sock. When running via Docker Compose, the socket mapping handles this automatically.