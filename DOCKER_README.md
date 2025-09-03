# Running Summarizer with Docker

This guide explains how to run the Summarizer application using Docker, making it easy to set up and run on any system without worrying about dependencies.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) installed on your system

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Summarizer
   ```

2. Configure environment variables (optional):
   - Backend environment variables are set in the `docker-compose.yml` file
   - You may want to update the following in the `docker-compose.yml` file:
     - `SECRET_KEY` and `JWT_SECRET`: Set to secure random strings
     - Email configuration: Update `SMTP_USERNAME` and `SMTP_PASSWORD` for OTP functionality

3. Build and start the containers:
   ```bash
   # Option 1: Using docker-compose directly
   docker-compose up -d
   
   # Option 2: Using the helper script
   ./docker-start.sh
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5002
   
   Note: Inside the Docker network, the services communicate with each other using their service names (e.g., the frontend connects to the backend using `http://backend:5002`), but you'll access them from your host machine using localhost.

## Services

The application consists of three main services:

1. **MongoDB** - Database service
   - Port: 27017
   - Data is persisted in a Docker volume

2. **Backend** - Flask API service
   - Port: 5002
   - Handles authentication, video processing, and data analysis

3. **Frontend** - React application
   - Port: 3000
   - User interface for the Summarizer application

## Stopping the Application

To stop the application:

```bash
# Option 1: Using docker-compose directly
docker-compose down

# Option 2: Using the helper script
./docker-stop.sh
```

To stop the application and remove all data (including the database):

```bash
docker-compose down -v
```

## Troubleshooting

### Viewing Logs

To view logs for a specific service:

```bash
docker-compose logs -f <service-name>
```

Where `<service-name>` can be `frontend`, `backend`, or `mongodb`.

### Container Shell Access

To access a shell in a running container:

```bash
docker-compose exec <service-name> sh
```

### Port Conflicts

If you encounter port conflicts, you can modify the port mappings in the `docker-compose.yml` file.