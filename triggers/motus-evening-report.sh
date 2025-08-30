#!/bin/bash

# Motus Evening Report Trigger
# Execute Claude /motus evening-report command from external applications
# Usage: sh /Users/ianwinscom/slashmotus/triggers/motus-evening-report.sh

cd /Users/ianwinscom/slashmotus
/Users/ianwinscom/.npm-global/bin/claude /motus evening-report --print --dangerously-skip-permissions