/**
 * Alert Router — utility module for the notification-router example.
 *
 * Provides alert parsing, severity classification, channel resolution,
 * message formatting, and dispatch plan building.
 */

// Severity levels ordered from most to least critical
const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low', 'info'];

// Keywords that influence severity scoring
const SEVERITY_KEYWORDS = {
  critical: ['down', 'outage', 'crash', 'unreachable', 'data loss', 'security breach', 'p0'],
  high: ['degraded', 'error rate', 'timeout', 'failing', 'threshold exceeded', 'p1'],
  medium: ['warning', 'elevated', 'approaching', 'retry', 'slow', 'p2'],
  low: ['notice', 'info', 'scheduled', 'maintenance', 'minor', 'p3'],
  info: ['resolved', 'recovered', 'completed', 'healthy', 'cleared']
};

// Channel format templates
const CHANNEL_FORMATS = {
  slack: { maxLength: 3000, supportsMarkdown: true, supportsBlocks: true },
  email: { maxLength: null, supportsHtml: true, requiresSubject: true },
  sms: { maxLength: 160, supportsMarkdown: false, supportsBlocks: false },
  webhook: { maxLength: null, format: 'json' }
};

/**
 * Parse a raw alert into a structured object.
 *
 * @param {Object|string} raw - Raw alert payload (object or JSON string)
 * @returns {{ title: string, source: string, message: string, severity: string|null, category: string|null, timestamp: string, raw: Object }}
 */
function parseAlert(raw) {
  if (!raw) {
    throw new Error('Alert payload is required');
  }

  let data;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      // Treat plain text as a simple alert
      data = { title: raw, message: raw };
    }
  } else if (typeof raw === 'object') {
    data = raw;
  } else {
    throw new Error(`Invalid alert payload type: ${typeof raw}`);
  }

  return {
    title: data.title || data.subject || data.name || 'Untitled Alert',
    source: data.source || data.origin || data.service || 'unknown',
    message: data.message || data.body || data.description || data.title || '',
    severity: data.severity || data.priority || null,
    category: data.category || data.type || null,
    timestamp: data.timestamp || data.created_at || new Date().toISOString(),
    raw: data
  };
}

/**
 * Classify an alert's severity based on keywords in its title and message.
 * If the alert already has a valid severity, that is returned.
 *
 * @param {{ title: string, message: string, severity: string|null }} alert
 * @returns {{ severity: string, score: number, matchedKeywords: string[] }}
 */
