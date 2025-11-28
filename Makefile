.PHONY: help dev build up down logs clean test lint migrate seed install

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
NC     := \033[0m

help: ## Show this help message
	@echo "$(GREEN)Venus Platform - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ==================================================
# Development
# ==================================================

install: ## Install all dependencies
	@echo "$(GREEN)Installing dependencies...$(NC)"
	pnpm install

dev: ## Start development environment with hot-reload
	@echo "$(GREEN)Starting development environment...$(NC)"
	docker compose -f config/docker/docker-compose.yml -f config/docker/docker-compose.dev.yml up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "API Gateway: http://localhost:4000"
	@echo "PostgreSQL: localhost:5432"
	@echo "Redis: localhost:6379"

dev-tools: ## Start development tools (pgAdmin, Redis Commander, Mailhog)
	@echo "$(GREEN)Starting development tools...$(NC)"
	docker compose -f config/docker/docker-compose.yml -f config/docker/docker-compose.dev.yml --profile dev-tools up -d
	@echo "$(GREEN)Dev tools started!$(NC)"
	@echo "pgAdmin: http://localhost:5050 (admin@venus.local / admin)"
	@echo "Redis Commander: http://localhost:8081"
	@echo "Mailhog: http://localhost:8025"

# ==================================================
# Docker Operations
# ==================================================

build: ## Build all Docker images
	@echo "$(GREEN)Building Docker images...$(NC)"
	docker compose -f config/docker/docker-compose.yml build

up: ## Start all services (production mode)
	@echo "$(GREEN)Starting all services...$(NC)"
	docker compose -f config/docker/docker-compose.yml up -d

down: ## Stop all services
	@echo "$(GREEN)Stopping all services...$(NC)"
	docker compose -f config/docker/docker-compose.yml down

restart: down up ## Restart all services

logs: ## Show logs from all services (follow mode)
	docker compose -f config/docker/docker-compose.yml logs -f

logs-service: ## Show logs from specific service (usage: make logs-service SERVICE=frontend)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(YELLOW)Usage: make logs-service SERVICE=<service-name>$(NC)"; \
		echo "Available services: frontend, api-gateway, auth-service, project-service, persona-service, media-service, ai-cv-service"; \
		exit 1; \
	fi
	docker compose -f config/docker/docker-compose.yml logs -f $(SERVICE)

ps: ## Show running containers
	docker compose -f config/docker/docker-compose.yml ps

# ==================================================
# Database
# ==================================================

migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(NC)"
	pnpm --filter @venus/project-service migrate

migrate-dev: ## Run database migrations in dev mode
	@echo "$(GREEN)Running database migrations (dev mode)...$(NC)"
	pnpm --filter @venus/project-service migrate:dev

migrate-reset: ## Reset database (WARNING: destroys all data)
	@echo "$(YELLOW)WARNING: This will destroy all database data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		pnpm --filter @venus/project-service migrate:reset; \
	fi

seed: ## Seed database with test data
	@echo "$(GREEN)Seeding database...$(NC)"
	pnpm --filter @venus/project-service seed

db-shell: ## Open PostgreSQL shell
	docker compose -f config/docker/docker-compose.yml exec postgres psql -U postgres -d venus_dev

redis-cli: ## Open Redis CLI
	docker compose -f config/docker/docker-compose.yml exec redis redis-cli

# ==================================================
# Testing
# ==================================================

test: ## Run all tests
	@echo "$(GREEN)Running all tests...$(NC)"
	pnpm test

test-unit: ## Run unit tests
	@echo "$(GREEN)Running unit tests...$(NC)"
	pnpm test:unit

test-integration: ## Run integration tests
	@echo "$(GREEN)Running integration tests...$(NC)"
	pnpm test:integration

test-e2e: ## Run E2E tests
	@echo "$(GREEN)Running E2E tests...$(NC)"
	pnpm test:e2e

test-coverage: ## Run tests with coverage
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	pnpm test:coverage

# ==================================================
# Code Quality
# ==================================================

lint: ## Lint all code
	@echo "$(GREEN)Linting code...$(NC)"
	pnpm lint

lint-fix: ## Lint and auto-fix issues
	@echo "$(GREEN)Linting and fixing code...$(NC)"
	pnpm lint:fix

format: ## Format all code with Prettier
	@echo "$(GREEN)Formatting code...$(NC)"
	pnpm format

format-check: ## Check code formatting
	@echo "$(GREEN)Checking code formatting...$(NC)"
	pnpm format:check

typecheck: ## Run TypeScript type checking
	@echo "$(GREEN)Type checking...$(NC)"
	pnpm typecheck

check: lint format-check typecheck test-unit ## Run all checks (lint, format, typecheck, unit tests)

# ==================================================
# Shell Access
# ==================================================

shell: ## Open shell in a service container (usage: make shell SERVICE=frontend)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(YELLOW)Usage: make shell SERVICE=<service-name>$(NC)"; \
		exit 1; \
	fi
	docker compose -f config/docker/docker-compose.yml exec $(SERVICE) sh

# ==================================================
# Cleanup
# ==================================================

clean: ## Remove all containers, volumes, and build artifacts
	@echo "$(YELLOW)Cleaning up...$(NC)"
	docker compose -f config/docker/docker-compose.yml down -v
	rm -rf node_modules
	rm -rf frontend/node_modules
	rm -rf services/*/node_modules
	rm -rf frontend/.next
	rm -rf services/*/dist
	rm -rf tmp/
	@echo "$(GREEN)Cleanup complete!$(NC)"

clean-docker: ## Remove all Docker containers, volumes, and images
	@echo "$(YELLOW)Removing all Docker resources...$(NC)"
	docker compose -f config/docker/docker-compose.yml down -v --rmi all
	@echo "$(GREEN)Docker cleanup complete!$(NC)"

prune: ## Prune Docker system (remove unused data)
	@echo "$(YELLOW)Pruning Docker system...$(NC)"
	docker system prune -af --volumes
	@echo "$(GREEN)Docker prune complete!$(NC)"

# ==================================================
# Utilities
# ==================================================

health: ## Check health of all services
	@echo "$(GREEN)Checking service health...$(NC)"
	@curl -sf http://localhost:3000/api/health && echo "✓ Frontend" || echo "✗ Frontend"
	@curl -sf http://localhost:4000/health && echo "✓ API Gateway" || echo "✗ API Gateway"

version: ## Show project version
	@node -pe "require('./package.json').version"

update-deps: ## Update all dependencies
	@echo "$(GREEN)Updating dependencies...$(NC)"
	pnpm update --recursive --latest

# ==================================================
# Git & Release
# ==================================================

git-status: ## Show git status (check before commit)
	@echo "$(GREEN)Git Status:$(NC)"
	@git status
	@echo ""
	@echo "$(GREEN)Staged changes:$(NC)"
	@git diff --cached --stat

commit: ## Interactive commit with conventional commit format
	@echo "$(GREEN)Committing changes...$(NC)"
	@git add -p
	@echo "$(YELLOW)Commit types: feat, fix, docs, style, refactor, test, chore$(NC)"
	@read -p "Type: " type; \
	read -p "Scope: " scope; \
	read -p "Subject: " subject; \
	git commit -m "$$type($$scope): $$subject"

# ==================================================
# Documentation
# ==================================================

docs: ## Open documentation in browser
	@echo "$(GREEN)Opening documentation...$(NC)"
	@open docs/README.md || xdg-open docs/README.md || start docs/README.md

# ==================================================
# Platform-specific commands
# ==================================================

# Windows-specific (no Docker available locally)
dev-win: ## Start development on Windows (native Node.js)
	@echo "$(GREEN)Starting development on Windows (native)...$(NC)"
	@echo "Starting services..."
	@start cmd /k "cd frontend && pnpm dev"
	@start cmd /k "cd services/api-gateway && pnpm dev"
	@echo "$(GREEN)Services started in separate windows$(NC)"

# ==================================================
# CI/CD Simulation
# ==================================================

ci: clean install lint typecheck test-unit build ## Simulate CI pipeline locally
	@echo "$(GREEN)CI pipeline completed successfully!$(NC)"

pre-commit: lint-fix format typecheck ## Run pre-commit checks
	@echo "$(GREEN)Pre-commit checks passed!$(NC)"