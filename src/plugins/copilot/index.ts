import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus, globFiles } from '../core/collect'

const OTEL_DIR = process.env.COPILOT_OTEL_DIR ?? path.join(os.homedir(), '.copilot', 'otel')

interface OtelAttributes {
  'gen_ai.usage.input_tokens'?: number
  'gen_ai.usage.output_tokens'?: number
  'gen_ai.usage.cache_read.input_tokens'?: number
  'gen_ai.usage.cache_read_input_tokens'?: number
  'gen_ai.usage.cache_write.input_tokens'?: number
  'gen_ai.usage.cache_creation.input_tokens'?: number
  'gen_ai.usage.cache_creation_input_tokens'?: number
  'gen_ai.response.model'?: string
  'gen_ai.request.model'?: string
  'gen_ai.conversation.id'?: string
  'copilot_chat.session_id'?: string
  'gen_ai.operation.name'?: string
  [key: string]: unknown
}

interface OtelRecord {
  type?: string
  name?: string
  traceId?: string
  spanId?: string
  startTime?: unknown
  attributes?: OtelAttributes
  timestamp?: number | string
}

function getSessionId(attrs: OtelAttributes): string {
  return (
    attrs['gen_ai.conversation.id'] ??
    attrs['copilot_chat.session_id'] ??
    'unknown'
  )
}

function getModel(attrs: OtelAttributes): string {
  return (
    attrs['gen_ai.response.model'] ??
    attrs['gen_ai.request.model'] ??
    'github-copilot'
  )
}

function getTimestamp(record: OtelRecord, fallback: number): number {
  const ts = record.timestamp
  if (typeof ts === 'number') return ts
  if (typeof ts === 'string') {
    const parsed = new Date(ts).getTime()
    if (!isNaN(parsed)) return parsed
  }
  const startTime = record.startTime
  if (Array.isArray(startTime) && typeof startTime[0] === 'number') {
    // OTEL [seconds, nanoseconds] tuple
    return (startTime[0] as number) * 1000 + Math.floor((startTime[1] as number) / 1_000_000)
  }
  return fallback
}

const COPILOT_PLUGIN: TokenPlugin = {
  id: 'copilot',
  name: 'GitHub Copilot',
  icon: 'GH',
  description: 'Tracks token usage from GitHub Copilot OTEL sessions (~/.copilot/otel)',
  dataPath: OTEL_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(OTEL_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    const files = await globFiles(OTEL_DIR, '.jsonl')
    if (files.length === 0) return emptyPluginData('copilot')

    // sessionId → accumulated summary; use Set for dedup by spanId
    const sessionMap = new Map<string, ConversationSummary & { lastTs: number }>()
    const seenSpans = new Set<string>()

    for (const file of files) {
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(file) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(file, 'utf-8') } catch { continue }

      const fallback = stat.mtime.getTime()

      for (const line of raw.split('\n')) {
        if (!line.trim()) continue
        let record: OtelRecord
        try { record = JSON.parse(line) as OtelRecord } catch { continue }

        const attrs = record.attributes
        if (!attrs) continue

        // Only process chat/inference spans with actual token data
        const op = attrs['gen_ai.operation.name']
        if (op && op !== 'chat' && op !== 'invoke_agent') continue

        const input = Math.max(0, (attrs['gen_ai.usage.input_tokens'] as number | undefined) ?? 0)
        const output = Math.max(0, (attrs['gen_ai.usage.output_tokens'] as number | undefined) ?? 0)
        if (input + output === 0) continue

        // Dedup by spanId to avoid counting the same span twice across files
        if (record.spanId) {
          if (seenSpans.has(record.spanId)) continue
          seenSpans.add(record.spanId)
        }

        const cacheRead = Math.max(0,
          ((attrs['gen_ai.usage.cache_read.input_tokens'] as number | undefined) ??
           (attrs['gen_ai.usage.cache_read_input_tokens'] as number | undefined) ?? 0)
        )
        const cacheWrite = Math.max(0,
          ((attrs['gen_ai.usage.cache_write.input_tokens'] as number | undefined) ??
           (attrs['gen_ai.usage.cache_creation.input_tokens'] as number | undefined) ??
           (attrs['gen_ai.usage.cache_creation_input_tokens'] as number | undefined) ?? 0)
        )

        const sessionId = getSessionId(attrs)
        const model = getModel(attrs)
        const ts = getTimestamp(record, fallback)
        const lastActivity = new Date(ts)
        const total = input + output + cacheRead + cacheWrite

        const existing = sessionMap.get(sessionId)
        if (existing) {
          existing.tokens.input += input
          existing.tokens.output += output
          existing.tokens.cacheRead += cacheRead
          existing.tokens.cacheWrite += cacheWrite
          existing.tokens.total += total
          existing.messageCount++
          if (ts > existing.lastTs) {
            existing.lastTs = ts
            existing.lastActivity = lastActivity
            existing.status = convStatus(lastActivity)
          }
        } else {
          sessionMap.set(sessionId, {
            id: sessionId,
            project: 'copilot',
            messageCount: 1,
            tokens: { input, output, cacheRead, cacheWrite, total },
            model,
            lastActivity,
            created: lastActivity,
            status: convStatus(lastActivity),
            lastTs: ts,
          })
        }
      }
    }

    const conversations = [...sessionMap.values()].map(({ lastTs: _lt, ...c }) => c)
    if (conversations.length === 0) return emptyPluginData('copilot')
    return buildPluginData('copilot', conversations, options)
  },
}

export default COPILOT_PLUGIN
