/**
 * Onboarding Checklist Utilities
 *
 * Helper functions for managing new employee onboarding checklists,
 * validating required documents, and generating progress reports.
 */

/**
 * Standard onboarding documents required for all new hires.
 */
const REQUIRED_DOCUMENTS = [
  { id: 'contract', name: 'Employment Contract', category: 'legal' },
  { id: 'tax-w4', name: 'W-4 Tax Withholding', category: 'legal' },
  { id: 'tax-i9', name: 'I-9 Employment Eligibility', category: 'legal' },
  { id: 'benefits', name: 'Benefits Enrollment', category: 'hr' },
  { id: 'equipment', name: 'IT Equipment Request', category: 'it' },
  { id: 'building-access', name: 'Building Access Request', category: 'facilities' },
  { id: 'emergency-contact', name: 'Emergency Contact Form', category: 'hr' },
  { id: 'nda', name: 'Non-Disclosure Agreement', category: 'legal' },
  { id: 'direct-deposit', name: 'Direct Deposit Authorization', category: 'payroll' }
];

/**
 * Standard accounts to provision for new hires.
 */
const STANDARD_ACCOUNTS = [
  { id: 'email', name: 'Email', provider: 'Google Workspace', priority: 'critical' },
  { id: 'slack', name: 'Slack', provider: 'Slack', priority: 'critical' },
  { id: 'github', name: 'GitHub', provider: 'GitHub', priority: 'high' },
  { id: 'jira', name: 'Jira', provider: 'Atlassian', priority: 'high' },
  { id: 'vpn', name: 'VPN', provider: 'Internal', priority: 'medium' },
  { id: 'cloud', name: 'Cloud Platform', provider: 'AWS', priority: 'medium' }
];

/**
 * Create a new onboarding checklist for an employee.
 *
 * @param {Object} employee - Employee details.
 * @param {string} employee.name - Full name.
 * @param {string} employee.role - Job title.
 * @param {string} employee.department - Department name.
 * @param {string} employee.startDate - Start date (ISO string or YYYY-MM-DD).
 * @param {string} [employee.manager] - Manager name.
 * @returns {Object} Checklist with documents, accounts, and metadata.
 */
function createChecklist(employee) {
  if (!employee || typeof employee !== 'object') {
    throw new Error('Employee must be a non-null object');
  }
  if (!employee.name || typeof employee.name !== 'string') {
    throw new Error('Employee name is required');
  }
  if (!employee.role || typeof employee.role !== 'string') {
    throw new Error('Employee role is required');
  }

  const startDate = parseDate(employee.startDate);

  return {
    employee: {
      name: employee.name,
      role: employee.role,
      department: employee.department || 'unassigned',
      startDate: startDate.toISOString().split('T')[0],
      manager: employee.manager || null
    },
    documents: REQUIRED_DOCUMENTS.map(doc => ({
      ...doc,
      status: 'pending',
      dueDate: startDate.toISOString().split('T')[0]
    })),
    accounts: STANDARD_ACCOUNTS.map(acct => ({
      ...acct,
      status: 'not-started',
      credentials: null
    })),
    created: new Date().toISOString(),
    completionPct: 0
  };
}

/**
 * Parse a date string in various formats.
 *
 * @param {string} dateStr - Date string (ISO, YYYY-MM-DD, or natural language).
 * @returns {Date} Parsed date.
 */
function parseDate(dateStr) {
  if (!dateStr) return new Date();

  if (typeof dateStr !== 'string') {
    throw new Error('Date must be a string');
  }

  const trimmed = dateStr.trim();

  // ISO or YYYY-MM-DD
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;

  throw new Error(`Cannot parse date: "${trimmed}"`);
}

/**
 * Update a document status in the checklist.
 *
 * @param {Object} checklist - Checklist object from createChecklist().
 * @param {string} docId - Document ID (e.g. 'contract', 'tax-w4').
 * @param {string} status - New status ('pending', 'submitted', 'approved', 'rejected').
 * @returns {Object} Updated checklist.
 */
function updateDocumentStatus(checklist, docId, status) {
  const validStatuses = ['pending', 'submitted', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`);
  }

  const doc = checklist.documents.find(d => d.id === docId);
  if (!doc) {
    throw new Error(`Document "${docId}" not found. Available: ${checklist.documents.map(d => d.id).join(', ')}`);
  }

  doc.status = status;
  checklist.completionPct = calculateCompletion(checklist);
  return checklist;
}

/**
 * Update an account provisioning status.
 *
 * @param {Object} checklist - Checklist object from createChecklist().
 * @param {string} accountId - Account ID (e.g. 'email', 'slack').
 * @param {string} status - New status ('not-started', 'in-progress', 'provisioned', 'failed').
 * @param {Object} [credentials] - Optional credentials object.
 * @returns {Object} Updated checklist.
 */
function updateAccountStatus(checklist, accountId, status, credentials) {
  const validStatuses = ['not-started', 'in-progress', 'provisioned', 'failed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`);
  }

  const acct = checklist.accounts.find(a => a.id === accountId);
  if (!acct) {
    throw new Error(`Account "${accountId}" not found. Available: ${checklist.accounts.map(a => a.id).join(', ')}`);
  }

  acct.status = status;
  if (credentials) acct.credentials = credentials;
  checklist.completionPct = calculateCompletion(checklist);
  return checklist;
}

/**
 * Calculate overall completion percentage.
 *
 * @param {Object} checklist - Checklist object.
 * @returns {number} Completion percentage (0-100).
 */
function calculateCompletion(checklist) {
  const totalItems = checklist.documents.length + checklist.accounts.length;
  if (totalItems === 0) return 100;

  const completedDocs = checklist.documents.filter(d => d.status === 'approved').length;
  const completedAccounts = checklist.accounts.filter(a => a.status === 'provisioned').length;

  return Math.round(((completedDocs + completedAccounts) / totalItems) * 100);
}

/**
 * Get a summary of pending items grouped by category/priority.
 *
 * @param {Object} checklist - Checklist object.
 * @returns {Object} Summary with pendingDocs, pendingAccounts, and blockers.
 */
function getPendingSummary(checklist) {
  const pendingDocs = checklist.documents.filter(d => d.status !== 'approved');
  const pendingAccounts = checklist.accounts.filter(a => a.status !== 'provisioned');

  const blockers = [
    ...pendingDocs.filter(d => d.category === 'legal').map(d => ({ type: 'document', item: d })),
    ...pendingAccounts.filter(a => a.priority === 'critical').map(a => ({ type: 'account', item: a }))
  ];

  return {
    pendingDocs,
    pendingAccounts,
    blockers,
    totalPending: pendingDocs.length + pendingAccounts.length,
    completionPct: checklist.completionPct
  };
}

module.exports = {
  REQUIRED_DOCUMENTS,
  STANDARD_ACCOUNTS,
  createChecklist,
  parseDate,
  updateDocumentStatus,
  updateAccountStatus,
  calculateCompletion,
  getPendingSummary
};
