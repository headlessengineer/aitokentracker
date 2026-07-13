import type { TokenPlugin, PluginData, CollectOptions } from '../core/types'

const KIRO_PLUGIN: TokenPlugin = {
  id: 'kiro',
  name: 'Kiro',
  icon: 'Ki',
  description: 'Tracks token usage from Amazon Kiro AI coding sessions',
  dataPath: '',

  async isAvailable(): Promise<boolean> {
    return false
  },

  async collect(_options?: CollectOptions): Promise<PluginData> {
    return {
      pluginId: 'kiro',
      summary: {
        totalTokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        totalConversations: 0,
        activeConversations: 0,
        topProjects: [],
        topModels: [],
        dailyActivity: [],
        lastActivity: null,
        conversations: [],
        topTools: [],
        subAgents: [],
        skills: [],
        mcpServers: [],
        hooks: [],
      },
      collectedAt: new Date().toISOString(),
    }
  },
}

export default KIRO_PLUGIN
