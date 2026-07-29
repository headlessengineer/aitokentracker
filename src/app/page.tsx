import { registry } from '@/plugins'
import type { PluginStatus, TokenUsage, DailyActivity } from '@/plugins/core/types'
import { Shell } from '@/components/layout/Shell'
import { KPICard } from '@/components/dashboard/KPICard'
import { PluginCard } from '@/components/dashboard/PluginCard'
import { Section } from '@/components/dashboard/Section'
import { TokenBreakdown } from '@/components/dashboard/TokenBreakdown'
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap'
import { TimelineChart } from '@/components/dashboard/TimelineChart'
import { CostTimeline } from '@/components/dashboard/CostTimeline'
import { DashboardGrid, type WidgetDef } from '@/components/dashboard/DashboardGrid'
import { ControlBar } from '@/components/ui/ControlBar'
import { RefreshButton } from '@/components/ui/RefreshButton'
import { NotificationEvaluator } from '@/components/dashboard/NotificationEvaluator'
import { formatTokens, formatRelativeTime, formatNumber, formatCost } from '@/lib/format'
import type { DailyCost } from '@/plugins/core/types'
import styles from './page.module.css'

const VALID_DAYS = [1, 7, 15, 30, 60, 90] as const
const DEFAULT_DAYS = 30

function parseDays(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw ?? '')
  return VALID_DAYS.includes(n as (typeof VALID_DAYS)[number]) ? n : DEFAULT_DAYS
}

interface OverviewData {
  statuses: PluginStatus[]
  aggregated: TokenUsage
  totalCostUSD: number
  dailyCost: DailyCost[]
  totalConversations: number
  lastActivity: Date | null
  dailyActivity: DailyActivity[]
  perPlugin: Record<string, { tokens: number; conversations: number; costUSD: number }>
}

