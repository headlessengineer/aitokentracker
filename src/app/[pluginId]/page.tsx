import { notFound } from 'next/navigation'
import { registry } from '@/plugins'
import type { PluginStatus } from '@/plugins/core/types'
import { Shell } from '@/components/layout/Shell'
import { KPICard } from '@/components/dashboard/KPICard'
import { Section } from '@/components/dashboard/Section'
import { TokenBreakdown } from '@/components/dashboard/TokenBreakdown'
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap'
import { TimelineChart } from '@/components/dashboard/TimelineChart'
import { ConversationTable } from '@/components/dashboard/ConversationTable'
import { ModelChart } from '@/components/dashboard/ModelChart'
import { SubAgentChart } from '@/components/dashboard/SubAgentChart'
import { SkillsChart } from '@/components/dashboard/SkillsChart'
import { MCPChart } from '@/components/dashboard/MCPChart'
import { TopToolsChart } from '@/components/dashboard/TopToolsChart'
import { HooksPanel } from '@/components/dashboard/HooksPanel'
import { ControlBar } from '@/components/ui/ControlBar'
import { NotificationEvaluator } from '@/components/dashboard/NotificationEvaluator'
import { formatTokens, formatRelativeTime, formatNumber } from '@/lib/format'
import styles from './page.module.css'

const VALID_DAYS = [1, 7, 15, 30, 60, 90] as const
const DEFAULT_DAYS = 30

async function getPluginStatuses(): Promise<PluginStatus[]> {
  const plugins = registry.getAll()
  return Promise.all(
    plugins.map(async (p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      description: p.description,
      dataPath: p.dataPath,
      available: await p.isAvailable().catch(() => false),
    }))
  )
}

function parseDays(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw ?? '')
  return VALID_DAYS.includes(n as (typeof VALID_DAYS)[number]) ? n : DEFAULT_DAYS
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

  const plugin = registry.get(pluginId)
  if (!plugin) notFound()

  const available = await plugin.isAvailable().catch(() => false)
  const statuses = await getPluginStatuses()

  if (!available) {
    return (
      <Shell title={plugin.name}>
        <ControlBar plugins={statuses} activePluginId={pluginId} selectedDays={days} />
        <div className={styles.unavailable}>
          <div className={styles.unavailableIcon}>{plugin.icon}</div>
          <h1 className={styles.unavailableTitle}>{plugin.name}</h1>
          <p className={styles.unavailableDesc}>{plugin.description}</p>
          <p className={styles.unavailablePath}>
            Data path: <code>{plugin.dataPath || 'Not configured'}</code>
          </p>
          <p className={styles.unavailableHint}>
            This plugin is not yet available on your machine. Once the tool is installed and used,
            data will appear here automatically.
          </p>
        </div>
      </Shell>
    )
  }

  const data = await plugin.collect({ days })
  const { summary } = data
  const hasData = summary.totalTokens.total > 0 || summary.totalConversations > 0

  const today = new Date().toISOString().split('T')[0]
  const todayTokens = summary.dailyActivity.find((d) => d.date === today)?.tokens ?? 0

  return (
    <Shell title={plugin.name}>
      <NotificationEvaluator todayTokens={todayTokens} />
      <ControlBar plugins={statuses} activePluginId={pluginId} selectedDays={days} />

      {/* KPIs */}
      <Section title={`${plugin.name} — Overview`}>
        <div className={styles.kpiGrid}>
          <KPICard
            label="Total tokens"
            value={formatTokens(summary.totalTokens.total)}
            sub={`Last ${days} day${days === 1 ? '' : 's'}`}
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
        </div>
      </Section>

      {hasData && (
        <>
          {/* Token breakdown + Timeline */}
          {summary.totalTokens.total > 0 ? (
            <div className={styles.twoCol}>
              <div className={styles.card}>
                <Section title="Token breakdown">
                  <TokenBreakdown tokens={summary.totalTokens} />
                </Section>
              </div>
              <div className={styles.card}>
                <Section title={`Daily usage — last ${days} day${days === 1 ? '' : 's'}`}>
                  <TimelineChart activity={summary.dailyActivity} days={days} />
                </Section>
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <Section title={`Daily usage — last ${days} day${days === 1 ? '' : 's'}`}>
                <TimelineChart activity={summary.dailyActivity} days={days} />
              </Section>
            </div>
          )}

          {/* Annual heatmap */}
          {summary.dailyActivity.length > 0 && (
            <div className={styles.card}>
              <Section title={`Activity — ${new Date().getFullYear()}`}>
                <ActivityHeatmap activity={summary.dailyActivity} />
              </Section>
            </div>
          )}

          {/* Models */}
          {summary.topModels.length > 0 && (
            <div className={styles.card}>
              <Section title="Models — token usage">
                <ModelChart models={summary.topModels} />
              </Section>
            </div>
          )}

          {/* Sub-agents · Skills · MCPs — three column */}
          <div className={styles.threeCol}>
            <div className={styles.card}>
              <Section title="Sub-agents">
                <SubAgentChart subAgents={summary.subAgents} />
              </Section>
            </div>
            <div className={styles.card}>
              <Section title="Skills invoked">
                <SkillsChart skills={summary.skills} />
              </Section>
            </div>
            <div className={styles.card}>
              <Section title="MCP servers">
                <MCPChart servers={summary.mcpServers} />
              </Section>
            </div>
          </div>

          {/* Top tools + Hooks — two column */}
          <div className={styles.twoCol}>
            <div className={styles.card}>
              <Section title="Top tools by call count">
                <TopToolsChart tools={summary.topTools} />
              </Section>
            </div>
            <div className={styles.card}>
              <Section title="Hooks configured">
                <HooksPanel hooks={summary.hooks} />
              </Section>
            </div>
          </div>

          {/* Top projects */}
          {summary.topProjects.length > 0 && (
            <div className={styles.card}>
              <Section title="Top projects">
                <div className={styles.barList}>
                  {summary.topProjects.slice(0, 8).map((project) => {
                    const pct = summary.totalTokens.total > 0
                      ? (project.tokens / summary.totalTokens.total) * 100
                      : 0
                    return (
                      <div key={project.name} className={styles.barRow}>
                        <span className={styles.barLabel} title={project.name}>{project.name}</span>
                        <div className={styles.barTrack}>
                          <div className={styles.barFill} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={styles.barValue}>{formatTokens(project.tokens)}</span>
                      </div>
                    )
                  })}
                </div>
              </Section>
            </div>
          )}
        </>
      )}

      {/* Conversations */}
      {summary.conversations.length > 0 && (
        <Section title="Recent conversations">
          <ConversationTable conversations={summary.conversations} limit={25} />
        </Section>
      )}
    </Shell>
  )
}
