#!/bin/bash

# Motus Command Handler for Claude Code
# This script routes /motus commands to the appropriate handlers

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js to use Motus."
    exit 1
fi

# Execute the main Motus command handler
node "$SCRIPT_DIR/motus-command.js" "$@"