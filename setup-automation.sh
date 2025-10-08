#!/bin/bash

# Setup Automation for Motus Daily Brief and Evening Report
# This script sets up automatic execution at 6am and 9pm

echo "🤖 Motus Automation Setup"
echo "========================="

# Create logs directory if it doesn't exist
mkdir -p /Users/ianwinscom/motus/logs

# Function to setup LaunchAgents
setup_launchagents() {
    echo "Setting up LaunchAgents for macOS..."
    
    # Copy plist files to LaunchAgents directory
    cp /Users/ianwinscom/motus/com.motus.dailybrief.plist ~/Library/LaunchAgents/
    cp /Users/ianwinscom/motus/com.motus.eveningreport.plist ~/Library/LaunchAgents/
    
    # Load the agents
    launchctl load ~/Library/LaunchAgents/com.motus.dailybrief.plist
    launchctl load ~/Library/LaunchAgents/com.motus.eveningreport.plist
    
    echo "✅ LaunchAgents installed and loaded"
    echo ""
    echo "Scheduled tasks:"
    echo "  • Daily Brief: Every day at 6:00 AM"
    echo "  • Evening Report: Every day at 9:00 PM"
}

# Function to setup crontab
setup_crontab() {
    echo "Setting up crontab entries..."
    
    # Create temporary cron file
    crontab -l > /tmp/motus_cron 2>/dev/null || true
    
    # Remove any existing motus entries
    sed -i '' '/motus daily-brief/d' /tmp/motus_cron
    sed -i '' '/motus evening-report/d' /tmp/motus_cron
    
    # Add new entries
    echo "# Motus Daily Brief at 6:00 AM" >> /tmp/motus_cron
    echo "0 6 * * * cd /Users/ianwinscom/motus && /usr/local/bin/claude-code run '/motus daily-brief' >> /Users/ianwinscom/motus/logs/daily-brief.log 2>&1" >> /tmp/motus_cron
    echo "" >> /tmp/motus_cron
    echo "# Motus Evening Report at 9:00 PM" >> /tmp/motus_cron
    echo "0 21 * * * cd /Users/ianwinscom/motus && /usr/local/bin/claude-code run '/motus evening-report' >> /Users/ianwinscom/motus/logs/evening-report.log 2>&1" >> /tmp/motus_cron
    
    # Install new crontab
    crontab /tmp/motus_cron
    rm /tmp/motus_cron
    
    echo "✅ Crontab entries installed"
}

# Check which method to use
echo "Choose automation method:"
echo "1) LaunchAgents (Recommended for macOS)"
echo "2) Crontab (Traditional Unix scheduling)"
echo "3) Both (Maximum reliability)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        setup_launchagents
        ;;
    2)
        setup_crontab
        ;;
    3)
        setup_launchagents
        setup_crontab
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Automation setup complete!"
echo ""
echo "To verify setup:"
echo "  • LaunchAgents: launchctl list | grep motus"
echo "  • Crontab: crontab -l"
echo ""
echo "To manually trigger:"
echo "  • Daily Brief: claude-code run '/motus daily-brief'"
echo "  • Evening Report: claude-code run '/motus evening-report'"
echo ""
echo "Logs are stored in: /Users/ianwinscom/motus/logs/"