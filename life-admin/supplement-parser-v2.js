#!/usr/bin/env node

/**
 * Enhanced Supplement Parser
 * Better parsing of natural language supplement schedules
 */

class SupplementParserV2 {
  constructor() {
    this.supplements = [];
  }

  /**
   * Main parse function
   */
  parse(text) {
    // Split into individual supplement statements
    const statements = this.splitStatements(text);
    
    statements.forEach(statement => {
      const parsed = this.parseOne(statement);
      if (parsed) {
        this.supplements.push(parsed);
      }
    });
    
    return this.groupByTimeAndDays();
  }

  /**
   * Split text into individual supplement statements
   */
  splitStatements(text) {
    // Split by periods, "And" at the beginning of sentences
    const parts = text.split(/\.\s+|\.\s*$/).filter(p => p.trim());
    
    const statements = [];
    parts.forEach(part => {
      // Further split by "and" but be careful about compound names
      if (part.match(/\d+m[cg]\s+(?:of\s+)?[\w\-]+\s+and\s+\d+m[cg]/i)) {
        // This has multiple supplements in one statement
        const subparts = part.split(/\s+and\s+(?=\d+m[cg])/i);
        statements.push(...subparts);
      } else {
        statements.push(part);
      }
    });
    
    return statements.map(s => s.trim()).filter(s => s);
  }

