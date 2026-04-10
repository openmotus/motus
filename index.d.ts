/**
 * Motus — Department-based AI automation framework for Claude Code
 *
 * Type definitions for the Motus library API.
 */

// ============================================================
// Common types
// ============================================================

/** Valid agent type identifiers. */
export type AgentType = 'data-fetcher' | 'orchestrator' | 'specialist';

/** Known trigger types for workflows. Custom types are also allowed. */
export type TriggerType = 'manual' | 'scheduled' | 'event' | 'webhook' | 'cron' | (string & {});

/** Validation result returned by most validation methods. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Validation result with name suggestions. */
export interface NameValidationResult extends ValidationResult {
  suggestions?: string[];
}

// ============================================================
// Data types
// ============================================================

/** Department record stored in the registry. */
export interface Department {
  name: string;
  displayName: string;
  description: string;
  created: string;
  status: string;
  version: string;
  agents: string[];
  workflows: string[];
  integrations: Integration[];
  responsibilities: Responsibility[];
  updated?: string;
}

/** Agent record stored in the registry. */
export interface Agent {
  name: string;
  displayName: string;
  department: string;
  type: AgentType;
  description: string;
  tools: string[];
  model: string;
  script: string | null;
  created: string;
  version: string;
  usedInWorkflows: string[];
  updated?: string;
}

/** Workflow record stored in the registry. */
export interface Workflow {
  name: string;
  displayName: string;
  department: string;
  description: string;
  orchestrator: string;
  agents: string[];
  trigger: WorkflowTrigger;
  output: WorkflowOutput;
  estimatedDuration: string;
  created: string;
  version: string;
  lastRun: string | null;
  runCount: number;
  successRate: number;
  steps?: WorkflowStep[];
  updated?: string;
}

export interface WorkflowTrigger {
  type: TriggerType;
  schedule?: string;
  enabled?: boolean;
}

export interface WorkflowOutput {
  type: string;
  destination: string | null;
}

export interface WorkflowStep {
  group: number;
  parallel: boolean;
  agents: Array<{ name: string; prompt: string }>;
}

export interface Integration {
  name: string;
  type: 'oauth2' | 'api-key';
  envVars?: string[];
  setup?: string;
  setupUrl?: string;
}

export interface Responsibility {
  title: string;
  tasks: string[];
}

// ============================================================
// Input types for CRUD operations
// ============================================================

export interface AddDepartmentData {
  name: string;
  displayName: string;
  description: string;
  created?: string;
  status?: string;
  version?: string;
  integrations?: Integration[];
  responsibilities?: Responsibility[];
}

export interface AddAgentData {
  name: string;
  displayName: string;
  department: string;
  type: AgentType;
  description: string;
  tools?: string[];
  model?: string;
  script?: string | null;
  created?: string;
  version?: string;
}

export interface AddWorkflowData {
  name: string;
  displayName: string;
  department: string;
  description: string;
  orchestrator?: string;
  agents?: string[];
  trigger?: WorkflowTrigger;
  output?: WorkflowOutput;
  estimatedDuration?: string;
  created?: string;
  version?: string;
}

// ============================================================
// Result types
// ============================================================

export interface Statistics {
  departments: {
    total: number;
    active: number;
    inactive: number;
  };
  agents: {
    total: number;
    byType: Record<AgentType, number>;
    byDepartment: Record<string, number>;
  };
  workflows: {
    total: number;
    byType: Record<string, number>;
    byDepartment: Record<string, number>;
  };
  integrations: {
    total: number;
  };
}

export interface DepartmentSummary {
  department: Department;
  agents: Agent[];
  workflows: Workflow[];
  agentsByType: Record<AgentType, number>;
  workflowsByTrigger: Record<string, number>;
  integrationCount: number;
}

export interface SearchResults {
  departments: Department[];
  agents: Agent[];
  workflows: Workflow[];
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export type WorkflowHealthStatus = 'healthy' | 'degraded' | 'failing' | 'idle';

export interface WorkflowHealthEntry {
  name: string;
  department: string;
  status: WorkflowHealthStatus;
  runCount: number;
  successRate: number;
  lastRun: string | null;
  daysSinceLastRun: number | null;
  lastDurationMs: number | null;
  lastError: string | null;
}

export interface WorkflowHealthResult {
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    failing: number;
    idle: number;
  };
  workflows: WorkflowHealthEntry[];
}

export interface ExportData {
  departments: { departments: Record<string, Department>; metadata: object };
  agents: { agents: Record<string, Agent>; metadata: object };
  workflows: { workflows: Record<string, Workflow>; metadata: object };
  exported: string;
}

export interface TypeDetectionResult {
  type: AgentType;
  confidence: number;
  scores: Record<AgentType, number>;
}

export interface ParallelDetectionResult {
  shouldBeParallel: boolean;
  actionCount: number;
  confidence: number;
}

export interface TemplateInfo {
  name: string;
  type: string;
  path: string;
}

// ============================================================
// RegistryManager
// ============================================================

export class RegistryManager {
  basePath: string;
  loaded: boolean;

  constructor(basePath?: string);

  load(): Promise<boolean>;
  save(): Promise<boolean>;

