import { registry } from '@/plugins'

export const dynamic = 'force-dynamic'

interface ExportRecord {
  pluginId: string
  pluginName: string
  date: string
  tokens: number
  costUSD: number
  model: string
  project: string
}

function escapeCSV(value: string | number): string {
  const str = String(value)
  return str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')
    ? `"${str.replace(/"/g, '""')}"`
    : str
}

function toCSV(records: ExportRecord[]): string {
  const cols: (keyof ExportRecord)[] = ['pluginId', 'pluginName', 'date', 'tokens', 'costUSD', 'model', 'project']
  const lines: string[] = [cols.join(',')]
  for (const r of records) {
    lines.push(cols.map((c) => escapeCSV(r[c])).join(','))
  }
  return lines.join('\r\n')
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)

  const rawDays = Number(searchParams.get('days') ?? '30')
  const days = rawDays === 0 || rawDays >= 9999 ? rawDays : Math.min(Math.max(rawDays, 1), 365)
  const format = searchParams.get('format') === 'json' ? 'json' : 'csv'
  const pluginsParam = searchParams.get('plugins') ?? 'all'

  const allPlugins = registry.getAll()
  const targetPlugins =
    pluginsParam === 'all'
      ? allPlugins
      : allPlugins.filter((p) => p.id === pluginsParam)

  const available = await Promise.all(
    targetPlugins.map((p) => p.isAvailable().catch(() => false))
  )
  const activePlugins = targetPlugins.filter((_, i) => available[i])

  const results = await Promise.allSettled(
    activePlugins.map((p) => p.collect({ days }))
  )

  const records: ExportRecord[] = []

  for (let i = 0; i < activePlugins.length; i++) {
    const result = results[i]
    const plugin = activePlugins[i]
    if (result.status !== 'fulfilled') continue

    const { summary } = result.value
    const costMap = new Map(summary.dailyCost.map((d) => [d.date, d.costUSD]))
    const topModel = summary.topModels[0]?.model ?? ''
    const topProject = summary.topProjects[0]?.name ?? ''

    for (const day of summary.dailyActivity) {
      records.push({
        pluginId: plugin.id,
        pluginName: plugin.name,
        date: day.date,
        tokens: day.tokens,
        costUSD: costMap.get(day.date) ?? 0,
        model: topModel,
        project: topProject,
      })
    }
  }

  records.sort(
    (a, b) => b.date.localeCompare(a.date) || a.pluginId.localeCompare(b.pluginId)
  )

  if (format === 'json') {
    return Response.json(records, {
      headers: {
        'Content-Disposition': `attachment; filename="aitokentracker-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  }

  const csv = toCSV(records)
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="aitokentracker-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
