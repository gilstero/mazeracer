#!/bin/bash

echo "Stopping Maze Racer local servers..."

PORTS="5001 8000 8001 8002 8003 8004 8005 8006 8007 8008 8009 8010"
PIDS=""

for PORT in $PORTS; do
    PORT_PIDS=$(lsof -ti tcp:"$PORT" 2>/dev/null)
    if [ -n "$PORT_PIDS" ]; then
        PIDS="$PIDS $PORT_PIDS"
    fi
done

if [ -z "$PIDS" ]; then
    echo "No Maze Racer local servers found."
    exit 0
fi

echo "$PIDS" | xargs kill 2>/dev/null
sleep 1

for PID in $PIDS; do
    if kill -0 "$PID" 2>/dev/null; then
        kill -9 "$PID" 2>/dev/null
    fi
done

echo "Stopped local servers."
