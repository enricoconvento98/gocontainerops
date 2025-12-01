package docker

import (
	"context"
	"io"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container" // ⬅️ NEW IMPORT
	"github.com/docker/docker/client"
)

// Client is a wrapper around the Docker client
type Client struct {
	cli *client.Client
}

// NewClient creates a new Docker client wrapper
func NewClient() (*Client, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}
	return &Client{cli: cli}, nil
}

// ListContainers lists all containers based on options
func (c *Client) ListContainers(ctx context.Context, options types.ContainerListOptions) ([]types.Container, error) {
	return c.cli.ContainerList(ctx, options)
}

// ContainerStats returns a one-time snapshot of container stats
func (c *Client) ContainerStats(ctx context.Context, containerID string) (io.ReadCloser, error) {
    // Note: The third argument 'false' ensures it's a one-time snapshot, not a stream.
    statsJSON, err := c.cli.ContainerStats(ctx, containerID, false) 
    if err != nil {
        return nil, err
    }
    // Correctly returning the Body (which is the io.ReadCloser)
    return statsJSON.Body, nil 
}

// ContainerLogs returns a reader for container logs
func (c *Client) ContainerLogs(ctx context.Context, containerID string, options types.ContainerLogsOptions) (io.ReadCloser, error) {
	return c.cli.ContainerLogs(ctx, containerID, options)
}

// ContainerTop returns the processes running inside a container
func (c *Client) ContainerTop(ctx context.Context, containerID string, arguments []string) (container.ContainerTopOKBody, error) { // ⬅️ UPDATED TYPE
	return c.cli.ContainerTop(ctx, containerID, arguments)
}

// ContainerInspect returns the detailed information of a container
func (c *Client) ContainerInspect(ctx context.Context, containerID string) (types.ContainerJSON, error) {
	return c.cli.ContainerInspect(ctx, containerID)
}