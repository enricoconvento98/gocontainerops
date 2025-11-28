# Frontend Build Stage
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY frontend/ ./

# Build the React app
RUN npm run build

# Backend Build Stage
FROM golang:1.23-alpine AS backend-builder

WORKDIR /app

# Install git for fetching dependencies
RUN apk add --no-cache git

# Copy all Go files
COPY go.mod main.go ./

# Tidy and download dependencies
RUN go mod tidy

# Build the binary
RUN go build -o monitor .



# Runtime Stage
FROM alpine:latest

WORKDIR /root/

# Copy the Go binary
COPY --from=backend-builder /app/monitor .

# Copy the built React app to static folder
COPY --from=frontend-builder /app/frontend/dist ./static

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./monitor"]