async function fetchOverviewData(days: number): Promise<OverviewData> {
  const plugins = registry.getAll()
  const statuses: PluginStatus[] = await Promise.all(
    plugins.map(async (p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      description: p.description,
      dataPath: p.dataPath,
      available: await p.isAvailable().catch(() => false),
    }))
  )

  const availablePlugins = plugins.filter((_, i) => statuses[i].available)
  const results = await Promise.allSettled(
    availablePlugins.map((p) => p.collect({ days }))
  )

  const aggregated: TokenUsage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
  let totalCostUSD = 0
  let totalConversations = 0
  let lastActivity: Date | null = null
  const mergedActivity = new Map<string, DailyActivity>()
  const mergedCost = new Map<string, number>()
  const perPlugin: Record<string, { tokens: number; conversations: number; costUSD: number }> = {}

  results.forEach((result, i) => {
    const plugin = availablePlugins[i]
    if (result.status === 'fulfilled') {
      const data = result.value
      aggregated.input += data.summary.totalTokens.input
      aggregated.output += data.summary.totalTokens.output
      aggregated.cacheRead += data.summary.totalTokens.cacheRead
      aggregated.cacheWrite += data.summary.totalTokens.cacheWrite
      aggregated.total += data.summary.totalTokens.total
      totalCostUSD += data.summary.totalCostUSD
      totalConversations += data.summary.totalConversations

      const pLast = data.summary.lastActivity ? new Date(data.summary.lastActivity) : null
      if (pLast && (!lastActivity || pLast > lastActivity)) lastActivity = pLast

      for (const day of data.summary.dailyActivity) {
        const existing = mergedActivity.get(day.date)
        if (existing) {
          existing.tokens += day.tokens
          existing.conversations += day.conversations
        } else {
          mergedActivity.set(day.date, { ...day })
        }
      }

      for (const dc of data.summary.dailyCost) {
        mergedCost.set(dc.date, (mergedCost.get(dc.date) ?? 0) + dc.costUSD)
      }

      perPlugin[plugin.id] = {
        tokens: data.summary.totalTokens.total,
        conversations: data.summary.totalConversations,
        costUSD: data.summary.totalCostUSD,
      }
    } else {
      perPlugin[plugin.id] = { tokens: 0, conversations: 0, costUSD: 0 }
    }
  })

  const dailyActivity = Array.from(mergedActivity.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  )
  const dailyCost = Array.from(mergedCost.entries())
    .map(([date, costUSD]) => ({ date, costUSD }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return { statuses, aggregated, totalCostUSD, dailyCost, totalConversations, lastActivity, dailyActivity, perPlugin }
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const days = parseDays(sp.days)

  const { statuses, aggregated, totalCostUSD, dailyCost, totalConversations, lastActivity, dailyActivity, perPlugin } =
    await fetchOverviewData(days)

  const availableCount = statuses.filter((s) => s.available).length
  const today = new Date().toISOString().split('T')[0]
  const todayTokens = dailyActivity.find((d) => d.date === today)?.tokens ?? 0

  return (
    <Shell plugins={statuses} selectedDays={days}>
      <NotificationEvaluator todayTokens={todayTokens} />
      <ControlBar selectedDays={days} action={<RefreshButton />} />

      {/* KPIs */}
      <Section title="Overview">
        <div className={styles.kpiGrid}>
          <KPICard
            label="Total tokens"
            value={formatTokens(aggregated.total)}
            sub={`Last ${days} day${days === 1 ? '' : 's'} across all tools`}
            accent
          />
          <KPICard
            label="Conversations"
            value={formatNumber(totalConversations)}
            sub="Across all active plugins"
          />
          <KPICard
            label="Active tools"
            value={`${availableCount} / ${statuses.length}`}
            sub="Tools configured and available"
          />
          <KPICard
            label="Last activity"
            value={formatRelativeTime(lastActivity)}
            sub={lastActivity ? lastActivity.toLocaleDateString() : '—'}
          />
          <KPICard
            label="Total cost"
            value={totalCostUSD > 0 ? formatCost(totalCostUSD) : 'Not tracked'}
            sub={totalCostUSD > 0 ? `Last ${days} day${days === 1 ? '' : 's'} across all tools` : 'No cost data available yet'}
          />
        </div>
      </Section>

      {/* Draggable / resizable widget grid */}
      {(() => {
        const hasTokens = aggregated.total > 0
        const hasCost = totalCostUSD > 0
        const overviewWidgets: WidgetDef[] = [
          ...(hasTokens ? [{
            id: 'tokenBreakdown',
            defaultPos: { x: 0, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
            content: (
              <Section title="Token breakdown">
                <TokenBreakdown tokens={aggregated} />
              </Section>
            ),
          }] : []),
          ...(hasTokens ? [{
            id: 'timeline',
            defaultPos: { x: 4, y: 0, w: 8, h: 6, minW: 4, minH: 3 },
            content: (
              <Section title={`Daily usage — last ${days} day${days === 1 ? '' : 's'}`}>
                <TimelineChart activity={dailyActivity} days={days} />
              </Section>
            ),
          }] : []),
          ...(hasCost ? [{
            id: 'costTimeline',
            defaultPos: { x: 0, y: 100, w: 12, h: 4, minW: 4, minH: 3 },
            content: (
              <Section title={`Daily cost — last ${days} day${days === 1 ? '' : 's'}`}>
                <CostTimeline dailyCost={dailyCost} days={days} />
              </Section>
            ),
          }] : []),
          ...(dailyActivity.length > 0 ? [{
            id: 'heatmap',
            defaultPos: { x: 0, y: 200, w: 12, h: 5, minW: 6, minH: 4 },
            content: (
              <Section title={`Activity — ${new Date().getFullYear()}`}>
                <ActivityHeatmap activity={dailyActivity} />
              </Section>
            ),
          }] : []),
        ]
        return overviewWidgets.length > 0 ? (
          <DashboardGrid widgets={overviewWidgets} pluginId="overview" />
        ) : null
      })()}

      {/* Tool cards — static */}
      <Section title="AI Tools">
        <div className={styles.pluginGrid}>
          {statuses.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              totalTokens={perPlugin[plugin.id]?.tokens}
              conversations={perPlugin[plugin.id]?.conversations}
              costUSD={perPlugin[plugin.id]?.costUSD}
              href={`/${plugin.id}`}
            />
          ))}
        </div>
      </Section>
    </Shell>
  )
}
