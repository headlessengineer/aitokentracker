import type { TokenPlugin, CollectOptions, PluginData, PluginCapabilities } from './types'
import { getCached, setCached } from '../../lib/cache'

// Applied to any plugin that does not declare its own capabilities.
// Represents the common case: JSONL/SQLite plugins that produce cost,
// model stats, project stats, and per-session data after task 1.1.
const DEFAULT_CAPABILITIES: PluginCapabilities = {
  cost:      true,
  models:    true,
  projects:  true,
  sessions:  true,
  rateLimit: false,
}

class PluginRegistry {
  private readonly plugins: Map<string, TokenPlugin> = new Map()

  register(plugin: TokenPlugin): void {
    const originalCollect = plugin.collect.bind(plugin)

    const cachedCollect = async (options?: CollectOptions): Promise<PluginData> => {
      const days = options?.days ?? 30
      const cached = getCached(plugin.id, days, plugin.dataPath)
      if (cached) return cached
      const data = await originalCollect(options)
      setCached(plugin.id, days, data)
      return data
    }

    // Guarantee capabilities is always defined after registration
    const capabilities: PluginCapabilities = plugin.capabilities ?? DEFAULT_CAPABILITIES

    this.plugins.set(plugin.id, { ...plugin, capabilities, collect: cachedCollect })
  }

  get(id: string): TokenPlugin | undefined {
    return this.plugins.get(id)
  }

  getAll(): TokenPlugin[] {
    return Array.from(this.plugins.values())
  }
}

export const registry = new PluginRegistry()
