# Backend Go Module Tests

This directory is intended to house integration and unit tests for the modularized Go backend.
For better organization and adherence to Go testing conventions, it is recommended to place unit tests alongside the code they test (e.g., `internal/docker/client_test.go`). However, this `README.md` serves as a guide for the types of tests that should be implemented.

## `internal/docker` Package Tests

This package encapsulates interactions with the Docker API. Tests for this package should focus on ensuring correct communication with the Docker daemon and proper handling of Docker API responses. Mocking the Docker client might be necessary for true unit tests, or using a test Docker daemon for integration tests.

### `client.go`
*   **`TestNewClient`**:
    *   Verify that `NewClient` successfully creates a Docker client.
    *   Test error handling if Docker client initialization fails.
*   **`TestClient_ListContainers`**:
    *   Verify that `ListContainers` correctly calls the Docker API and returns a list of containers.
    *   Test with various `types.ContainerListOptions` (e.g., `All: true`, filters).
    *   Test error handling if the Docker API call fails.
*   **`TestClient_ContainerStats`**:
    *   Verify that `ContainerStats` correctly calls the Docker API and returns an `io.ReadCloser`.
    *   Test error handling.
*   **`TestClient_ContainerLogs`**:
    *   Verify that `ContainerLogs` correctly calls the Docker API and returns an `io.ReadCloser`.
    *   Test with various `types.ContainerLogsOptions` (e.g., `Tail`, `Follow`).
    *   Test error handling.
*   **`TestClient_ContainerTop`**:
    *   Verify that `ContainerTop` correctly calls the Docker API and returns container processes.
    *   Test error handling.

## `internal/container` Package Tests

This package defines the `ContainerData` model and the `ProcessStats` logic. Tests here should ensure that raw Docker stats are correctly transformed into the `ContainerData` format.

### `model.go`
*   No specific tests needed for a pure data structure, but ensure `json` tags are correct if marshaling/unmarshaling is used elsewhere.

### `processor.go`
*   **`TestProcessStats`**:
    *   Provide mock `types.Container` and `types.StatsJSON` data.
    *   Verify that `ProcessStats` correctly calculates `CPUPercent`, `MemUsage`, `MemLimit`, `MemPercent`, `NetInput`, `NetOutput`, `BlockInput`, `BlockOutput`.
    *   Verify that `ID`, `Name`, `Image`, `State`, `Status`, `Created` are correctly extracted.
    *   Test edge cases (e.g., zero CPU usage, zero memory limit, empty container names).

## `internal/handler` Package Tests

This package contains the HTTP handlers. Tests for this package should focus on ensuring that the handlers correctly parse requests, interact with the `DockerService`, and write appropriate HTTP responses. Mocking the `DockerService` interface will be crucial here.

### `handler.go`
*   **`TestHandler_HandleStats`**:
    *   Test with no query parameters (should return all containers).
    *   Test with `search` query parameter.
    *   Test with `image` query parameter.
    *   Test with `status` query parameter.
    *   Test with a combination of query parameters.
    *   Test error handling from `DockerService.ListContainers` and `DockerService.ContainerStats`.
    *   Verify the structure and content of the JSON response.
*   **`TestHandler_HandleLogs`**:
    *   Test fetching logs without `follow=true`.
    *   Test fetching logs with `follow=true` (requires mocking a streaming response).
    *   Test error handling from `DockerService.ContainerLogs`.
    *   Verify the content type and log output.
*   **`TestHandler_HandleProcesses`**:
    *   Test fetching processes for a container.
    *   Test error handling from `DockerService.ContainerTop`.
    *   Verify the structure and content of the JSON response.

---

**Note:** When writing tests, consider using Go's `httptest` package for HTTP handlers and creating mock implementations of the `docker.DockerService` interface to isolate handler logic from actual Docker API calls.
