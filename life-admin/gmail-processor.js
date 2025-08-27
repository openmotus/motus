#!/usr/bin/env node

/**
 * Gmail Processor for Motus
 * Fetches and processes important emails for daily briefing
 */

require('dotenv').config();
const { google } = require('googleapis');

async function processImportantEmails() {
  console.log('📧 Email Summary\n');
  console.log('='.repeat(50));
  
  try {
    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/oauth2callback'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get date from 24 hours ago
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTimestamp = Math.floor(yesterday.getTime() / 1000);

    // Search for important/unread emails from last 24 hours
    const queries = [
      `is:unread after:${yesterdayTimestamp}`,
      `is:important after:${yesterdayTimestamp}`,
      `label:priority after:${yesterdayTimestamp}`
    ];

    let allImportantEmails = new Set();
    let emailDetails = [];

    // Fetch emails for each query
    for (const query of queries) {
      try {
        const response = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: 20
        });

        if (response.data.messages) {
          response.data.messages.forEach(msg => allImportantEmails.add(msg.id));
        }
      } catch (error) {
        console.log(`⚠️  Query failed: ${query}`);
      }
    }

    if (allImportantEmails.size === 0) {
      console.log('✅ No new important emails\n');
      return;
    }

    console.log(`📊 Found ${allImportantEmails.size} important/unread emails\n`);

    // Get details for each email
    for (const messageId of Array.from(allImportantEmails).slice(0, 10)) {
      try {
        const message = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full'
        });

        const headers = message.data.payload.headers;
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        // Extract email preview from body
        let preview = '';
        if (message.data.payload.body?.data) {
          preview = Buffer.from(message.data.payload.body.data, 'base64').toString('utf8');
        } else if (message.data.payload.parts) {
          // Look for text/plain part
          const textPart = message.data.payload.parts.find(part => 
            part.mimeType === 'text/plain' && part.body?.data
          );
          if (textPart) {
            preview = Buffer.from(textPart.body.data, 'base64').toString('utf8');
          }
        }

        // Clean up preview - remove HTML tags and limit to 100 chars
        preview = preview
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
          .substring(0, 100);

        // Determine action needed
        let action = 'Review required';
        const subjectLower = subject.toLowerCase();
        const previewLower = preview.toLowerCase();

        if (subjectLower.includes('urgent') || previewLower.includes('urgent')) {
          action = 'URGENT - Response needed';
        } else if (subjectLower.includes('meeting') || subjectLower.includes('calendar')) {
          action = 'Calendar review needed';
        } else if (subjectLower.includes('invoice') || subjectLower.includes('payment')) {
          action = 'Finance review needed';
        } else if (previewLower.includes('please respond') || previewLower.includes('reply')) {
          action = 'Response needed';
        } else if (subjectLower.includes('document') || previewLower.includes('attached')) {
          action = 'Document review required';
        }

        // Check if unread
        const labels = message.data.labelIds || [];
        const isUnread = labels.includes('UNREAD');
        const isImportant = labels.includes('IMPORTANT');

        emailDetails.push({
          from: from.replace(/[<>]/g, ''), // Clean email format
          subject,
          preview,
          action,
          date: new Date(date),
          isUnread,
          isImportant,
          priority: isImportant ? 3 : (isUnread ? 2 : 1)
        });

      } catch (error) {
        console.log(`⚠️  Failed to get details for message ${messageId}`);
      }
    }

    // Sort by priority and date
    emailDetails.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.date - a.date;
    });

    // Display top priority emails
    console.log('🔥 Top Priority Emails:\n');
    emailDetails.slice(0, 8).forEach((email, index) => {
      const priorityIcon = email.isImportant ? '🔴' : (email.isUnread ? '🟡' : '⚪');
      
      console.log(`${priorityIcon} Email ${index + 1}:`);
      console.log(`   From: ${email.from}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   Preview: ${email.preview}${email.preview.length === 100 ? '...' : ''}`);
      console.log(`   Action: ${email.action}`);
      console.log(`   Date: ${email.date.toLocaleString()}`);
      console.log('');
    });

    if (emailDetails.length > 8) {
      console.log(`... and ${emailDetails.length - 8} more emails requiring attention\n`);
    }

    // Summary by action type
    const actionSummary = {};
    emailDetails.forEach(email => {
      actionSummary[email.action] = (actionSummary[email.action] || 0) + 1;
    });

    console.log('📋 Actions Summary:');
    Object.entries(actionSummary).forEach(([action, count]) => {
      console.log(`   ${action}: ${count} email${count > 1 ? 's' : ''}`);
    });

  } catch (error) {
    console.error('❌ Gmail authentication failed:', error.message);
    console.log('Please check your .env file and ensure Gmail API access is configured.');
  }
}

// Run if called directly
if (require.main === module) {
  processImportantEmails().catch(console.error);
}

module.exports = { processImportantEmails };
