#!/usr/bin/env node

/**
 * Automated Workflow Runner
 * Directly executes Motus workflows without needing Claude Code interactive mode
 */

const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const command = process.argv[2];

async function runWorkflow(workflowName) {
    console.log(`Running ${workflowName}...`);
    
    try {
        switch(workflowName) {
            case 'daily-brief':
                // Run the life-admin-agent directly
                return new Promise((resolve, reject) => {
                    const child = spawn('node', [
                        path.join(__dirname, 'life-admin', 'life-admin-agent.js'),
                        'daily-brief'
                    ], {
                        cwd: __dirname,
                        env: process.env
                    });
                    
                    child.stdout.on('data', (data) => {
                        process.stdout.write(data);
                    });
                    
                    child.stderr.on('data', (data) => {
                        process.stderr.write(data);
                    });
                    
                    child.on('close', (code) => {
                        if (code === 0) {
                            console.log('Daily brief completed successfully');
                            resolve();
                        } else {
                            reject(new Error(`Daily brief failed with code ${code}`));
                        }
                    });
                });
                
            case 'evening-report':
                // For evening report, we need to orchestrate multiple steps
                console.log('Fetching tomorrow\'s weather...');
                const weatherData = await runCommand('node', [
                    path.join(__dirname, 'life-admin', 'tomorrow-weather-fetcher.js')
                ]);
                
                console.log('Fetching tomorrow\'s calendar...');
                let calendarData = await runCommand('node', [
                    path.join(__dirname, 'life-admin', 'life-admin-agent.js'),
                    'get-tomorrow-calendar'
                ]);
                
                // Extract JSON from output (skip any non-JSON lines)
                const jsonMatch = calendarData.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    calendarData = jsonMatch[0];
                }
                
                // Read today's note
                const date = new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
                const notePath = `/Users/ianwinscom/Library/Mobile Documents/iCloud~md~obsidian/Documents/Daily/${date}.md`;
                
                const fs = require('fs');
                if (!fs.existsSync(notePath)) {
                    throw new Error(`Daily note not found: ${notePath}`);
                }
                
                const noteContent = fs.readFileSync(notePath, 'utf8');
                
                // Count tasks
                const totalTasks = (noteContent.match(/^- \[.\]/gm) || []).length;
                const completedTasks = (noteContent.match(/^- \[x\]/gmi) || []).length;
                const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                
                // Parse weather data
                const weather = JSON.parse(weatherData);
                const calendar = JSON.parse(calendarData);
                
                // Generate evening report
                const eveningReport = `

## 🌙 Evening Report

### 📊 Today's Achievements
**Task Completion: ${completedTasks} of ${totalTasks} tasks (${percentage}%)**

${getCompletedTasksSummary(noteContent)}

### 🌤️ Tomorrow's Weather
- **Condition**: ${weather.condition}
- **Temperature**: High ${weather.maxTemp}°C / Low ${weather.minTemp}°C
- **Chance of Rain**: ${weather.chanceOfRain}%
- **Humidity**: ${weather.humidity}%
${weather.chanceOfRain > 50 ? '- **Plan accordingly**: Heavy rain expected - carry umbrella' : ''}

### 📅 Tomorrow's Schedule
${calendar.length > 0 ? calendar.map(event => 
    `- **${event.time}** - ${event.title}${event.duration ? ` (${event.duration})` : ''}`
).join('\n') : '- No events scheduled'}

### 🎯 Ready for Tomorrow
- [ ] Review tomorrow's priorities
- [ ] Prepare materials for meetings
- [ ] Set out clothes for weather
- [ ] Charge devices
- [ ] Review tomorrow's first task

---
*Evening Report Generated at ${new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
})}*`;
                
                // Check if evening report already exists
                if (noteContent.includes('## 🌙 Evening Report')) {
                    console.log('Evening report already exists for today');
                    return;
                }
                
                // Append to note before the final ---
                let updatedNote;
                const lastDividerIndex = noteContent.lastIndexOf('\n---');
                if (lastDividerIndex > -1) {
                    updatedNote = noteContent.slice(0, lastDividerIndex) + eveningReport + '\n' + noteContent.slice(lastDividerIndex);
                } else {
                    updatedNote = noteContent + eveningReport;
                }
                
                fs.writeFileSync(notePath, updatedNote);
                console.log('Evening report added to daily note');
                break;
                
            default:
                throw new Error(`Unknown workflow: ${workflowName}`);
        }
    } catch (error) {
        console.error(`Error running ${workflowName}:`, error.message);
        process.exit(1);
    }
}

function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: __dirname,
            env: process.env
        });
        
        let output = '';
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(`Command failed with code ${code}`));
            }
        });
    });
}

function getCompletedTasksSummary(noteContent) {
    const lines = noteContent.split('\n');
    const completedTasks = [];
    
    let inHighPriority = false;
    let inMediumPriority = false;
    let inLowPriority = false;
    
    for (const line of lines) {
        if (line.includes('### High Priority')) {
            inHighPriority = true;
            inMediumPriority = false;
            inLowPriority = false;
        } else if (line.includes('### Medium Priority')) {
            inHighPriority = false;
            inMediumPriority = true;
            inLowPriority = false;
        } else if (line.includes('### Low Priority')) {
            inHighPriority = false;
            inMediumPriority = false;
            inLowPriority = true;
        } else if (line.startsWith('##')) {
            inHighPriority = false;
            inMediumPriority = false;
            inLowPriority = false;
        }
        
        if (line.match(/^- \[x\]/i)) {
            const taskText = line.replace(/^- \[x\]\s*/i, '');
            if (inHighPriority) {
                completedTasks.push(`🔴 High: ${taskText}`);
            } else if (inMediumPriority) {
                completedTasks.push(`🟡 Medium: ${taskText}`);
            } else if (inLowPriority) {
                completedTasks.push(`🟢 Low: ${taskText}`);
            }
        }
    }
    
    if (completedTasks.length > 0) {
        return '**Completed Today:**\n' + completedTasks.map(t => `- ${t}`).join('\n');
    } else {
        return '';
    }
}

// Run the workflow
if (command) {
    runWorkflow(command).catch(error => {
        console.error('Workflow failed:', error.message);
        process.exit(1);
    });
} else {
    console.error('Usage: node run-automated-workflow.js [daily-brief|evening-report]');
    process.exit(1);
}