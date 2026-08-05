import { notFound } from 'next/navigation'
import { registry } from '@/plugins'
import type { PluginStatus, AvailabilityResult } from '@/plugins/core/types'
import { Shell } from '@/components/layout/Shell'
import { KPICard } from '@/components/dashboard/KPICard'
import { Section } from '@/components/dashboard/Section'
import { TokenBreakdown } from '@/components/dashboard/TokenBreakdown'
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap'
import { TimelineChart } from '@/components/dashboard/TimelineChart'
import { ConversationTable } from '@/components/dashboard/ConversationTable'
import { ModelStackedChart } from '@/components/dashboard/ModelStackedChart'
import { ModelTimelineChart } from '@/components/dashboard/ModelTimelineChart'
import { SubAgentChart } from '@/components/dashboard/SubAgentChart'
import { SkillsChart } from '@/components/dashboard/SkillsChart'
import { MCPChart } from '@/components/dashboard/MCPChart'
import { TopToolsChart } from '@/components/dashboard/TopToolsChart'
import { ToolCategoryDonut } from '@/components/dashboard/ToolCategoryDonut'
import { HooksPanel } from '@/components/dashboard/HooksPanel'
import { HourlyHeatmap } from '@/components/dashboard/HourlyHeatmap'
import { CostTimeline } from '@/components/dashboard/CostTimeline'
import { ProjectTable } from '@/components/dashboard/ProjectTable'
import { DurationHistogram, type DurationBucket } from '@/components/dashboard/DurationHistogram'
import { DashboardGrid, type WidgetDef } from '@/components/dashboard/DashboardGrid'
import { PluginBanner } from '@/components/dashboard/PluginBanner'
import { ControlBar } from '@/components/ui/ControlBar'
import { LiveUpdater } from '@/components/ui/LiveUpdater'
import { ExportButton } from '@/components/ui/ExportButton'
import { NotificationEvaluator } from '@/components/dashboard/NotificationEvaluator'
import { formatTokens, formatRelativeTime, formatNumber, formatCost } from '@/lib/format'
import styles from './page.module.css'

const VALID_DAYS = [0, 1, 7, 15, 30, 60, 90, 9999] as const
const DEFAULT_DAYS = 30

async function getPluginStatuses(): Promise<PluginStatus[]> {
  const plugins = registry.getAll()
  return Promise.all(
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
}

function parseDays(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw ?? '')
  return VALID_DAYS.includes(n as (typeof VALID_DAYS)[number]) ? n : DEFAULT_DAYS
}

function dayLabel(days: number): string {
  if (days === 0) return 'Today'
  if (days >= 9999) return 'All time'
  return `Last ${days} day${days === 1 ? '' : 's'}`
}

