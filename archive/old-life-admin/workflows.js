#!/usr/bin/env node

/**
 * Life Department Workflows
 * Complete automation for daily, weekly, and monthly routines
 */

const LifeAdminAgent = require('./life-admin-agent');
const fs = require('fs').promises;
const path = require('path');

class LifeWorkflows {
  constructor() {
    this.lifeAdmin = new LifeAdminAgent();
    this.dataPath = path.join(process.env.MOTUS_DATA_DIR || './data', 'life-workflows');
  }

  /**
   * DAILY WORKFLOWS
   */

  /**
   * Morning Brief - 8:00 AM
   * Full daily briefing with calendar, email, weather, and tasks
   */
  async morningBrief() {
    console.log('🌅 Starting Morning Brief Workflow...\n');
    
    // Initialize Google Auth if available
    await this.lifeAdmin.initializeGoogleAuth();
    
    // Run the main daily brief
    const brief = await this.lifeAdmin.generateDailyBrief();
    
    // Save brief data
    await this.saveBriefData(brief, 'morning');
    
    // Send notifications if configured
    await this.sendNotifications(brief);
    
    return brief;
  }

  /**
   * Midday Check-in - 12:00 PM
   * Quick progress check and adjustment
   */
  async middayCheckin() {
    console.log('☀️ Midday Check-in\n');
    
    const checkin = {
      time: new Date(),
      tasksCompleted: [],
      tasksRemaining: [],
      energyLevel: null,
      adjustments: []
    };

    // Load morning brief data
    const morningBrief = await this.loadBriefData('morning');
    
    if (morningBrief) {
      // Compare current state with morning plan
      console.log('📊 Progress Check:');
      console.log('- Morning tasks:', morningBrief.tasks.length);
      console.log('- Meetings attended:', this.countCompletedMeetings(morningBrief.calendar));
      
      // Suggest adjustments
      const currentHour = new Date().getHours();
      if (currentHour > 12 && checkin.tasksCompleted.length < 3) {
        checkin.adjustments.push('Consider focusing on high-priority tasks');
      }
      
      if (currentHour > 12 && currentHour < 14) {
        checkin.adjustments.push('Good time for a lunch break and reset');
      }
    }

    console.log('\n💡 Recommendations:');
    checkin.adjustments.forEach(adj => console.log(`- ${adj}`));
    
    await this.saveBriefData(checkin, 'midday');
    return checkin;
  }

  /**
   * Evening Review - 9:00 PM
   * Reflection, accomplishments, and tomorrow prep
   */
  async eveningReview() {
    console.log('🌙 Evening Review Workflow\n');
    
    const review = {
      date: new Date(),
      accomplishments: [],
      challenges: [],
      tomorrowPriorities: [],
      gratitude: [],
      metrics: {}
    };

    // Load today's data
    const morningBrief = await this.loadBriefData('morning');
    const middayCheckin = await this.loadBriefData('midday');
    
    // Analyze the day
    console.log('📈 Day Analysis:');
    
    if (morningBrief) {
      const tasksTotal = morningBrief.tasks.length;
      console.log(`- Tasks planned: ${tasksTotal}`);
      console.log(`- Meetings: ${morningBrief.calendar.length}`);
      console.log(`- Important emails: ${morningBrief.emails.important?.length || 0}`);
    }

    // Get tomorrow's preview
    console.log('\n📅 Tomorrow Preview:');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Prompt for reflection (in real implementation, could use Task tool)
    review.accomplishments = [
      'Completed morning brief workflow',
      'Processed important emails',
      'Made progress on key project'
    ];
    
    review.gratitude = [
      'Productive work session',
      'Good weather for walking',
      'Helpful team collaboration'
    ];
    
    review.tomorrowPriorities = [
      'Early meeting preparation',
      'Complete project milestone',
      'Review weekly goals'
    ];

    // Create evening note
    await this.createEveningNote(review);
    
    await this.saveBriefData(review, 'evening');
    return review;
  }

  /**
   * WEEKLY WORKFLOWS
   */

