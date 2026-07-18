import { registry } from './core/registry'
import CLAUDE_PLUGIN from './claude'
import CODEX_PLUGIN from './codex'
import CURSOR_PLUGIN from './cursor'
import WINDSURF_PLUGIN from './windsurf'
import COPILOT_PLUGIN from './copilot'
import KIRO_PLUGIN from './kiro'
import GEMINI_PLUGIN from './gemini'
import ANTIGRAVITY_PLUGIN from './antigravity'
import OPENCODE_PLUGIN from './opencode'
import AMP_PLUGIN from './amp'
import ROOCODE_PLUGIN from './roocode'
import CLINE_PLUGIN from './cline'
import KILOCODE_PLUGIN from './kilocode'
import HERMES_PLUGIN from './hermes'
import GOOSE_PLUGIN from './goose'
import MUX_PLUGIN from './mux'
import QWEN_PLUGIN from './qwen'
import OPENCLAW_PLUGIN from './openclaw'
import PI_PLUGIN from './pi'
import COMMANDCODE_PLUGIN from './commandcode'
import CODEBUDDY_PLUGIN from './codebuddy'
import GJC_PLUGIN from './gjc'
import ZCODE_PLUGIN from './zcode'
import OPENCODEREVIEW_PLUGIN from './opencodereview'
import KIMI_PLUGIN from './kimi'
import JUNIE_PLUGIN from './junie'
import GROK_PLUGIN from './grok'
import JCODE_PLUGIN from './jcode'
import CODEBUFF_PLUGIN from './codebuff'
import DROID_PLUGIN from './droid'
import KILO_PLUGIN from './kilo'
import MICODE_PLUGIN from './micode'
import ZED_PLUGIN from './zed'
import DEVIN_PLUGIN from './devin'

registry.register(CLAUDE_PLUGIN)
registry.register(CODEX_PLUGIN)
registry.register(CURSOR_PLUGIN)
registry.register(WINDSURF_PLUGIN)
registry.register(COPILOT_PLUGIN)
registry.register(KIRO_PLUGIN)
registry.register(GEMINI_PLUGIN)
registry.register(ANTIGRAVITY_PLUGIN)
registry.register(OPENCODE_PLUGIN)
registry.register(AMP_PLUGIN)
registry.register(ROOCODE_PLUGIN)
registry.register(CLINE_PLUGIN)
registry.register(KILOCODE_PLUGIN)
registry.register(HERMES_PLUGIN)
registry.register(GOOSE_PLUGIN)
registry.register(MUX_PLUGIN)
registry.register(QWEN_PLUGIN)
registry.register(OPENCLAW_PLUGIN)
registry.register(PI_PLUGIN)
registry.register(COMMANDCODE_PLUGIN)
registry.register(CODEBUDDY_PLUGIN)
registry.register(GJC_PLUGIN)
registry.register(ZCODE_PLUGIN)
registry.register(OPENCODEREVIEW_PLUGIN)
registry.register(KIMI_PLUGIN)
registry.register(JUNIE_PLUGIN)
registry.register(GROK_PLUGIN)
registry.register(JCODE_PLUGIN)
registry.register(CODEBUFF_PLUGIN)
registry.register(DROID_PLUGIN)
registry.register(KILO_PLUGIN)
registry.register(MICODE_PLUGIN)
registry.register(ZED_PLUGIN)
registry.register(DEVIN_PLUGIN)

export { registry }
export type { TokenPlugin, PluginData, CollectOptions, PluginStatus } from './core/types'
