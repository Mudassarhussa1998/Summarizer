#!/bin/bash

# Docker startup script for Summarizer application

echo "Starting Summarizer application with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit https://docs.docker.com/compose/install/ for installation instructions."
    exit 1
fi

# Build and start the containers
echo "Building and starting containers..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo "\nSummarizer application is now running!"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:5002"
    echo "\nTo stop the application, run: docker-compose down"
    echo "For more information, see DOCKER_README.md"
else
    echo "\nError starting the application. Please check the logs with: docker-compose logs"
fi