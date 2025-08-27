#!/bin/bash

# Start OAuth Manager for Motus
# This launches the web interface for managing OAuth connections

echo "🔐 Starting OAuth Manager..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Kill any existing process on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Start the server
node oauth-manager/server.js

# If server crashes, show error
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ OAuth Manager failed to start"
    echo "Check that port 3001 is available"
    exit 1
fi