function classifySeverity(alert) {
  if (!alert || typeof alert !== 'object') {
    throw new Error('Alert object is required');
  }

  // If severity is already set and valid, use it
  if (alert.severity && SEVERITY_LEVELS.includes(alert.severity.toLowerCase())) {
    return {
      severity: alert.severity.toLowerCase(),
      score: SEVERITY_LEVELS.indexOf(alert.severity.toLowerCase()),
      matchedKeywords: []
    };
  }

  const text = `${alert.title || ''} ${alert.message || ''}`.toLowerCase();
  const matches = {};

  for (const [level, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    matches[level] = keywords.filter(kw => text.includes(kw));
  }

  // Score: more critical levels get higher weight; only override default when keywords match
  let bestLevel = 'medium'; // default when no keywords match
  let bestScore = 0;

  for (const level of SEVERITY_LEVELS) {
    const weight = SEVERITY_LEVELS.length - SEVERITY_LEVELS.indexOf(level);
    const score = matches[level].length * weight;
    if (score > bestScore) {
      bestScore = score;
      bestLevel = level;
    }
  }

  const matchedKeywords = Object.values(matches).flat();

  return {
    severity: bestLevel,
    score: bestScore,
    matchedKeywords
  };
}

/**
 * Resolve which notification channels should receive an alert,
 * based on routing rules.
 *
 * @param {string} severity - Alert severity level
 * @param {string} category - Alert category
 * @param {Object[]} rules - Routing rules, each with { severity, category, channels }
 * @returns {{ channels: Object[], matchedRules: number }}
 */
function resolveChannels(severity, category, rules) {
  if (!Array.isArray(rules)) {
    throw new Error('Routing rules must be an array');
  }

  if (!severity || typeof severity !== 'string') {
    return { channels: [], matchedRules: 0 };
  }

  const normalizedSeverity = severity.toLowerCase();
  const normalizedCategory = category ? category.toLowerCase() : null;

  const matchedChannels = new Map(); // deduplicate by channel type + target
  let matchedRules = 0;

  for (const rule of rules) {
    if (!rule || typeof rule !== 'object') continue;

    const severityMatch = !rule.severity || rule.severity === '*' ||
      rule.severity.toLowerCase() === normalizedSeverity;
    const categoryMatch = !rule.category || rule.category === '*' ||
      (normalizedCategory && rule.category.toLowerCase() === normalizedCategory);

    if (severityMatch && categoryMatch && Array.isArray(rule.channels)) {
      matchedRules++;
      for (const channel of rule.channels) {
        if (!channel || !channel.type) continue;
        const key = `${channel.type}:${channel.target || 'default'}`;
        if (!matchedChannels.has(key)) {
          matchedChannels.set(key, { ...channel });
        }
      }
    }
  }

  return {
    channels: Array.from(matchedChannels.values()),
    matchedRules
  };
}

/**
 * Format an alert for a specific notification channel.
 *
 * @param {{ title: string, severity: string, source: string, message: string, timestamp: string }} alert
 * @param {string} channelType - One of: slack, email, sms, webhook
 * @returns {{ formatted: string|Object, truncated: boolean }}
 */
function formatForChannel(alert, channelType) {
  if (!alert || typeof alert !== 'object') {
    throw new Error('Alert object is required');
  }
  if (!channelType || typeof channelType !== 'string') {
    throw new Error('Channel type is required');
  }

  const type = channelType.toLowerCase();
  const spec = CHANNEL_FORMATS[type];

  if (!spec) {
    // Unknown channel — return JSON
    return { formatted: JSON.stringify(alert), truncated: false };
  }

  const severityUpper = (alert.severity || 'unknown').toUpperCase();
  const title = alert.title || 'Alert';
  const source = alert.source || 'unknown';
  const message = alert.message || '';
  const ts = alert.timestamp || new Date().toISOString();

  let formatted;
  let truncated = false;

  switch (type) {
    case 'slack': {
      const emoji = {
        critical: ':rotating_light:',
        high: ':warning:',
        medium: ':large_yellow_circle:',
        low: ':information_source:',
        info: ':white_check_mark:'
      }[alert.severity] || ':bell:';

      formatted = `${emoji} *${severityUpper}* — ${title}\n_Source: ${source} | ${ts}_\n${message}`;
      if (spec.maxLength && formatted.length > spec.maxLength) {
        formatted = formatted.slice(0, spec.maxLength - 3) + '...';
        truncated = true;
      }
      break;
    }

    case 'email':
      formatted = {
        subject: `[${severityUpper}] ${title}`,
        body: `<h2>${title}</h2><p><strong>Severity:</strong> ${severityUpper}</p><p><strong>Source:</strong> ${source}</p><p><strong>Time:</strong> ${ts}</p><p>${message}</p>`
      };
      break;

    case 'sms': {
      formatted = `${severityUpper}: ${title}`;
      if (formatted.length > spec.maxLength) {
        formatted = formatted.slice(0, spec.maxLength - 3) + '...';
        truncated = true;
      }
      break;
    }

    case 'webhook':
      formatted = {
        severity: alert.severity,
        title,
        source,
        message,
        timestamp: ts
      };
      break;

    default:
      formatted = JSON.stringify(alert);
  }

  return { formatted, truncated };
}

/**
 * Build a complete dispatch plan: classify severity, resolve channels,
 * and format messages for each channel.
 *
 * @param {Object} rawAlert - Raw alert payload
 * @param {Object[]} rules - Routing rules
 * @returns {{ alert: Object, classification: Object, channels: Object[], messages: Object[] }}
 */
function buildDispatchPlan(rawAlert, rules) {
  const alert = parseAlert(rawAlert);
  const classification = classifySeverity(alert);
  alert.severity = classification.severity;

  const { channels } = resolveChannels(classification.severity, alert.category, rules);

  const messages = channels.map(channel => {
    const { formatted, truncated } = formatForChannel(alert, channel.type);
    return {
      channel: channel.type,
      target: channel.target || 'default',
      formatted,
      truncated
    };
  });

  return {
    alert,
    classification,
    channels,
    messages
  };
}

module.exports = {
  SEVERITY_LEVELS,
  SEVERITY_KEYWORDS,
  CHANNEL_FORMATS,
  parseAlert,
  classifySeverity,
  resolveChannels,
  formatForChannel,
  buildDispatchPlan
};
