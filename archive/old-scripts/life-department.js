#!/usr/bin/env node

/**
 * Life Department - Personal Life Management System
 * 
 * Manages daily routines, health, finance, goals, and personal development
 * through AI agents using Claude Code's Task tool for sub-agent orchestration
 */

const fs = require('fs').promises;
const path = require('path');

class LifeDepartment {
  constructor(config = {}) {
    this.config = {
      morningBriefingTime: '08:00',
      eveningReviewTime: '21:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...config
    };
    
    this.dataPath = path.join(process.env.HOME, '.motus-claude', 'data', 'life');
    this.agents = this.initializeAgents();
  }

  initializeAgents() {
    return {
      'daily-planner': {
        name: 'Daily Planner',
        type: 'organizational',
        capabilities: ['schedule optimization', 'task prioritization', 'time blocking'],
        prompts: {
          'review-calendar': `Review today's calendar and identify:
            1. All scheduled appointments with times
            2. Important deadlines
            3. Available time blocks for deep work
            4. Potential scheduling conflicts
            5. Suggested optimizations`,
          'tomorrow-prep': `Prepare for tomorrow by:
            1. Reviewing tomorrow's schedule
            2. Identifying preparation needed tonight
            3. Setting up time blocks for important tasks
            4. Flagging any concerns or conflicts`,
          'week-ahead': `Plan the week ahead:
            1. Review all appointments and commitments
            2. Identify key priorities for the week
            3. Block time for important projects
            4. Schedule breaks and personal time
            5. Flag any resource needs`
        }
      },
      
      'health-tracker': {
        name: 'Health Tracker',
        type: 'analytical',
        capabilities: ['fitness tracking', 'nutrition monitoring', 'sleep analysis'],
        prompts: {
          'health-check': `Provide health status check:
            1. Review recent fitness activity
            2. Check hydration and nutrition goals
            3. Analyze sleep patterns
            4. Suggest adjustments for today
            5. Motivational message`,
          'daily-summary': `Summarize today's health metrics:
            1. Exercise completed vs planned
            2. Nutrition goals achievement
            3. Hydration status
            4. Energy levels throughout day
            5. Recommendations for tomorrow`,
          'fitness-plan': `Create weekly fitness plan:
            1. Balance cardio, strength, flexibility
            2. Account for schedule constraints
            3. Progressive difficulty
            4. Rest day placement
            5. Nutrition recommendations`
        }
      },
      
      'finance-manager': {
        name: 'Finance Manager',
        type: 'analytical',
        capabilities: ['budget tracking', 'bill reminders', 'investment monitoring'],
        prompts: {
          'budget-status': `Current financial status:
            1. Budget utilization this month
            2. Upcoming bills and due dates
            3. Unusual spending patterns
            4. Savings progress
            5. Action items for today`,
          'weekly-budget': `Weekly financial review:
            1. Week's spending vs budget
            2. Category breakdown
            3. Upcoming week's expected expenses
            4. Savings opportunities
            5. Investment performance`,
          'monthly-review': `Monthly financial analysis:
            1. Total income vs expenses
            2. Budget variance by category
            3. Savings rate achievement
            4. Investment performance
            5. Next month's budget adjustments`
        }
      },
      
      'personal-assistant': {
        name: 'Personal Assistant',
        type: 'operational',
        capabilities: ['email drafts', 'appointment scheduling', 'reminders'],
        prompts: {
          'daily-reminders': `Important reminders for today:
            1. Appointments and preparation needed
            2. Deadlines approaching
            3. Follow-ups required
            4. Personal commitments
            5. Special occasions`,
          'email-draft': `Draft email based on context:
            1. Professional tone
            2. Clear action items
            3. Appropriate formatting
            4. Subject line suggestion
            5. Follow-up timing`,
          'schedule-optimization': `Optimize schedule:
            1. Identify time wasters
            2. Batch similar tasks
            3. Protect deep work time
            4. Balance work and personal
            5. Energy management`
        }
      },
      
      'goal-tracker': {
        name: 'Goal Tracker',
        type: 'strategic',
        capabilities: ['progress monitoring', 'milestone tracking', 'motivation'],
        prompts: {
          'daily-priorities': `Today's priorities aligned with goals:
            1. Top 3 must-do tasks
            2. Connection to larger goals
            3. Success metrics
            4. Potential obstacles
            5. Motivation boost`,
          'daily-accomplishments': `Review today's accomplishments:
            1. Goals advanced
            2. Tasks completed
            3. Lessons learned
            4. Wins to celebrate
            5. Tomorrow's focus`,
          'weekly-review': `Weekly goal progress:
            1. Progress on each active goal
            2. Milestones reached
            3. Obstacles encountered
            4. Adjustments needed
            5. Next week's targets`
        }
      },
      
      'content-curator': {
        name: 'Content Curator',
        type: 'research',
        capabilities: ['news digest', 'learning resources', 'entertainment'],
        prompts: {
          'fetch-weather': `Get weather information:
            1. Current conditions
            2. Today's forecast
            3. Notable weather events
            4. Clothing recommendations
            5. Activity suitability`,
          'news-digest': `Curate relevant news:
            1. Headlines in areas of interest
            2. Industry/career updates
            3. Local news that matters
            4. Positive/inspiring stories
            5. Action items from news`,
          'learning-resources': `Recommend learning content:
            1. Articles related to goals
            2. Skill development resources
            3. Podcast episodes
            4. Book recommendations
            5. Online courses`
        }
      }
    };
  }

