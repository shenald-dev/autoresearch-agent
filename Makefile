.PHONY: help install test lint docker-build docker-run clean

help:
	@echo "AutoResearch Agent — AI autonomous research system"
	@echo ""
	@echo "Usage:"
	@echo "  make install       Install dependencies"
	@echo "  make test          Run unit and integration tests"
	@echo "  make lint          Lint code (eslint)"
	@echo "  make docker-build  Build Docker image"
	@echo "  make docker-run    Run with docker-compose"
	@echo "  make clean         Remove outputs and node_modules"
	@echo ""
	@echo "Examples:"
	@echo "  node bin/cli.js 'AI trends 2024'"
	@echo "  docker-compose run --rm agent 'quantum computing breakthroughs'"

install:
	npm install

test:
	npm test

lint:
	npm run lint

docker-build:
	docker build -t autoresearch-agent:0.1.0 .

docker-run:
	docker-compose run --rm agent

clean:
	rm -rf outputs/node_modules
	rm -rf outputs/markdown outputs/json
