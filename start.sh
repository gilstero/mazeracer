#!/bin/bash

# Maze Racer - Quick Start Script
# This script starts both the backend and frontend servers

echo "Maze Racer - Starting servers..."
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies"
    exit 1
fi

# Start backend in background
echo "Starting backend server on http://localhost:5001..."
python run.py &
BACKEND_PID=$!

# Give backend time to start
sleep 2

# Start frontend
cd ../frontend
FRONTEND_PORT=8000
while ! python3 -c "import socket; s=socket.socket(); raise SystemExit(0 if s.connect_ex(('127.0.0.1', $FRONTEND_PORT)) else 1)"; do
    FRONTEND_PORT=$((FRONTEND_PORT + 1))
done

echo "Starting frontend server on http://localhost:$FRONTEND_PORT..."
echo ""
echo "Both servers are running."
echo "   Backend:  http://localhost:5001"
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "Press Ctrl+C to stop both servers..."

python -m http.server "$FRONTEND_PORT"

# Clean up backend process on exit
kill $BACKEND_PID 2>/dev/null