  /**
   * Morning Briefing Workflow
   * Comprehensive morning routine using sub-agents
   */
  async morningBriefing() {
    console.log('\n☀️ Good Morning! Preparing your daily briefing...\n');
    
    const briefing = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      sections: []
    };

    // 1. Weather Check (would use Task tool in real implementation)
    console.log('🌤️ Checking weather...');
    const weatherPrompt = this.agents['content-curator'].prompts['fetch-weather'];
    // In real implementation:
    // const weather = await Task({
    //   subagent_type: 'general-purpose',
    //   description: 'Get weather forecast',
    //   prompt: weatherPrompt
    // });
    briefing.sections.push({
      title: 'Weather',
      content: 'Sunny, 72°F, perfect for outdoor activities'
    });

    // 2. Calendar Review
    console.log('📅 Reviewing calendar...');
    const calendarPrompt = this.agents['daily-planner'].prompts['review-calendar'];
    briefing.sections.push({
      title: 'Schedule',
      content: '3 meetings today, 2 hours of deep work blocked'
    });

    // 3. Daily Priorities
    console.log('🎯 Setting priorities...');
    const prioritiesPrompt = this.agents['goal-tracker'].prompts['daily-priorities'];
    briefing.sections.push({
      title: 'Top Priorities',
      content: '1. Complete project proposal\n2. Exercise for 30 mins\n3. Call mom'
    });

    // 4. Health Check
    console.log('💪 Health status...');
    const healthPrompt = this.agents['health-tracker'].prompts['health-check'];
    briefing.sections.push({
      title: 'Health',
      content: 'Sleep: 7.5 hrs ✓\nHydration goal: 0/8 glasses\nExercise planned: 5:30 PM'
    });

    // 5. Finance Status
    console.log('💰 Financial snapshot...');
    const financePrompt = this.agents['finance-manager'].prompts['budget-status'];
    briefing.sections.push({
      title: 'Finance',
      content: 'Budget on track\nBill due: Internet ($50) on 15th\nSavings goal: 73% complete'
    });

    // 6. News Digest
    console.log('📰 Curating news...');
    const newsPrompt = this.agents['content-curator'].prompts['news-digest'];
    briefing.sections.push({
      title: 'News Highlights',
      content: '• Tech: AI advancement in healthcare\n• Local: New park opening downtown\n• Inspiration: Community hero saves local library'
    });

    // Display briefing
    this.displayBriefing(briefing);
    
    // Save briefing
    await this.saveBriefing(briefing);
    
