#!/bin/bash

# AI Summarizer Project Startup Script

echo "Starting AI Summarizer Project..."
echo "==================================="

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."

# Check Python
if ! command_exists python3; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Check MongoDB
echo "Checking MongoDB connection..."
if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${YELLOW}Warning: MongoDB doesn't appear to be running.${NC}"
    echo "Please make sure MongoDB is installed and running on port 27017"
    echo "You can start MongoDB with: brew services start mongodb/brew/mongodb-community"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check FFmpeg
if ! command_exists ffmpeg; then
    echo -e "${YELLOW}Warning: FFmpeg is not installed. Video processing may not work.${NC}"
    echo "Install with: brew install ffmpeg"
fi

# Check and create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating backend/.env file...${NC}"
    cat > backend/.env << EOF
JWT_SECRET=your-secret-key-change-this-in-production
MONGODB_URI=mongodb://localhost:27017/summarizer_db
EOF
    echo -e "${YELLOW}Please update the JWT_SECRET in backend/.env for production use${NC}"
fi

# Install Python dependencies
echo "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install Python dependencies${NC}"
        exit 1
    fi
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install Node.js dependencies${NC}"
        exit 1
    fi
fi
cd ..

# Start Flask backend in background
echo -e "${GREEN}Starting Flask backend server on port 5002...${NC}"
cd backend
python3 app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
echo "Waiting for backend to initialize..."
sleep 5

# Check if backend started successfully
if ! curl -s http://localhost:5002 > /dev/null; then
    echo -e "${YELLOW}Backend may still be starting up...${NC}"
fi

# Start React frontend
echo -e "${GREEN}Starting React frontend server on port 3000...${NC}"
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}✅ Servers started successfully!${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}Backend API: http://localhost:5002${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}Stopping servers...${NC}"
    
    # Stop backend
    if kill $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}Backend server stopped${NC}"
    fi
    
    # Stop frontend
    if kill $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}Frontend server stopped${NC}"
    fi
    
    # Kill any remaining processes on the ports
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    lsof -ti:5002 | xargs kill -9 2>/dev/null
    
    echo -e "${GREEN}All servers stopped successfully${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for user to stop
wait