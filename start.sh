#!/bin/bash

# Summarizer Project Startup Script

echo "Starting Summarizer Project..."
echo "=============================="

# Check if MongoDB is running
echo "Checking MongoDB connection..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "Warning: MongoDB doesn't appear to be running."
    echo "Please make sure MongoDB is installed and running on port 27017"
    echo "You can start MongoDB with: brew services start mongodb/brew/mongodb-community"
fi

# Start Flask backend in background
echo "Starting Flask backend server on port 5001..."
cd backend
python app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start React frontend
echo "Starting React frontend server on port 3000..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servers started successfully!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup background processes
cleanup() {
    echo "\nStopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for user to stop
wait