import { registry } from '@/plugins'
import type { TokenUsage } from '@/plugins/core/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const days = Number(searchParams.get('days') ?? '30')

  const plugins = registry.getAll()
  const available = await Promise.all(plugins.map((p) => p.isAvailable().catch(() => false)))
  const activePlugins = plugins.filter((_, i) => available[i])

  const results = await Promise.allSettled(
    activePlugins.map((p) => p.collect({ days }))
  )

  const aggregated: TokenUsage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
  let totalConversations = 0
  let lastActivity: Date | null = null

  const perPlugin: Record<string, {
    totalTokens: TokenUsage
    totalConversations: number
    lastActivity: Date | null
    available: boolean
  }> = {}

  for (let i = 0; i < activePlugins.length; i++) {
    const result = results[i]
    const plugin = activePlugins[i]

    if (result.status === 'fulfilled') {
      const data = result.value
      aggregated.input += data.summary.totalTokens.input
      aggregated.output += data.summary.totalTokens.output
      aggregated.cacheRead += data.summary.totalTokens.cacheRead
      aggregated.cacheWrite += data.summary.totalTokens.cacheWrite
      aggregated.total += data.summary.totalTokens.total
      totalConversations += data.summary.totalConversations

      const pLast = data.summary.lastActivity
        ? new Date(data.summary.lastActivity)
        : null

      if (pLast && (!lastActivity || pLast > lastActivity)) {
        lastActivity = pLast
      }

      perPlugin[plugin.id] = {
        totalTokens: data.summary.totalTokens,
        totalConversations: data.summary.totalConversations,
        lastActivity: pLast,
        available: true,
      }
    } else {
      perPlugin[plugin.id] = {
        totalTokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        totalConversations: 0,
        lastActivity: null,
        available: false,
      }
    }
  }

  // Add unavailable plugins
  const unavailablePlugins = plugins.filter((_, i) => !available[i])
  for (const plugin of unavailablePlugins) {
    perPlugin[plugin.id] = {
      totalTokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
      totalConversations: 0,
      lastActivity: null,
      available: false,
    }
  }

  return Response.json({
    aggregated,
    totalConversations,
    lastActivity,
    perPlugin,
    days,
  })
}