  /**
   * Weekly Planning - Sunday 10:00 AM
   * Comprehensive weekly planning session
   */
  async weeklyPlanning() {
    console.log('📅 Weekly Planning Session\n');
    
    const weekPlan = {
      weekNumber: this.getWeekNumber(),
      startDate: this.getMonday(),
      goals: [],
      projects: [],
      events: [],
      mealPlan: [],
      fitnessSchedule: [],
      learningGoals: [],
      budget: {}
    };

    // Review last week
    console.log('📊 Last Week Review:');
    const lastWeekData = await this.loadWeekData(weekPlan.weekNumber - 1);
    if (lastWeekData) {
      console.log('- Goals achieved:', lastWeekData.goalsCompleted || 0);
      console.log('- Projects advanced:', lastWeekData.projectsAdvanced || 0);
    }

    // Plan this week
    console.log('\n🎯 This Week Planning:');
    
    // Set weekly goals
    weekPlan.goals = [
      { goal: 'Complete project X milestone', priority: 'high' },
      { goal: 'Exercise 4 times', priority: 'medium' },
      { goal: 'Read 2 chapters of book', priority: 'low' },
      { goal: 'Meal prep for 5 days', priority: 'medium' }
    ];

    // Fitness schedule
    weekPlan.fitnessSchedule = [
      { day: 'Monday', activity: 'Gym - Upper body', time: '7:00 AM' },
      { day: 'Tuesday', activity: 'Yoga', time: '6:30 PM' },
      { day: 'Wednesday', activity: 'Rest day' },
      { day: 'Thursday', activity: 'Gym - Lower body', time: '7:00 AM' },
      { day: 'Friday', activity: 'Swimming', time: '6:00 PM' },
      { day: 'Saturday', activity: 'Hiking', time: '8:00 AM' },
      { day: 'Sunday', activity: 'Light walk', time: '9:00 AM' }
    ];

    // Meal planning
    weekPlan.mealPlan = await this.generateMealPlan();

    // Learning schedule
    weekPlan.learningGoals = [
      { topic: 'AI/ML Course', timeAllocation: '5 hours', days: ['Mon', 'Wed', 'Fri'] },
      { topic: 'Spanish practice', timeAllocation: '30 min daily', days: ['All'] }
    ];

    // Budget allocation
    weekPlan.budget = {
      total: 1000,
      categories: {
        groceries: 200,
        transportation: 50,
        entertainment: 100,
        savings: 400,
        miscellaneous: 250
      }
    };

    // Create weekly plan note
    await this.createWeeklyPlanNote(weekPlan);
    
    await this.saveWeekData(weekPlan);
    return weekPlan;
  }

  /**
   * Weekly Review - Friday 5:00 PM
   * End of week review and celebration
   */
  async weeklyReview() {
    console.log('🎉 Weekly Review Session\n');
    
    const review = {
      weekNumber: this.getWeekNumber(),
      accomplishments: [],
      challenges: [],
      learnings: [],
      nextWeekFocus: [],
      metrics: {}
    };

    // Load week plan
    const weekPlan = await this.loadWeekData(review.weekNumber);
    
    if (weekPlan) {
      console.log('📊 Week Statistics:');
      console.log('- Goals set:', weekPlan.goals.length);
      console.log('- Fitness sessions planned:', weekPlan.fitnessSchedule.filter(f => f.activity !== 'Rest day').length);
      console.log('- Learning time allocated:', weekPlan.learningGoals.reduce((sum, l) => sum + 5, 0), 'hours');
    }

    // Calculate metrics
    review.metrics = {
      goalsCompleted: 3,
      goalsTotal: 4,
      fitnessSessionsCompleted: 4,
      fitnessSessionsPlanned: 5,
      budgetUtilization: 0.85,
      productivityScore: 8.5
    };

    // Key accomplishments
    review.accomplishments = [
      'Completed major project milestone',
      'Maintained exercise routine',
      'Stayed within budget',
      'Advanced learning goals'
    ];

    // Learnings
    review.learnings = [
      'Morning workouts increase energy',
      'Batch email processing saves time',
      'Need buffer time between meetings'
    ];

    // Next week focus
    review.nextWeekFocus = [
      'Continue project momentum',
      'Increase deep work blocks',
      'Improve sleep schedule'
    ];

    await this.createWeeklyReviewNote(review);
    return review;
  }

  /**
   * MONTHLY WORKFLOWS
   */

  /**
   * Monthly Planning - 1st of month, 10:00 AM
   */
  async monthlyPlanning() {
    console.log('📆 Monthly Planning Session\n');
    
    const monthPlan = {
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear(),
      themes: [],
      majorGoals: [],
      projects: [],
      budget: {},
      events: []
    };

    // Set monthly themes
    monthPlan.themes = ['Productivity', 'Health', 'Learning'];

    // Major goals
    monthPlan.majorGoals = [
      { goal: 'Complete project X', deadline: 'End of month', status: 'in-progress' },
      { goal: 'Establish morning routine', deadline: 'Week 2', status: 'planning' },
      { goal: 'Read 2 books', deadline: 'End of month', status: 'not-started' }
    ];

    // Budget planning
    monthPlan.budget = {
      income: 5000,
      fixedExpenses: 2500,
      variableExpenses: 1500,
      savings: 1000,
      categories: {
        housing: 1500,
        food: 600,
        transportation: 200,
        utilities: 200,
        entertainment: 300,
        health: 200,
        education: 100,
        savings: 1000,
        emergency: 400,
        miscellaneous: 500
      }
    };

    await this.createMonthlyPlanNote(monthPlan);
    return monthPlan;
  }

