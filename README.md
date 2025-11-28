# Docker Live Monitor

![Docker Live Monitor Screenshot](https://i.imgur.com/9A7f4iL.png)

A lightweight, real-time Docker container monitoring dashboard written in Go and React. It connects to the local Docker socket to display CPU usage, memory consumption, network I/O, and block I/O for all active containers.

## ✨ Features

- **Real-time Monitoring**: View live metrics for all your running Docker containers.
- **Detailed Stats**: Get detailed information on CPU, memory, network I/O, and block I/O.
- **Historical Data**: See the last 120 seconds of CPU, memory, and network I/O history for each container.
- **Interactive UI**: A modern and responsive user interface built with React and Chart.js.
- **Easy to Use**: Get up and running with a single command.

## 📂 Folder Structure

```
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
```

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Go](https://golang.org/doc/install) (1.21+) (Only if you want to build/run locally without Docker)

### Option 1: Run with Docker Compose (Recommended)

This is the easiest way to run the application, as it isolates the environment and handles dependencies automatically.

1.  **Start the application:**

    ```bash
    make up
    # OR
    docker-compose up --build -d
    ```

2.  **Open your browser:**

    Navigate to [http://localhost:8080](http://localhost:8080).

3.  **Stop the application:**

    ```bash
    make down
    # OR
    docker-compose down
    ```

### Option 2: Run Locally (for Development)

If you have Go installed and want to run the binary directly on your host:

1.  **Install dependencies:**

    ```bash
    go mod tidy
    ```

2.  **Run the application:**

    ```bash
    go run main.go
    # OR
    make run
    ```

    **Note:** The application requires access to `/var/run/docker.sock`. On Linux/macOS, you might need `sudo` or your user must be in the `docker` group.

## 🛠 Tech Stack

- **Backend**: [Go](https://golang.org/)
- **Frontend**: [React](https://reactjs.org/), [Chart.js](https://www.chartjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Containerization**: [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/)

## 📡 API Endpoints

- `GET /`: Serves the dashboard.
- `GET /api/stats`: Returns a JSON array of currently running containers with real-time metrics.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https.github.com/enricoconvento98/gocontainerops/issues).

## 📝 License

This project is [MIT licensed](https://github.com/enricoconvento98/gocontainerops/blob/main/LICENSE).