  // Department operations
  addDepartment(data: AddDepartmentData): Promise<Department>;
  updateDepartment(name: string, updates: Partial<Department>): Promise<Department>;
  getDepartment(name: string): Department | null;
  listDepartments(filters?: { status?: string }): Promise<Department[]>;
  departmentExists(name: string): boolean;
  getDepartmentSummary(name: string): Promise<DepartmentSummary | null>;

  // Agent operations
  addAgent(data: AddAgentData): Promise<Agent>;
  updateAgent(name: string, updates: Partial<Agent>): Promise<Agent>;
  getAgent(name: string): Agent | null;
  listAgents(filters?: { department?: string; type?: string }): Promise<Agent[]>;
  listAgentsByDepartment(departmentName: string): Promise<Agent[]>;
  agentExists(name: string): boolean;

  // Workflow operations
  addWorkflow(data: AddWorkflowData): Promise<Workflow>;
  updateWorkflow(department: string, name: string, updates: Partial<Workflow>): Promise<Workflow>;
  getWorkflow(department: string, name: string): Workflow | null;
  listWorkflows(filters?: { department?: string; type?: string }): Promise<Workflow[]>;
  listWorkflowsByDepartment(departmentName: string): Promise<Workflow[]>;
  getWorkflowsByAgent(agentName: string): Promise<Workflow[]>;
  workflowExists(department: string, name: string): boolean;

  // Workflow run tracking
  recordWorkflowRun(department: string, name: string, result?: {
    success?: boolean;
    durationMs?: number;
    error?: string;
  }): Promise<Workflow>;

  // Remove operations
  removeDepartment(name: string, options?: { cascade?: boolean }): Promise<{
    department: Department;
    removedAgents: string[];
    removedWorkflows: string[];
  }>;
  removeAgent(name: string): Promise<{
    agent: Agent;
    updatedWorkflows: string[];
  }>;
  removeWorkflow(department: string, name: string): Promise<{
    workflow: Workflow;
    updatedAgents: string[];
  }>;

  // Statistics & queries
  getStatistics(): Promise<Statistics>;
  validate(): Promise<ValidationResult>;
  validateFiles(): Promise<FileValidationResult>;
  search(query: string): Promise<SearchResults>;
  getWorkflowHealth(filters?: { department?: string; status?: WorkflowHealthStatus }): Promise<WorkflowHealthResult>;

  // Utilities
  reset(): Promise<void>;
  export(): Promise<ExportData>;
  import(data: Partial<ExportData>): Promise<void>;
}

// ============================================================
// TemplateEngine
// ============================================================

export class TemplateEngine {
  templatesDir: string;

  constructor();

  loadTemplate(templateName: string): Promise<Function>;
  resolveTemplatePath(templateName: string): string;
  render(templateName: string, context?: Record<string, any>): Promise<string>;
  renderToFile(templateName: string, context: Record<string, any>, outputPath: string): Promise<string>;
  clearCache(): void;
  listTemplates(type?: string | null): Promise<TemplateInfo[]>;
  validateContext(templateName: string, context: Record<string, any>): Promise<ValidationResult>;
}

// ============================================================
// Validator
// ============================================================

export class Validator {
  patterns: Record<string, RegExp>;
  agentTypeKeywords: Record<AgentType, string[]>;

  constructor();

  // Name validation
  validateDepartmentName(name: string): ValidationResult;
  validateAgentName(name: string): NameValidationResult;
  validateWorkflowName(name: string): ValidationResult;
  validateEnvVarName(name: string): ValidationResult & { suggestions: string };

  // Type detection
  detectAgentType(description: string): TypeDetectionResult | null;
  detectParallelExecution(stepDescription: string): ParallelDetectionResult;

  // Content validation
  validateDescription(description: string, minLength?: number, maxLength?: number): ValidationResult;
  validateUrl(url: string): ValidationResult;
  validateSchedule(schedule: string): ValidationResult;
  validateFilePath(filePath: string): Promise<ValidationResult>;

  // Schema validation
  validateAgentContext(context: Record<string, any>): ValidationResult;
  validateDepartmentContext(context: Record<string, any>): ValidationResult;
  validateWorkflowContext(context: Record<string, any>): ValidationResult;

  // Suggestions
  suggestAgentName(name: string): string[];
  suggestTools(agentType: AgentType, needsApi?: boolean): string[];
  suggestEnvVarName(department: string, service: string): string;
}

// ============================================================
// DocGenerator
// ============================================================

export class DocGenerator {
  basePath: string;

  constructor(basePath?: string);

  generate(): Promise<void>;
  generateCommandsReference(): Promise<void>;
  generateDepartmentDocs(): Promise<void>;
  generateIntegrationDocs(integration: Integration, departmentName: string): string;
  updateClaudeMd(): Promise<boolean>;
}

// ============================================================
// OAuthRegistry
// ============================================================

export class OAuthRegistry {
  basePath: string;

  constructor(basePath?: string);

  load(): Promise<boolean>;
  addIntegration(config: Record<string, any>): Promise<void>;
  integrationExists(id: string): Promise<boolean>;
  listIntegrations(): Promise<Record<string, any>[]>;

  static getStandardConfig(name: string): Record<string, any> | null;
}
