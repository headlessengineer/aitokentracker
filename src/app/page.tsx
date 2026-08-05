import { registry } from '@/plugins'
import type { PluginStatus, TokenUsage, DailyActivity, AvailabilityResult } from '@/plugins/core/types'
import { Shell } from '@/components/layout/Shell'
import { KPICard } from '@/components/dashboard/KPICard'
import { PluginCard } from '@/components/dashboard/PluginCard'
import { Section } from '@/components/dashboard/Section'
import { TokenBreakdown } from '@/components/dashboard/TokenBreakdown'
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap'
import { CostTimeline } from '@/components/dashboard/CostTimeline'
import { LimitStatus } from '@/components/dashboard/LimitStatus'
import { AggregatedTimeline } from '@/components/dashboard/AggregatedTimeline'
import { HourlyHeatmap } from '@/components/dashboard/HourlyHeatmap'
import { UnifiedProjectTable } from '@/components/dashboard/UnifiedProjectTable'
import { DashboardGrid, type WidgetDef } from '@/components/dashboard/DashboardGrid'
import { ControlBar } from '@/components/ui/ControlBar'
import { RefreshButton } from '@/components/ui/RefreshButton'
import { DigestToggle } from '@/components/ui/DigestToggle'
import { ExportButton } from '@/components/ui/ExportButton'
import { LiveUpdater } from '@/components/ui/LiveUpdater'
import { NotificationEvaluator } from '@/components/dashboard/NotificationEvaluator'
import { readAllLimits } from '@/lib/limits'
import { formatTokens, formatRelativeTime, formatNumber, formatCost } from '@/lib/format'
import type { DailyCost, HourlyActivity } from '@/plugins/core/types'
import styles from './page.module.css'

const VALID_DAYS = [0, 1, 7, 15, 30, 60, 90, 9999] as const
const DEFAULT_DAYS = 30

function parseDays(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw ?? '')
  return VALID_DAYS.includes(n as (typeof VALID_DAYS)[number]) ? n : DEFAULT_DAYS
}

function dayLabel(days: number): string {
  if (days === 0) return 'Today'
  if (days >= 9999) return 'All time'
  return `Last ${days} day${days === 1 ? '' : 's'}`
}

interface MonthForecast {
  forecastUSD: number
  avgPerDay: number
  daysLeft: number
}

function computeMonthForecast(dailyCost: DailyCost[]): MonthForecast | null {
  if (dailyCost.length === 0) return null

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const currentMonth = todayStr.slice(0, 7)

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft = daysInMonth - now.getDate()

  const monthToDate = dailyCost
    .filter((d) => d.date.startsWith(currentMonth))
    .reduce((s, d) => s + d.costUSD, 0)

  // Last 7 completed days (exclude today since it's still accumulating)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  const trailing = dailyCost.filter((d) => d.date >= sevenDaysAgoStr && d.date < todayStr)
  if (trailing.length === 0) return null

  // Divide by 7 (not trailing.length) so zero-cost days lower the average naturally
  const avgPerDay = trailing.reduce((s, d) => s + d.costUSD, 0) / 7
  const forecastUSD = monthToDate + avgPerDay * daysLeft

  return { forecastUSD, avgPerDay, daysLeft }
}

export interface PluginActivitySeries {
  pluginId: string
  name: string
  totalTokens: number
  activity: DailyActivity[]
}

export interface UnifiedProject {
  name: string
  totalTokens: number
  totalConversations: number
  totalCostUSD: number
  lastActivity: Date
  byPlugin: { pluginId: string; pluginName: string; tokens: number; conversations: number; costUSD: number }[]
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
  pluginSeries: PluginActivitySeries[]
  hourlyActivity: HourlyActivity[]
  unifiedProjects: UnifiedProject[]
}

