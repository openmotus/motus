#!/bin/bash

# Motus Daily Brief Trigger
# Execute Claude /motus daily-brief command from external applications
# Usage: sh /Users/ianwinscom/slashmotus/triggers/motus-daily-brief.sh

cd /Users/ianwinscom/slashmotus
/Users/ianwinscom/.npm-global/bin/claude /motus daily-brief --print --dangerously-skip-permissions