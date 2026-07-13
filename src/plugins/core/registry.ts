import type { TokenPlugin } from './types'

class PluginRegistry {
  private readonly plugins: Map<string, TokenPlugin> = new Map()

  register(plugin: TokenPlugin): void {
    this.plugins.set(plugin.id, plugin)
  }

  get(id: string): TokenPlugin | undefined {
    return this.plugins.get(id)
  }

  getAll(): TokenPlugin[] {
    return Array.from(this.plugins.values())
  }
}

export const registry = new PluginRegistry()
