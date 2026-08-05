import { clearCache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const pluginId = searchParams.get('pluginId') ?? undefined
  clearCache(pluginId)
  return Response.json({ ok: true, cleared: pluginId ?? 'all' })
}