    return briefing;
  }

  /**
   * Evening Review Workflow
   */
  async eveningReview() {
    console.log('\n🌙 Good Evening! Let\'s review your day...\n');
    
    const review = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      sections: []
    };

    // 1. Daily Accomplishments
    console.log('✅ Reviewing accomplishments...');
    const accomplishmentsPrompt = this.agents['goal-tracker'].prompts['daily-accomplishments'];
    review.sections.push({
      title: 'Accomplishments',
      content: 'Completed 7/8 planned tasks\nExercised for 45 minutes\nMade progress on 3 goals'
    });

    // 2. Tomorrow Prep
    console.log('📋 Preparing for tomorrow...');
    const tomorrowPrompt = this.agents['daily-planner'].prompts['tomorrow-prep'];
    review.sections.push({
      title: 'Tomorrow\'s Setup',
      content: 'Early meeting at 9 AM\nPrepare presentation tonight\nPack gym bag'
    });

    // 3. Health Summary
    console.log('💚 Health summary...');
    const healthSummaryPrompt = this.agents['health-tracker'].prompts['daily-summary'];
    review.sections.push({
      title: 'Health Today',
      content: 'Steps: 8,234 ✓\nWater: 7/8 glasses\nNutrition: Good balance\nEnergy: High in AM, dip at 3 PM'
    });

    this.displayReview(review);
    await this.saveReview(review);
    
    return review;
  }

  /**
   * Weekly Planning Session
   */
  async weeklyPlanning() {
    console.log('\n📅 Weekly Planning Session\n');
    
    const plan = {
      week: this.getWeekNumber(),
      sections: []
    };

    // 1. Goal Review
    console.log('🎯 Reviewing weekly goals...');
    const goalReviewPrompt = this.agents['goal-tracker'].prompts['weekly-review'];
    plan.sections.push({
      title: 'Goal Progress',
      content: 'Health goal: 80% complete\nLearning goal: 60% complete\nProject goal: 95% complete'
    });

    // 2. Week Ahead Planning
    console.log('📆 Planning week ahead...');
    const weekPlanPrompt = this.agents['daily-planner'].prompts['week-ahead'];
    plan.sections.push({
      title: 'Week Ahead',
      content: 'Monday: Project deadline\nWednesday: Doctor appointment\nFriday: Team lunch\nWeekend: Hiking trip'
    });

    // 3. Fitness Plan
    console.log('💪 Creating fitness plan...');
    const fitnessPlanPrompt = this.agents['health-tracker'].prompts['fitness-plan'];
    plan.sections.push({
      title: 'Fitness Plan',
      content: 'Mon: Upper body\nTue: Cardio\nWed: Rest\nThu: Lower body\nFri: Yoga\nSat: Hike\nSun: Rest'
    });

    // 4. Budget Planning
    console.log('💵 Budget for the week...');
    const budgetPrompt = this.agents['finance-manager'].prompts['weekly-budget'];
    plan.sections.push({
      title: 'Weekly Budget',
      content: 'Allocated: $500\nGroceries: $150\nTransport: $50\nEntertainment: $100\nSavings: $200'
    });

    this.displayWeeklyPlan(plan);
    await this.saveWeeklyPlan(plan);
    
    return plan;
  }

  /**
   * Track habits, goals, or health metrics
   */
  async track(type, data) {
    console.log(`\n📊 Tracking ${type}...`);
    
    const trackingData = {
      type,
      timestamp: new Date().toISOString(),
      data
    };

    // Save tracking data
    const trackingPath = path.join(this.dataPath, 'tracking.json');
    let existingData = [];
    
    try {
      const fileData = await fs.readFile(trackingPath, 'utf8');
      existingData = JSON.parse(fileData);
    } catch (error) {
      // File doesn't exist yet
    }
    
    existingData.push(trackingData);
    await fs.writeFile(trackingPath, JSON.stringify(existingData, null, 2));
    
    console.log(`✅ ${type} tracked successfully!`);
    
    // Provide feedback based on type
    switch (type) {
      case 'habit':
        console.log('Keep up the great work! Consistency is key.');
        break;
      case 'goal':
        console.log('Progress recorded. You\'re one step closer!');
        break;
      case 'health':
        console.log('Health data logged. Stay healthy!');
        break;
    }
    
    return trackingData;
  }

  // Display methods
  displayBriefing(briefing) {
    console.log('\n' + '='.repeat(60));
    console.log(`📋 MORNING BRIEFING - ${briefing.date}`);
    console.log('='.repeat(60) + '\n');
    
    for (const section of briefing.sections) {
      console.log(`\n${section.title.toUpperCase()}`);
      console.log('-'.repeat(30));
      console.log(section.content);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Have a productive day! 🚀');
    console.log('='.repeat(60) + '\n');
  }

  displayReview(review) {
    console.log('\n' + '='.repeat(60));
    console.log(`🌙 EVENING REVIEW - ${review.date}`);
    console.log('='.repeat(60) + '\n');
    
    for (const section of review.sections) {
      console.log(`\n${section.title.toUpperCase()}`);
      console.log('-'.repeat(30));
      console.log(section.content);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Rest well! Sweet dreams 😴');
    console.log('='.repeat(60) + '\n');
  }

  displayWeeklyPlan(plan) {
    console.log('\n' + '='.repeat(60));
    console.log(`📅 WEEKLY PLAN - Week ${plan.week}`);
    console.log('='.repeat(60) + '\n');
    
    for (const section of plan.sections) {
      console.log(`\n${section.title.toUpperCase()}`);
      console.log('-'.repeat(30));
      console.log(section.content);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('You\'ve got this! 💪');
    console.log('='.repeat(60) + '\n');
  }

  // Save methods
  async saveBriefing(briefing) {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.dataPath, 'briefings', `${date}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(briefing, null, 2));
  }

  async saveReview(review) {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.dataPath, 'reviews', `${date}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(review, null, 2));
  }

  async saveWeeklyPlan(plan) {
    const filePath = path.join(this.dataPath, 'weekly-plans', `week-${plan.week}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(plan, null, 2));
  }

  // Utility methods
  getWeekNumber() {
    const date = new Date();
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}

module.exports = LifeDepartment;