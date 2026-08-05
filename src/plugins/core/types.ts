export interface TokenUsage {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  total: number
}

export interface ConversationSummary {
  id: string
  project: string
  messageCount: number
  tokens: TokenUsage
  model: string
  lastActivity: Date
  created: Date
  status: 'active' | 'recent' | 'inactive'
}

export interface DailyActivity {
  date: string  // ISO YYYY-MM-DD
  tokens: number
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  conversations: number
}

export interface ProjectStats {
  name: string
  tokens: number
  conversations: number
  costUSD: number
  lastActivity: Date
}

export interface ModelStats {
  model: string
  tokens: number
  tokensDetail: TokenUsage
  conversations: number
}

export interface DailyCost {
  date: string
  costUSD: number
}

export interface HourlyActivity {
  hour: number       // 0–23 local time
  dayOfWeek: number  // 0=Sun … 6=Sat
  tokens: number
}

// ─── Tool / Agent / Skill / MCP breakdown ───

export type ToolCategory = 'core' | 'agent' | 'skill' | 'mcp' | 'other'

export interface ToolCallStats {
  name: string
  callCount: number
  category: ToolCategory
}

export interface SubAgentStats {
  type: string        // subagent_type value (e.g. 'fork', 'code-reviewer', 'claude')
  invocations: number
  conversations: number
}

export interface SkillStats {
  name: string
  invocations: number
  conversations: number
}

export interface MCPServerStats {
  server: string      // e.g. 'claude_ai_Figma'
  callCount: number
  tools: string[]
}

export interface HookStats {
  event: string       // e.g. 'PostToolUse', 'PreToolUse', 'Stop'
  callCount: number
}

// ─── Summary ───

export interface PluginSummary {
  totalTokens: TokenUsage
  totalCostUSD: number
  totalConversations: number
  activeConversations: number
  topProjects: ProjectStats[]
  topModels: ModelStats[]
  dailyActivity: DailyActivity[]
  dailyCost: DailyCost[]
  lastActivity: Date | null
  conversations: ConversationSummary[]
  // extended breakdown
  topTools: ToolCallStats[]
  subAgents: SubAgentStats[]
  skills: SkillStats[]
  mcpServers: MCPServerStats[]
  hooks: HookStats[]
  hourlyActivity: HourlyActivity[]
  cacheRoiUSD: number
  dailyCostWithoutCache: DailyCost[]
  modelShareByDay: { date: string; model: string; tokens: number }[]
}

export interface CollectOptions {
  days?: number
  limit?: number
}

export interface PluginData {
  pluginId: string
  summary: PluginSummary
  collectedAt: string
}

export interface DashboardSection {
  id: string
  title: string
  width: 'full' | 'half' | 'third'
}

export interface PluginCapabilities {
  /** Plugin can report cost in USD (has a pricing match for its models). */
  cost: boolean
  /** Plugin reports a model breakdown (`topModels` is populated). */
  models: boolean
  /** Plugin reports per-project stats (`topProjects` is populated). */
  projects: boolean
  /** Plugin reports individual conversations (`conversations` is populated). */
  sessions: boolean
  /** Plugin can report provider quota / rate-limit data. */
  rateLimit: boolean
}

export type AvailabilityReason = 'path_missing' | 'parse_error' | 'placeholder' | 'not_installed'

export interface AvailabilityResult {
  available: boolean
  reason?: AvailabilityReason
  detail?: string
}

export interface TokenPlugin {
  readonly id: string
  readonly name: string
  readonly icon: string
  readonly description: string
  readonly dataPath: string
  /**
   * Declares what this plugin can report.
   * Optional on the raw plugin object — the registry always fills in sensible
   * defaults, so consumers can treat it as always present after registration.
   */
  readonly capabilities?: PluginCapabilities
  isAvailable: () => Promise<AvailabilityResult>
  collect: (options?: CollectOptions) => Promise<PluginData>
  getDashboardSections?: () => DashboardSection[]
}

export interface PluginStatus {
  id: string
  name: string
  icon: string
  description: string
  dataPath: string
  available: boolean
  unavailabilityReason?: AvailabilityReason
}
