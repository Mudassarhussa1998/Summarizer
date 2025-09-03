#!/bin/bash

# Docker stop script for Summarizer application

echo "Stopping Summarizer application..."

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

# Stop the containers
echo "Stopping containers..."
docker-compose down

if [ $? -eq 0 ]; then
    echo "\nSummarizer application has been stopped."
    echo "To remove all data including the database, run: docker-compose down -v"
    echo "To start the application again, run: ./docker-start.sh"
else
    echo "\nError stopping the application. Please check the logs with: docker-compose logs"
fi