  /**
   * Parse one supplement statement
   */
  parseOne(statement) {
    // Clean statement
    let clean = statement.trim();
    clean = clean.replace(/^(?:I\s+)?(?:take|need|have)\s+/i, '');
    clean = clean.replace(/^and\s+/i, '');
    
    // Try two patterns: "DOSE UNIT NAME" or "NAME DOSE UNIT"
    let dose, unit, name;
    
    // Pattern 1: dose first (e.g., "10mg Yohimbine")
    let doseMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(mg|mcg|iu|ml|g)\s+(?:of\s+)?(.+)/i);
    if (doseMatch) {
      dose = doseMatch[1];
      unit = doseMatch[2].toLowerCase();
      clean = doseMatch[3];
    } else {
      // Pattern 2: name first (e.g., "L-Carnitine 300mg")
      doseMatch = clean.match(/^([\w\-]+(?:\s+[\w\-]+)*?)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|iu|ml|g)/i);
      if (doseMatch) {
        name = doseMatch[1];
        dose = doseMatch[2];
        unit = doseMatch[3].toLowerCase();
        clean = clean.substring(doseMatch[0].length).trim();
      } else {
        return null;
      }
    }
    
    // If we still need to extract the name
    if (!name) {
      // Extract supplement name (everything until a keyword)
      const nameMatch = clean.match(/^([\w\-]+(?:\s+[\w\-]+)*?)(?:\s+(?:every|at|on|before|after|mon|tue|wed|thu|fri|sat|sun|daily|weekday))/i);
      name = nameMatch ? nameMatch[1] : clean.split(/\s+(?:every|at|on|before|after|mon|tue|wed|thu|fri|sat|sun|daily|weekday)/i)[0];
      
      // Handle special cases where name might not be captured
      if (!name || name.length < 2) {
        // Try to get first word(s) before common keywords
        const altMatch = clean.match(/^([\w\-]+(?:\s+[\w\-]+)*?)(?:\s|$)/);
        if (altMatch) {
          name = altMatch[1];
        }
      }
    }
    
    // Extract time
    let time = '06:30'; // default
    const timeMatch = statement.match(/(?:at|@)\s*(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = timeMatch[3];
      
      if (ampm.toLowerCase() === 'pm' && hours < 12) {
        hours += 12;
      } else if (ampm.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }
      
      time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    // Special case for pre-workout
    const isPreWorkout = /before\s+(?:the\s+)?(?:gym|workout)/i.test(statement);
    if (isPreWorkout) {
      // Look for time specifically after "at"
      const preWorkoutTime = statement.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (preWorkoutTime) {
        let hours = parseInt(preWorkoutTime[1]);
        const minutes = preWorkoutTime[2] ? parseInt(preWorkoutTime[2]) : 0;
        const ampm = preWorkoutTime[3];
        
        // If PM or if hour is small (1-5), assume PM for gym
        if ((ampm && ampm.toLowerCase() === 'pm' && hours < 12) || (!ampm && hours <= 5)) {
          hours += 12;
        }
        
        time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
    }
    
    // Extract days
    const days = this.extractDays(statement);
    
    return {
      name: name.trim(),
      dose: dose,
      unit: unit,
      time: time,
      days: days,
      isPreWorkout: isPreWorkout
    };
  }

  /**
   * Extract days from statement
   */
  extractDays(statement) {
    const lower = statement.toLowerCase();
    
    // Check patterns
    if (lower.includes('everyday') || lower.includes('every day') || lower.includes('daily')) {
      return ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    }
    
    if (lower.includes('mon-sat') || lower.includes('monday through saturday')) {
      return ['MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    }
    
    if (lower.includes('mon-fri') || lower.includes('monday through friday') || lower.includes('weekday')) {
      return ['MO', 'TU', 'WE', 'TH', 'FR'];
    }
    
    if (lower.includes('m-w-f')) {
      return ['MO', 'WE', 'FR'];
    }
    
    // Check for specific days mentioned
    const dayMap = {
      'monday': 'MO', 'mon': 'MO',
      'tuesday': 'TU', 'tue': 'TU',
      'wednesday': 'WE', 'wed': 'WE',
      'thursday': 'TH', 'thu': 'TH',
      'friday': 'FR', 'fri': 'FR',
      'saturday': 'SA', 'sat': 'SA',
      'sunday': 'SU', 'sun': 'SU'
    };
    
    const foundDays = [];
    
    // Look for patterns like "every Monday"
    if (lower.includes('every monday')) foundDays.push('MO');
    if (lower.includes('every tuesday')) foundDays.push('TU');
    if (lower.includes('every wednesday')) foundDays.push('WE');
    if (lower.includes('every thursday')) foundDays.push('TH');
    if (lower.includes('every friday')) foundDays.push('FR');
    if (lower.includes('every saturday')) foundDays.push('SA');
    if (lower.includes('every sunday')) foundDays.push('SU');
    
    // Look for "on mon, tue, thu, fri"
    const onDaysMatch = lower.match(/on\s+((?:mon|tue|wed|thu|fri|sat|sun)(?:,?\s*(?:mon|tue|wed|thu|fri|sat|sun))*)/i);
    if (onDaysMatch) {
      const daysList = onDaysMatch[1];
      Object.entries(dayMap).forEach(([dayName, dayCode]) => {
        if (daysList.includes(dayName)) {
          if (!foundDays.includes(dayCode)) {
            foundDays.push(dayCode);
          }
        }
      });
    }
    
    if (foundDays.length > 0) {
      // Sort in week order
      const dayOrder = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
      return foundDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    }
    
    // Default to every day
    return ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  }

  /**
   * Group supplements by time and days
   */
  groupByTimeAndDays() {
    const groups = {};
    
    this.supplements.forEach(supp => {
      const key = `${supp.time}_${supp.days.join(',')}`;
      if (!groups[key]) {
        groups[key] = {
          time: supp.time,
          days: supp.days,
          supplements: [],
          isPreWorkout: supp.isPreWorkout
        };
      }
      groups[key].supplements.push({
        name: supp.name,
        dose: supp.dose,
        unit: supp.unit
      });
    });
    
    return Object.values(groups);
  }
}

// Test if run directly
if (require.main === module) {
  const parser = new SupplementParserV2();
  const testInput = process.argv.slice(2).join(' ') || 
    "I take 10mg of Yohimbine and 250mcg of SLU-PP-332 everyday at 6:30am, Mon-Sat. I take 2mg of TB-500 every M-W-F at 6:30. 250mcg BPC-157 Monday through Friday. 1mg MOTS-C Mon-Friday. 3mg Retatrutide every Monday. And L-Carnitine 300mg before the gym at 1pm on mon, tue, thu, fri";
  
  const result = parser.parse(testInput);
  console.log(JSON.stringify(result, null, 2));
}

module.exports = SupplementParserV2;