export default async function PluginPage({
  params,
  searchParams,
}: {
  params: Promise<{ pluginId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { pluginId } = await params
  const sp = await searchParams
  const days = parseDays(sp.days)
  const initialSearch = typeof sp.search === 'string' ? sp.search : ''

  const plugin = registry.get(pluginId)
  if (!plugin) notFound()

  const availabilityResult = await plugin.isAvailable().catch((): AvailabilityResult => ({ available: false, reason: 'parse_error' }))
  const available = availabilityResult.available
  const unavailabilityReason = availabilityResult.reason
  const statuses = await getPluginStatuses()

  if (!available) {
    const isPlaceholder = unavailabilityReason === 'placeholder'

    return (
      <Shell plugins={statuses} activePluginId={pluginId} selectedDays={days}>
        <ControlBar activePluginId={pluginId} selectedDays={days} dataPath={plugin.dataPath} />
        <PluginBanner name={plugin.name} unavailabilityReason={unavailabilityReason} />
        <div className={styles.unavailable}>
          <div className={styles.unavailableIcon}>{plugin.icon}</div>
          <h1 className={styles.unavailableTitle}>{plugin.name}</h1>
          <p className={styles.unavailableDesc}>{plugin.description}</p>
          {isPlaceholder ? (
            <p className={styles.unavailableHint}>
              Support for this tool is coming soon. The data parser for {plugin.name} is not yet
              implemented — check back in a future release.
            </p>
          ) : unavailabilityReason === 'parse_error' ? (
            <>
              <p className={styles.unavailablePath}>
                Data path: <code>{plugin.dataPath || 'Not configured'}</code>
              </p>
              <p className={styles.unavailableHint}>
                Data files were found but could not be read. This may be caused by a recent format
                change in {plugin.name} — try refreshing, or report the issue if it persists.
              </p>
            </>
          ) : (
            <>
              <p className={styles.unavailablePath}>
                Data path: <code>{plugin.dataPath || 'Not configured'}</code>
              </p>
              <p className={styles.unavailableHint}>
                This plugin is not yet available on your machine. Once the tool is installed and
                used, data will appear here automatically.
              </p>
            </>
          )}
        </div>
      </Shell>
    )
  }

  const data = await plugin.collect({ days })
  const { summary } = data
  const hasData = summary.totalTokens.total > 0 || summary.totalConversations > 0

  const today = new Date().toISOString().split('T')[0]
  const todayTokens = summary.dailyActivity.find((d) => d.date === today)?.tokens ?? 0

  const durationBuckets: DurationBucket[] = (() => {
    const buckets: DurationBucket[] = [
      { label: '< 5 min', count: 0 },
      { label: '5–30 min', count: 0 },
      { label: '30 min–2 hr', count: 0 },
      { label: '2 hr+', count: 0 },
    ]
    for (const conv of summary.conversations) {
      const mins = (new Date(conv.lastActivity).getTime() - new Date(conv.created).getTime()) / 60000
      if (mins < 5) buckets[0].count++
      else if (mins < 30) buckets[1].count++
      else if (mins < 120) buckets[2].count++
      else buckets[3].count++
    }
    return buckets
  })()

  const caps = plugin.capabilities
  const hasHourly = summary.hourlyActivity.length > 0
  const hasTokens = summary.totalTokens.total > 0
  // Suppress cost widget for plugins that explicitly declare no cost support
  const hasCost = summary.totalCostUSD > 0 && caps?.cost !== false
  const hasHooks = summary.hooks.length > 0
  // Suppress projects/sessions widgets for plugins that don't support them
  const hasProjects = summary.topProjects.length > 0 && caps?.projects !== false
  const hasConversations = summary.conversations.length > 0 && caps?.sessions !== false
  const hasModels = summary.topModels.length > 0 && caps?.models !== false

  const widgets: WidgetDef[] = hasData ? [
    // ── row 0: token breakdown (left) + daily usage (right) ──
    ...(hasTokens ? [{
      id: 'tokenBreakdown',
      defaultPos: { x: 0, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
      content: (
        <Section title="Token breakdown">
          <TokenBreakdown tokens={summary.totalTokens} />
        </Section>
      ),
    }] : []),
    {
      id: 'timeline',
      defaultPos: { x: hasTokens ? 4 : 0, y: 0, w: hasTokens ? 8 : 12, h: 6, minW: 4, minH: 3 },
      content: (
        <Section title={`Daily usage — ${dayLabel(days).toLowerCase()}`}>
          <TimelineChart activity={summary.dailyActivity} days={days} />
        </Section>
      ),
    },

    // ── cost timeline (full width, conditional) ──
    ...(hasCost ? [{
      id: 'costTimeline',
      defaultPos: { x: 0, y: 100, w: 12, h: 4, minW: 4, minH: 3 },
      content: (
        <Section title={`Daily cost — ${dayLabel(days).toLowerCase()}`}>
          <CostTimeline
            dailyCost={summary.dailyCost}
            days={days}
            dailyCostWithoutCache={summary.dailyCostWithoutCache.length > 0 ? summary.dailyCostWithoutCache : undefined}
          />
        </Section>
      ),
    }] : []),

    // ── activity heatmap (full width) ──
    ...(summary.dailyActivity.length > 0 ? [{
      id: 'heatmap',
      defaultPos: { x: 0, y: 200, w: hasHourly ? 6 : 12, h: 5, minW: 6, minH: 4 },
      content: (
        <Section title={`Activity — ${new Date().getFullYear()}`}>
          <ActivityHeatmap activity={summary.dailyActivity} />
        </Section>
      ),
    }] : []),

    // ── hourly heatmap ──
    ...(hasHourly ? [{
      id: 'hourlyHeatmap',
      defaultPos: { x: summary.dailyActivity.length > 0 ? 6 : 0, y: 200, w: 6, h: 5, minW: 4, minH: 3 },
      content: (
        <Section title="Activity by hour of day">
          <HourlyHeatmap activity={summary.hourlyActivity} />
        </Section>
      ),
    }] : []),

    // ── model breakdown + model transition timeline ──
    ...(hasModels ? [{
      id: 'models',
      defaultPos: { x: 0, y: 300, w: summary.modelShareByDay.length > 0 ? 5 : 12, h: 6, minW: 4, minH: 4 },
      content: (
        <Section title="Models — token breakdown">
          <ModelStackedChart models={summary.topModels} />
        </Section>
      ),
    }] : []),
    ...(summary.modelShareByDay.length > 0 ? [{
      id: 'modelTimeline',
      defaultPos: { x: hasModels ? 5 : 0, y: 300, w: hasModels ? 7 : 12, h: 6, minW: 4, minH: 4 },
      content: (
        <Section title={`Model usage over time — ${dayLabel(days).toLowerCase()}`}>
          <ModelTimelineChart data={summary.modelShareByDay} days={days} />
        </Section>
      ),
    }] : []),

    // ── sub-agents · skills · MCPs ──
    {
      id: 'subAgents',
      defaultPos: { x: 0, y: 400, w: 4, h: 5, minW: 3, minH: 3 },
      content: (
        <Section title="Sub-agents">
          <SubAgentChart subAgents={summary.subAgents} />
        </Section>
      ),
    },
    {
      id: 'skills',
      defaultPos: { x: 4, y: 400, w: 4, h: 5, minW: 3, minH: 3 },
      content: (
        <Section title="Skills invoked">
          <SkillsChart skills={summary.skills} />
        </Section>
      ),
    },
    {
      id: 'mcp',
      defaultPos: { x: 8, y: 400, w: 4, h: 5, minW: 3, minH: 3 },
      content: (
        <Section title="MCP servers">
          <MCPChart servers={summary.mcpServers} />
        </Section>
      ),
    },

    // ── tool category donut + top tools ──
    {
      id: 'toolDonut',
      defaultPos: { x: 0, y: 500, w: 6, h: 6, minW: 3, minH: 4 },
      content: (
        <Section title="Tool usage by category">
          <ToolCategoryDonut tools={summary.topTools} />
        </Section>
      ),
    },
    {
      id: 'topTools',
      defaultPos: { x: 6, y: 500, w: 6, h: 6, minW: 3, minH: 4 },
      content: (
        <Section title="Top tools by call count">
          <TopToolsChart tools={summary.topTools} />
        </Section>
      ),
    },

    // ── hooks (full width, conditional) ──
    ...(hasHooks ? [{
      id: 'hooks',
      defaultPos: { x: 0, y: 600, w: 12, h: 4, minW: 4, minH: 3 },
      content: (
        <Section title="Hooks configured">
          <HooksPanel hooks={summary.hooks} />
        </Section>
      ),
    }] : []),

    // ── duration histogram + projects ──
    {
      id: 'durationHistogram',
      defaultPos: { x: 0, y: 700, w: hasProjects ? 6 : 12, h: 5, minW: 3, minH: 3 },
      content: (
        <Section title="Session duration">
          <DurationHistogram buckets={durationBuckets} />
        </Section>
      ),
    },
    ...(hasProjects ? [{
      id: 'projectTable',
      defaultPos: { x: 6, y: 700, w: 6, h: 5, minW: 3, minH: 3 },
      content: (
        <Section title="Top projects">
          <ProjectTable projects={summary.topProjects} />
        </Section>
      ),
    }] : []),

    // ── recent conversations (full width, conditional) ──
    ...(hasConversations ? [{
      id: 'conversations',
      defaultPos: { x: 0, y: 800, w: 12, h: 7, minW: 4, minH: 4 },
      content: (
        <Section title="Recent conversations">
          <ConversationTable conversations={summary.conversations} limit={25} initialSearch={initialSearch} />
        </Section>
      ),
    }] : []),
  ] : []

  return (
    <Shell plugins={statuses} activePluginId={pluginId} selectedDays={days}>
      <LiveUpdater />
      <NotificationEvaluator todayTokens={todayTokens} />
      <ControlBar activePluginId={pluginId} selectedDays={days} dataPath={plugin.dataPath} action={<ExportButton days={days} pluginId={pluginId} />} />
      <PluginBanner name={plugin.name} />

      {/* KPI row */}
      <Section>
        <div className={styles.kpiGrid}>
          <KPICard
            label="Total tokens"
            value={formatTokens(summary.totalTokens.total)}
            sub={dayLabel(days)}
            accent
          />
          <KPICard
            label="Conversations"
            value={formatNumber(summary.totalConversations)}
            sub={`${summary.activeConversations} currently active`}
          />
          <KPICard
            label="Tool calls"
            value={formatNumber(summary.topTools.reduce((s, t) => s + t.callCount, 0))}
            sub={`${summary.topTools.length} unique tools`}
          />
          <KPICard
            label="Last activity"
            value={formatRelativeTime(summary.lastActivity)}
            sub={summary.lastActivity ? new Date(summary.lastActivity).toLocaleDateString() : '—'}
          />
          <KPICard
            label="Total cost"
            value={hasCost ? formatCost(summary.totalCostUSD) : 'Not tracked'}
            sub={hasCost ? dayLabel(days) : 'No cost data available yet'}
          />
          {summary.cacheRoiUSD > 0 && (
            <KPICard
              label="Cache savings"
              value={formatCost(summary.cacheRoiUSD)}
              sub={`${dayLabel(days)} vs. no-cache pricing`}
            />
          )}
        </div>
      </Section>

      {/* Draggable / resizable widget grid */}
      {widgets.length > 0 && (
        <DashboardGrid widgets={widgets} pluginId={pluginId} />
      )}
    </Shell>
  )
}
