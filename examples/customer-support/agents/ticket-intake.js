#!/usr/bin/env node

/**
 * Ticket Intake — Data Fetcher Implementation
 *
 * Parses raw support tickets into structured data.
 * Supports email-style text, JSON payloads, and form submissions.
 */

/**
 * Parse a raw ticket string into a structured ticket object.
 * @param {string} rawTicket - Raw ticket text (email format or plain text)
 * @param {Object} [meta] - Optional metadata (channel, account info)
 * @returns {Object} Structured ticket data
 */
function parseTicket(rawTicket, meta = {}) {
  if (!rawTicket || typeof rawTicket !== 'string') {
    throw new Error('rawTicket must be a non-empty string');
  }

  const lines = rawTicket.trim().split('\n');

  // Try to extract email-style headers
  const headers = {};
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const headerMatch = lines[i].match(/^(From|To|Subject|Date):\s*(.+)/i);
    if (headerMatch) {
      headers[headerMatch[1].toLowerCase()] = headerMatch[2].trim();
      bodyStart = i + 1;
    } else if (lines[i].trim() === '') {
      bodyStart = i + 1;
      break;
    } else {
      break;
    }
  }

  const body = lines.slice(bodyStart).join('\n').trim();
  const subject = headers.subject || body.slice(0, 80).replace(/\n/g, ' ');

  // Extract customer info from headers or metadata
  const customer = parseCustomer(headers.from || meta.from || 'Unknown');

  // Generate ticket ID
  const now = new Date();
  const id = `T-${now.getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

  return {
    ticket: {
      id,
      customer,
      subject,
      body: stripHtml(body),
      channel: meta.channel || detectChannel(headers),
      receivedAt: headers.date ? new Date(headers.date).toISOString() : now.toISOString(),
      hasAttachments: /\[attachment/i.test(rawTicket) || /Content-Disposition:\s*attachment/i.test(rawTicket)
    }
  };
}

/**
 * Parse a "From" header or name string into customer info.
 * @param {string} from - From header value or customer name
 * @returns {Object} Customer object with name and email
 */
function parseCustomer(from) {
  const emailMatch = from.match(/<(.+?)>/);
  const email = emailMatch ? emailMatch[1] : (from.includes('@') ? from.trim() : null);
  const name = emailMatch ? from.replace(/<.+?>/, '').trim() : (email ? email.split('@')[0] : from);

  return {
    name: name || 'Unknown',
    email: email || 'unknown@example.com',
    accountTier: 'unknown'
  };
}

/**
 * Detect the ticket channel from headers.
 * @param {Object} headers - Parsed email headers
 * @returns {string} Channel name
 */
function detectChannel(headers) {
  if (headers.from) return 'email';
  return 'web';
}

/**
 * Strip HTML tags from text.
 * @param {string} text - Input text potentially containing HTML
 * @returns {string} Clean text
 */
function stripHtml(text) {
  return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}

// CLI execution
if (require.main === module) {
  const fs = require('fs');
  const inputFile = process.argv[2];

  if (!inputFile) {
    // Read from stdin or use sample
    const sample = `From: Jane Smith <jane@example.com>
Subject: Cannot access billing portal
Date: ${new Date().toISOString()}

Hi, I've been trying to access the billing portal for the past hour but keep getting a 403 error.
I need to update my payment method before my subscription renews tomorrow.

This is urgent - please help!

Thanks,
Jane`;
    const result = parseTicket(sample);
    console.log(JSON.stringify(result, null, 2));
  } else {
    const raw = fs.readFileSync(inputFile, 'utf8');
    const result = parseTicket(raw);
    console.log(JSON.stringify(result, null, 2));
  }
}

module.exports = { parseTicket, parseCustomer, stripHtml, detectChannel };
