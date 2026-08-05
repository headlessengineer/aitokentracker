import fs from 'fs'
import path from 'path'
import os from 'os'
import type {
  TokenPlugin,
  PluginData,
  CollectOptions,
  TokenUsage,
  ConversationSummary,
  DailyActivity,
  DailyCost,
  HourlyActivity,
  ProjectStats,
  ModelStats,
  ToolCallStats,
  SubAgentStats,
  SkillStats,
  MCPServerStats,
  HookStats,
  ToolCategory,
  AvailabilityResult,
} from '../core/types'
import { collectConversations, collectHookDefinitions, type ContentItem } from './collector'
import { costForUsage, cacheSavingForUsage } from './pricing'
import { availResult } from '../core/collect'
import { sinceDate } from '../../lib/since'

function emptyUsage(): TokenUsage {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
}

function toolCategory(name: string): ToolCategory {
  if (name === 'Agent') return 'agent'
  if (name === 'Skill') return 'skill'
  if (name.startsWith('mcp__')) return 'mcp'
  const CORE = new Set([
    'Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob', 'LS',
    'WebFetch', 'WebSearch', 'TodoRead', 'TodoWrite',
    'NotebookRead', 'NotebookEdit',
    'TaskCreate', 'TaskUpdate', 'TaskGet', 'TaskList', 'TaskOutput', 'TaskStop',
    'ToolSearch', 'SendMessage', 'AskUserQuestion',
    'Monitor', 'CronCreate', 'CronDelete', 'CronList',
    'RemoteTrigger', 'PushNotification', 'ScheduleWakeup',
    'EnterPlanMode', 'ExitPlanMode', 'EnterWorktree', 'ExitWorktree',
    'ReportFindings', 'ShareOnboardingGuide',
  ])
  return CORE.has(name) ? 'core' : 'other'
}