async function fetchOverviewData(days: number): Promise<OverviewData> {
  const plugins = registry.getAll()
  const statuses: PluginStatus[] = await Promise.all(
    plugins.map(async (p) => {
      const ar = await p.isAvailable().catch((): AvailabilityResult => ({ available: false, reason: 'parse_error' }))
      return {
        id: p.id,
        name: p.name,
        icon: p.icon,
        description: p.description,
        dataPath: p.dataPath,
        available: ar.available,
        unavailabilityReason: ar.reason,
      }
    })
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
  const pluginSeries: PluginActivitySeries[] = []
  const mergedHourly = new Map<string, HourlyActivity>()
  const unifiedProjectMap = new Map<string, UnifiedProject>()

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

      if (data.summary.totalTokens.total > 0 && data.summary.dailyActivity.length > 0) {
        pluginSeries.push({
          pluginId: plugin.id,
          name: plugin.name,
          totalTokens: data.summary.totalTokens.total,
          activity: data.summary.dailyActivity,
        })
      }

      for (const h of data.summary.hourlyActivity) {
        const key = `${h.hour}-${h.dayOfWeek}`
        const existing = mergedHourly.get(key)
        if (existing) {
          existing.tokens += h.tokens
        } else {
          mergedHourly.set(key, { ...h })
        }
      }

      for (const proj of data.summary.topProjects) {
        const existing = unifiedProjectMap.get(proj.name)
        if (existing) {
          existing.totalTokens += proj.tokens
          existing.totalConversations += proj.conversations
          existing.totalCostUSD += proj.costUSD
          if (proj.lastActivity > existing.lastActivity) existing.lastActivity = proj.lastActivity
          existing.byPlugin.push({ pluginId: plugin.id, pluginName: plugin.name, tokens: proj.tokens, conversations: proj.conversations, costUSD: proj.costUSD })
        } else {
          unifiedProjectMap.set(proj.name, {
            name: proj.name,
            totalTokens: proj.tokens,
            totalConversations: proj.conversations,
            totalCostUSD: proj.costUSD,
            lastActivity: proj.lastActivity,
            byPlugin: [{ pluginId: plugin.id, pluginName: plugin.name, tokens: proj.tokens, conversations: proj.conversations, costUSD: proj.costUSD }],
          })
        }
      }
    } else {
      perPlugin[plugin.id] = { tokens: 0, conversations: 0, costUSD: 0 }
    }
  })

  // Sort by total tokens descending so the most active tool occupies the bottom of the stack
  pluginSeries.sort((a, b) => b.totalTokens - a.totalTokens)

  const dailyActivity = Array.from(mergedActivity.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  )
  const dailyCost = Array.from(mergedCost.entries())
    .map(([date, costUSD]) => ({ date, costUSD }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const hourlyActivity = Array.from(mergedHourly.values())
  const unifiedProjects = Array.from(unifiedProjectMap.values())
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, 20)

  return { statuses, aggregated, totalCostUSD, dailyCost, totalConversations, lastActivity, dailyActivity, perPlugin, pluginSeries, hourlyActivity, unifiedProjects }
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const days = parseDays(sp.days)
  const projectFilter = typeof sp.project === 'string' ? sp.project : undefined

  const [
    { statuses, aggregated, totalCostUSD, dailyCost, totalConversations, lastActivity, dailyActivity, perPlugin, pluginSeries, hourlyActivity, unifiedProjects },
    providerLimits,
  ] = await Promise.all([fetchOverviewData(days), readAllLimits()])

  const availableCount = statuses.filter((s) => s.available).length
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
  const todayTokens = dailyActivity.find((d) => d.date === today)?.tokens ?? 0
  const yesterdayTokens = dailyActivity.find((d) => d.date === yesterday)?.tokens ?? 0
  const yesterdayCostUSD = dailyCost.find((d) => d.date === yesterday)?.costUSD ?? 0
  const topToolNameYesterday = pluginSeries
    .map((s) => ({ name: s.name, tokens: s.activity.find((a) => a.date === yesterday)?.tokens ?? 0 }))
    .sort((a, b) => b.tokens - a.tokens)[0]?.name ?? ''
  const forecast = totalCostUSD > 0 ? computeMonthForecast(dailyCost) : null

  return (
    <Shell plugins={statuses} selectedDays={days}>
      <LiveUpdater />
      <NotificationEvaluator
        todayTokens={todayTokens}
        providerLimits={providerLimits}
        yesterdayTokens={yesterdayTokens}
        yesterdayCostUSD={yesterdayCostUSD}
        topToolNameYesterday={topToolNameYesterday}
      />
      <ControlBar selectedDays={days} action={<><DigestToggle /><ExportButton days={days} /><RefreshButton /></>} />

      {/* KPIs */}
      <Section title="Overview">
        <div className={styles.kpiGrid}>
          <KPICard
            label="Total tokens"
            value={formatTokens(aggregated.total)}
            sub={`${dayLabel(days)} across all tools`}
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
            sub={totalCostUSD > 0 ? `${dayLabel(days)} across all tools` : 'No cost data available yet'}
          />
          {forecast && (
            <KPICard
              label="Projected this month"
              value={formatCost(forecast.forecastUSD)}
              sub={`~${formatCost(forecast.avgPerDay)}/day avg · ${forecast.daysLeft} day${forecast.daysLeft !== 1 ? 's' : ''} left`}
            />
          )}
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
          ...(pluginSeries.length > 0 ? [{
            id: 'timeline',
            defaultPos: { x: hasTokens ? 4 : 0, y: 0, w: hasTokens ? 8 : 12, h: 6, minW: 4, minH: 4 },
            content: (
              <Section title={`Daily usage by tool — ${dayLabel(days).toLowerCase()}`}>
                <AggregatedTimeline series={pluginSeries} days={days} />
              </Section>
            ),
          }] : []),
          ...(providerLimits.length > 0 ? [{
            id: 'limitStatus',
            defaultPos: { x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
            content: (
              <Section title="Quota status — today">
                <LimitStatus limits={providerLimits} />
              </Section>
            ),
          }] : []),
          ...(hourlyActivity.length > 0 ? [{
            id: 'hourlyHeatmap',
            defaultPos: { x: providerLimits.length > 0 ? 6 : 0, y: 6, w: providerLimits.length > 0 ? 6 : 12, h: 4, minW: 4, minH: 3 },
            content: (
              <Section title="Activity by hour of day">
                <HourlyHeatmap activity={hourlyActivity} />
              </Section>
            ),
          }] : []),
          ...(hasCost ? [{
            id: 'costTimeline',
            defaultPos: { x: 0, y: 10, w: 12, h: 4, minW: 4, minH: 3 },
            content: (
              <Section title={`Daily cost — ${dayLabel(days).toLowerCase()}`}>
                <CostTimeline dailyCost={dailyCost} days={days} />
              </Section>
            ),
          }] : []),
          ...(dailyActivity.length > 0 ? [{
            id: 'heatmap',
            defaultPos: { x: 0, y: 14, w: 12, h: 5, minW: 6, minH: 4 },
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

      {/* Cross-tool project attribution */}
      {unifiedProjects.length > 0 && (
        <Section title="Projects">
          <UnifiedProjectTable projects={unifiedProjects} projectFilter={projectFilter} />
        </Section>
      )}

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
