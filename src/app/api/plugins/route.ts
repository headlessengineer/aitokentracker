import { registry } from '@/plugins'
import type { PluginStatus, AvailabilityResult } from '@/plugins/core/types'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const plugins = registry.getAll()

  const statuses: PluginStatus[] = await Promise.all(
    plugins.map(async (plugin) => {
      const ar = await plugin.isAvailable().catch((): AvailabilityResult => ({ available: false, reason: 'parse_error' }))
      return {
        id: plugin.id,
        name: plugin.name,
        icon: plugin.icon,
        description: plugin.description,
        dataPath: plugin.dataPath,
        available: ar.available,
        unavailabilityReason: ar.reason,
      }
    })
  )

  return Response.json(statuses)
}
