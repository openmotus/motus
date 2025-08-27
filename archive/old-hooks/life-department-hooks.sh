#!/bin/bash

# Life Department Automated Hooks
# These can be added to your crontab or Claude Code hooks

# Daily Workflows
# ================

# Morning Brief - 8:00 AM
# Add to crontab: 0 8 * * * /Users/ianwinscom/slashmotus/hooks/life-department-hooks.sh morning
morning() {
  cd /Users/ianwinscom/slashmotus
  ./motus daily-brief
}

# Midday Check-in - 12:00 PM
# Add to crontab: 0 12 * * * /Users/ianwinscom/slashmotus/hooks/life-department-hooks.sh midday
midday() {
  cd /Users/ianwinscom/slashmotus
  ./motus life midday
}

# Evening Review - 9:00 PM
# Add to crontab: 0 21 * * * /Users/ianwinscom/slashmotus/hooks/life-department-hooks.sh evening
evening() {
  cd /Users/ianwinscom/slashmotus
  ./motus life evening
}

# Weekly Workflows
# ================

# Weekly Planning - Sunday 10:00 AM
# Add to crontab: 0 10 * * 0 /Users/ianwinscom/slashmotus/hooks/life-department-hooks.sh weekly-plan
weekly-plan() {
  cd /Users/ianwinscom/slashmotus
  ./motus life weekly-plan
}

# Weekly Review - Friday 5:00 PM
# Add to crontab: 0 17 * * 5 /Users/ianwinscom/slashmotus/hooks/life-department-hooks.sh weekly-review
weekly-review() {
  cd /Users/ianwinscom/slashmotus
  ./motus life weekly-review
}

# Monthly Workflows
# ================

# Monthly Planning - 1st of month, 10:00 AM
# Add to crontab: 0 10 1 * * /Users/ianwinscom/slashmotus/hooks/life-department-hooks.sh monthly-plan
monthly-plan() {
  cd /Users/ianwinscom/slashmotus
  ./motus life monthly-plan
}

# Finance Review - Last day of month, 7:00 PM
# Add to crontab: 0 19 28-31 * * [ "$(date +\%d -d tomorrow)" = "01" ] && /Users/ianwinscom/slashmotus/hooks/life-department-hooks.sh finance-review
finance-review() {
  cd /Users/ianwinscom/slashmotus
  ./motus life finance-review
}

# Execute the requested function
$1