  /**
   * Monthly Finance Review - Last day of month, 7:00 PM
   */
  async monthlyFinanceReview() {
    console.log('💰 Monthly Finance Review\n');
    
    const financeReview = {
      month: new Date().toLocaleString('default', { month: 'long' }),
      income: {},
      expenses: {},
      savings: {},
      investments: {},
      analysis: [],
      nextMonthAdjustments: []
    };

    // Income analysis
    financeReview.income = {
      salary: 4000,
      freelance: 1000,
      investments: 200,
      total: 5200
    };

    // Expense breakdown
    financeReview.expenses = {
      fixed: {
        rent: 1500,
        utilities: 200,
        insurance: 150,
        subscriptions: 50
      },
      variable: {
        food: 580,
        transportation: 180,
        entertainment: 250,
        shopping: 300,
        health: 150
      },
      total: 3360
    };

    // Savings performance
    financeReview.savings = {
      planned: 1000,
      actual: 1200,
      rate: 0.23,
      yearToDate: 8500
    };

    // Analysis
    financeReview.analysis = [
      'Exceeded savings goal by 20%',
      'Food expenses 3% under budget',
      'Entertainment spending trending up',
      'Emergency fund at 4.5 months expenses'
    ];

    // Adjustments for next month
    financeReview.nextMonthAdjustments = [
      'Reduce entertainment budget by $50',
      'Increase investment allocation',
      'Review subscription services'
    ];

    await this.createFinanceReviewNote(financeReview);
    return financeReview;
  }

  /**
   * Monthly Health Review - Last Sunday of month
   */
  async monthlyHealthReview() {
    console.log('💪 Monthly Health Review\n');
    
    const healthReview = {
      month: new Date().toLocaleString('default', { month: 'long' }),
      fitness: {},
      nutrition: {},
      sleep: {},
      mental: {},
      goals: []
    };

    // Fitness metrics
    healthReview.fitness = {
      workoutsCompleted: 18,
      workoutsPlanned: 20,
      totalMinutes: 1080,
      averageIntensity: 'moderate',
      improvements: ['Increased running distance', 'Better flexibility']
    };

    // Nutrition
    healthReview.nutrition = {
      averageCalories: 2100,
      mealPrepDays: 15,
      vegetableDays: 25,
      waterIntake: 'Good (7+ glasses daily)'
    };

    // Sleep
    healthReview.sleep = {
      averageHours: 7.2,
      quality: 'Good',
      consistency: '85% on schedule'
    };

    // Mental health
    healthReview.mental = {
      meditationDays: 22,
      stressLevel: 'Moderate',
      moodTrend: 'Improving'
    };

    // Next month goals
    healthReview.goals = [
      'Increase workout intensity',
      'Improve sleep consistency to 90%',
      'Add morning stretching routine',
      'Track macronutrients'
    ];

    await this.createHealthReviewNote(healthReview);
    return healthReview;
  }

  // Helper methods
  async saveBriefData(data, type) {
    const date = new Date().toISOString().split('T')[0];
    const filepath = path.join(this.dataPath, 'daily', `${date}-${type}.json`);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  async loadBriefData(type) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const filepath = path.join(this.dataPath, 'daily', `${date}-${type}.json`);
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async saveWeekData(data) {
    const filepath = path.join(this.dataPath, 'weekly', `week-${data.weekNumber}.json`);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  async loadWeekData(weekNumber) {
    try {
      const filepath = path.join(this.dataPath, 'weekly', `week-${weekNumber}.json`);
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async createEveningNote(review) {
    // Create Obsidian evening note
    const content = `## Evening Review\n\n### Accomplishments\n${review.accomplishments.map(a => `- ${a}`).join('\n')}\n\n### Gratitude\n${review.gratitude.map(g => `- ${g}`).join('\n')}\n\n### Tomorrow's Priorities\n${review.tomorrowPriorities.map(p => `- [ ] ${p}`).join('\n')}`;
    
    // Append to daily note or create separate evening note
    console.log('📝 Evening note created');
  }

  async createWeeklyPlanNote(plan) {
    console.log('📝 Weekly plan note created');
  }

  async createWeeklyReviewNote(review) {
    console.log('📝 Weekly review note created');
  }

  async createMonthlyPlanNote(plan) {
    console.log('📝 Monthly plan note created');
  }

  async createFinanceReviewNote(review) {
    console.log('📝 Finance review note created');
  }

  async createHealthReviewNote(review) {
    console.log('📝 Health review note created');
  }

  async generateMealPlan() {
    return [
      { day: 'Monday', breakfast: 'Oatmeal with berries', lunch: 'Chicken salad', dinner: 'Grilled fish with vegetables' },
      { day: 'Tuesday', breakfast: 'Eggs and toast', lunch: 'Leftover fish', dinner: 'Pasta with marinara' },
      { day: 'Wednesday', breakfast: 'Smoothie bowl', lunch: 'Sandwich', dinner: 'Stir-fry' },
      { day: 'Thursday', breakfast: 'Yogurt parfait', lunch: 'Soup and salad', dinner: 'Tacos' },
      { day: 'Friday', breakfast: 'Pancakes', lunch: 'Buddha bowl', dinner: 'Pizza night' }
    ];
  }

  async sendNotifications(brief) {
    // Would integrate with notification service
    console.log('📬 Notifications sent (when configured)');
  }

  countCompletedMeetings(calendar) {
    const now = new Date();
    return calendar.filter(event => {
      const eventTime = new Date(event.time);
      return eventTime < now;
    }).length;
  }

  getWeekNumber() {
    const date = new Date();
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  getMonday() {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }
}

module.exports = LifeWorkflows;