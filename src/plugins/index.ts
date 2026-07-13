import { registry } from './core/registry'
import CLAUDE_PLUGIN from './claude'
import CODEX_PLUGIN from './codex'
import CURSOR_PLUGIN from './cursor'
import WINDSURF_PLUGIN from './windsurf'
import COPILOT_PLUGIN from './copilot'
import KIRO_PLUGIN from './kiro'
import GEMINI_PLUGIN from './gemini'
import ANTIGRAVITY_PLUGIN from './antigravity'

registry.register(CLAUDE_PLUGIN)
registry.register(CODEX_PLUGIN)
registry.register(CURSOR_PLUGIN)
registry.register(WINDSURF_PLUGIN)
registry.register(COPILOT_PLUGIN)
registry.register(KIRO_PLUGIN)
registry.register(GEMINI_PLUGIN)
registry.register(ANTIGRAVITY_PLUGIN)

export { registry }
export type { TokenPlugin, PluginData, CollectOptions, PluginStatus } from './core/types'