const CLAUDE_PLUGIN: TokenPlugin = {
  id: 'claude',
  name: 'Claude Code',
  icon: 'C',
  description: 'Tracks token usage from Claude Code conversations stored in ~/.claude/projects',
  dataPath: path.join(os.homedir(), '.claude', 'projects'),
  capabilities: { cost: true, models: true, projects: true, sessions: true, rateLimit: false },

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(fs.existsSync(this.dataPath))
  },

  async collect(options: CollectOptions = {}): Promise<PluginData> {
    const { days = 30 } = options
    const since = sinceDate(days)

    const rawConversations = collectConversations()

    const aggregatedTokens = emptyUsage()
    let totalCostUSD = 0
    let totalCacheRoiUSD = 0
    const projectMap = new Map<string, ProjectStats>()
    const modelMap = new Map<string, ModelStats>()
    const activityMap = new Map<string, DailyActivity>()
    const costMap = new Map<string, number>()
    const savingMap = new Map<string, number>()
    const toolCountMap = new Map<string, number>()
    const subAgentMap = new Map<string, { invocations: number; conversations: Set<string> }>()
    const skillMap = new Map<string, { invocations: number; conversations: Set<string> }>()
    const mcpMap = new Map<string, { callCount: number; tools: Set<string> }>()
    const hourlyMap = new Map<string, { hour: number; dayOfWeek: number; tokens: number }>()
    const modelDayMap = new Map<string, { date: string; model: string; tokens: number }>()
    const conversations: ConversationSummary[] = []

    const now = Date.now()
    const ACTIVE_MS = 5 * 60 * 1000
    const RECENT_MS = 60 * 60 * 1000

    // Claude Code logs the same assistant message more than once — sub-agent
    // turns appear both inline (isSidechain) in the parent transcript and again
    // in the separate subagents/*.jsonl files, and resumed sessions re-log prior
    // turns. Counting every copy roughly doubles tokens and cost, so dedupe by
    // message.id across the whole collection (matches how ccusage counts).
    const seenMessageIds = new Set<string>()

    for (const conv of rawConversations) {
      if (conv.lastModified < since) continue

      const convTokens = emptyUsage()
      let convCostUSD = 0
      let convSavingUSD = 0
      let primaryModel = ''
      let messageCount = 0

      for (const entry of conv.entries) {
        if (entry.type !== 'assistant' || !entry.message) continue

        // Skip duplicate log lines (same assistant message id seen already)
        const msgId = entry.message.id
        if (msgId) {
          if (seenMessageIds.has(msgId)) continue
          seenMessageIds.add(msgId)
        }

        // Token usage
        const u = entry.message.usage
        if (u) {
          const input = u.input_tokens ?? 0
          const output = u.output_tokens ?? 0
          const cacheWrite = u.cache_creation_input_tokens ?? 0
          const cacheRead = u.cache_read_input_tokens ?? 0
          convTokens.input += input
          convTokens.output += output
          convTokens.cacheWrite += cacheWrite
          convTokens.cacheRead += cacheRead
          convTokens.total += input + output + cacheWrite + cacheRead
          messageCount++

          // Cost is not recorded in the JSONL — estimate it from usage x
          // per-model pricing (see ./pricing.ts).
          convCostUSD += costForUsage(entry.message.model ?? '', u)
          convSavingUSD += cacheSavingForUsage(entry.message.model ?? '', u)

          // Hourly activity — use entry timestamp for accurate time-of-day
          if (entry.timestamp) {
            const entryDate = new Date(entry.timestamp)
            if (entryDate >= since) {
              const hour = entryDate.getHours()
              const dayOfWeek = entryDate.getDay()
              const key = `${hour}-${dayOfWeek}`
              const entryTotal = input + output + cacheWrite + cacheRead
              const existing = hourlyMap.get(key)
              if (existing) {
                existing.tokens += entryTotal
              } else {
                hourlyMap.set(key, { hour, dayOfWeek, tokens: entryTotal })
              }
            }
          }
        }

        if (entry.message.model && !primaryModel) {
          primaryModel = entry.message.model
        }

        // Tool use extraction
        const content = entry.message.content
        if (!Array.isArray(content)) continue

        for (const item of content as ContentItem[]) {
          if (item.type !== 'tool_use' || !item.name) continue

          const toolName = item.name
          toolCountMap.set(toolName, (toolCountMap.get(toolName) ?? 0) + 1)

          // Sub-agents
          if (toolName === 'Agent') {
            const input = item.input ?? {}
            const subtype = (input.subagent_type as string | undefined) ?? 'unknown'
            const existing = subAgentMap.get(subtype)
            if (existing) {
              existing.invocations++
              existing.conversations.add(conv.id)
            } else {
              subAgentMap.set(subtype, { invocations: 1, conversations: new Set([conv.id]) })
            }
          }

          // Skills
          if (toolName === 'Skill') {
            const input = item.input ?? {}
            const skillName = (input.skill as string | undefined) ?? 'unknown'
            const existing = skillMap.get(skillName)
            if (existing) {
              existing.invocations++
              existing.conversations.add(conv.id)
            } else {
              skillMap.set(skillName, { invocations: 1, conversations: new Set([conv.id]) })
            }
          }

          // MCP tools
          if (toolName.startsWith('mcp__')) {
            const parts = toolName.split('__')
            const server = parts.slice(0, -1).join('__')
            const tool = parts[parts.length - 1] ?? toolName
            const existing = mcpMap.get(server)
            if (existing) {
              existing.callCount++
              existing.tools.add(tool)
            } else {
              mcpMap.set(server, { callCount: 1, tools: new Set([tool]) })
            }
          }
        }
      }

      if (convTokens.total === 0 && messageCount === 0) continue

      // Aggregate totals
      aggregatedTokens.input += convTokens.input
      aggregatedTokens.output += convTokens.output
      aggregatedTokens.cacheRead += convTokens.cacheRead
      aggregatedTokens.cacheWrite += convTokens.cacheWrite
      aggregatedTokens.total += convTokens.total
      totalCostUSD += convCostUSD
      totalCacheRoiUSD += convSavingUSD

      if (conv.lastModified >= since) {
        const ck = conv.lastModified.toISOString().split('T')[0]
        costMap.set(ck, (costMap.get(ck) ?? 0) + convCostUSD)
        savingMap.set(ck, (savingMap.get(ck) ?? 0) + convSavingUSD)
      }

      // Project
      const proj = projectMap.get(conv.project)
      if (proj) {
        proj.tokens += convTokens.total
        proj.conversations++
        proj.costUSD += convCostUSD
        if (conv.lastModified > proj.lastActivity) proj.lastActivity = conv.lastModified
      } else {
        projectMap.set(conv.project, {
          name: conv.project,
          tokens: convTokens.total,
          conversations: 1,
          costUSD: convCostUSD,
          lastActivity: conv.lastModified,
        })
      }

      // Model
      if (primaryModel) {
        const model = modelMap.get(primaryModel)
        if (model) {
          model.tokens += convTokens.total
          model.tokensDetail.input += convTokens.input
          model.tokensDetail.output += convTokens.output
          model.tokensDetail.cacheRead += convTokens.cacheRead
          model.tokensDetail.cacheWrite += convTokens.cacheWrite
          model.tokensDetail.total += convTokens.total
          model.conversations++
        } else {
          modelMap.set(primaryModel, {
            model: primaryModel,
            tokens: convTokens.total,
            tokensDetail: { ...convTokens },
            conversations: 1,
          })
        }
      }

      // Daily activity + model-by-day — only within selected window
      if (conv.lastModified >= since) {
        const dateKey = conv.lastModified.toISOString().split('T')[0]

        if (primaryModel && convTokens.total > 0) {
          const mdKey = `${primaryModel}:${dateKey}`
          const existing = modelDayMap.get(mdKey)
          if (existing) {
            existing.tokens += convTokens.total
          } else {
            modelDayMap.set(mdKey, { date: dateKey, model: primaryModel, tokens: convTokens.total })
          }
        }

        const day = activityMap.get(dateKey)
        if (day) {
          day.tokens += convTokens.total
          day.input += convTokens.input
          day.output += convTokens.output
          day.cacheRead += convTokens.cacheRead
          day.cacheWrite += convTokens.cacheWrite
          day.conversations++
        } else {
          activityMap.set(dateKey, {
            date: dateKey,
            tokens: convTokens.total,
            input: convTokens.input,
            output: convTokens.output,
            cacheRead: convTokens.cacheRead,
            cacheWrite: convTokens.cacheWrite,
            conversations: 1,
          })
        }
      }

      const msSince = now - conv.lastModified.getTime()
      const status: ConversationSummary['status'] =
        msSince < ACTIVE_MS ? 'active' : msSince < RECENT_MS ? 'recent' : 'inactive'

      conversations.push({
        id: conv.id,
        project: conv.project,
        messageCount,
        tokens: convTokens,
        model: primaryModel,
        lastActivity: conv.lastModified,
        created: conv.created,
        status,
      })
    }

    conversations.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())

    // Build flat tool stats
    const topTools: ToolCallStats[] = Array.from(toolCountMap.entries())
      .map(([name, callCount]) => ({ name, callCount, category: toolCategory(name) }))
      .sort((a, b) => b.callCount - a.callCount)
      .slice(0, 20)

    const subAgents: SubAgentStats[] = Array.from(subAgentMap.entries())
      .map(([type, data]) => ({
        type,
        invocations: data.invocations,
        conversations: data.conversations.size,
      }))
      .sort((a, b) => b.invocations - a.invocations)

    const skills: SkillStats[] = Array.from(skillMap.entries())
      .map(([name, data]) => ({
        name,
        invocations: data.invocations,
        conversations: data.conversations.size,
      }))
      .sort((a, b) => b.invocations - a.invocations)

    const mcpServers: MCPServerStats[] = Array.from(mcpMap.entries())
      .map(([server, data]) => ({
        server,
        callCount: data.callCount,
        tools: Array.from(data.tools),
      }))
      .sort((a, b) => b.callCount - a.callCount)

    // Hook stats from settings
    const toolCountsObj = Object.fromEntries(toolCountMap)
    const hookDefs = collectHookDefinitions(toolCountsObj)
    const hooks: HookStats[] = hookDefs.map((def) => ({
      event: def.event,
      callCount: def.approxCallCount,
    }))

    const dailyCost: DailyCost[] = Array.from(costMap.entries())
      .map(([date, costUSD]) => ({ date, costUSD }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const dailyCostWithoutCache: DailyCost[] = Array.from(costMap.entries())
      .map(([date, costUSD]) => ({ date, costUSD: costUSD + (savingMap.get(date) ?? 0) }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      pluginId: 'claude',
      summary: {
        totalTokens: aggregatedTokens,
        totalCostUSD,
        totalConversations: conversations.length,
        activeConversations: conversations.filter((c) => c.status === 'active').length,
        topProjects: Array.from(projectMap.values())
          .sort((a, b) => b.tokens - a.tokens)
          .slice(0, 10),
        topModels: Array.from(modelMap.values())
          .sort((a, b) => b.tokens - a.tokens),
        dailyActivity: Array.from(activityMap.values())
          .sort((a, b) => a.date.localeCompare(b.date)),
        dailyCost,
        lastActivity: conversations.length > 0 ? conversations[0].lastActivity : null,
        conversations: conversations.slice(0, options.limit ?? 100),
        topTools,
        subAgents,
        skills,
        mcpServers,
        hooks,
        hourlyActivity: Array.from(hourlyMap.values()) as HourlyActivity[],
        cacheRoiUSD: totalCacheRoiUSD,
        dailyCostWithoutCache,
        modelShareByDay: Array.from(modelDayMap.values()),
      },
      collectedAt: new Date().toISOString(),
    }
  },
}

export default CLAUDE_PLUGIN
