// File: go/internal/docker/service.go

package docker

import (
	"context"
	"io"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container" // This is needed for ContainerTop return type
)

// DockerService defines the set of Docker client methods required by the application handlers.
type DockerService interface {
    // ListContainers is used in HandleStats
	ListContainers(ctx context.Context, options types.ContainerListOptions) ([]types.Container, error)

    // ContainerStats is used in HandleStats
	ContainerStats(ctx context.Context, containerID string) (io.ReadCloser, error)

    // ContainerLogs is used in HandleLogs
	ContainerLogs(ctx context.Context, containerID string, options types.ContainerLogsOptions) (io.ReadCloser, error)

    // ContainerTop is used in HandleProcesses
	ContainerTop(ctx context.Context, containerID string, arguments []string) (container.ContainerTopOKBody, error)
}