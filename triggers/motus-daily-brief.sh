#!/bin/bash

# Motus Daily Brief Trigger
# Execute Claude /motus daily-brief command from external applications
# Usage: sh /Users/ianwinscom/motus/triggers/motus-daily-brief.sh

cd /Users/ianwinscom/motus
/Users/ianwinscom/.npm-global/bin/claude /motus daily-brief --print --dangerously-skip-permissions