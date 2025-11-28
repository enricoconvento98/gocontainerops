.PHONY: build run up down

# Docker Compose commands
up:
	docker compose up --build -d
	@echo "Monitor running at http://localhost:8080"

down:
	docker compose down

logs:
	docker compose logs -f