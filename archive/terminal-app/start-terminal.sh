#!/bin/bash

# Motus Terminal Launcher
# Starts the localhost terminal interface

echo "═══════════════════════════════════════════════════"
echo "🚀 Starting Motus Terminal Server"
echo "═══════════════════════════════════════════════════"
echo ""

# Check if port 3000 is already in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is already in use."
    echo "   Attempting to stop existing process..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Start the server
node terminal-app/server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Open in browser
echo ""
echo "📱 Opening Motus Terminal in your browser..."
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:3000
else
    echo "Please open http://localhost:3000 in your browser"
fi

echo "═══════════════════════════════════════════════════"
echo "✅ Motus Terminal is running at http://localhost:3000"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Wait for the server process
wait $SERVER_PID