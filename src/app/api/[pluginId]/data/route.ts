import { registry } from '@/plugins'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pluginId: string }> }
): Promise<Response> {
  const { pluginId } = await params
  const { searchParams } = new URL(request.url)
  const days = Number(searchParams.get('days') ?? '30')
  const limit = Number(searchParams.get('limit') ?? '100')

  const plugin = registry.get(pluginId)
  if (!plugin) {
    return Response.json({ error: `Plugin '${pluginId}' not found` }, { status: 404 })
  }

  const available = await plugin.isAvailable().catch(() => false)
  if (!available) {
    return Response.json(
      { error: `Plugin '${plugin.name}' is not available on this machine` },
      { status: 503 }
    )
  }

  try {
    const data = await plugin.collect({ days, limit })
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Collection failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
